import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getUserId(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const payload = decodeJwt(token);
  return payload?.user_id || payload?.sub || null;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const userId = getUserId(req);
  if (!userId) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const url = new URL(req.url);
  const route = url.pathname.replace(/^\/functions\/v1\/wallet-api/, '') || '/';

  try {
    // ─── GET /wallet ────────────────────────────────────────
    if (req.method === 'GET' && route === '/wallet') {
      let { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!wallet) {
        const { data: newWallet, error: createErr } = await supabase
          .from('wallets')
          .insert({ user_id: userId, available_balance: 0, escrow_balance: 0, currency: 'NGN' })
          .select()
          .single();
        if (createErr) throw createErr;
        wallet = newWallet;
      }

      return jsonResponse({
        wallet: {
          id: wallet.id,
          userId: wallet.user_id,
          availableBalance: Number(wallet.available_balance),
          escrowBalance: Number(wallet.escrow_balance),
          status: wallet.wallet_status,
          createdAt: wallet.created_at,
          updatedAt: wallet.updated_at,
        },
      });
    }

    // ─── GET /wallet/transactions ───────────────────────────
    if (req.method === 'GET' && route === '/wallet/transactions') {
      const { data: txs, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;

      return jsonResponse({
        transactions: (txs || []).map((tx: any) => ({
          id: tx.id,
          type: tx.transaction_type,
          amount: Number(tx.amount),
          status: tx.status,
          description: tx.description || '',
          reference: tx.reference,
          balanceBefore: Number(tx.balance_before),
          balanceAfter: Number(tx.balance_after),
          createdAt: tx.created_at,
        })),
      });
    }

    // ─── POST /wallet/deposit/initialize ────────────────────
    if (req.method === 'POST' && route === '/wallet/deposit/initialize') {
      const { amount, callbackUrl } = await req.json();

      if (!amount || amount < 100) {
        return jsonResponse({ message: 'Minimum deposit is ₦100' }, 400);
      }

      const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY');
      if (!paystackKey) throw new Error('Payment service not configured');

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', userId)
        .maybeSingle();

      const email = profile?.email || `${userId.slice(0, 8)}@helpchain.app`;
      const reference = `hc_${Date.now()}_${userId.slice(0, 6)}`;

      // Create pending deposit record
      await supabase.from('deposits').insert({
        user_id: userId,
        amount,
        status: 'pending',
        paystack_reference: reference,
      });

      // Initialize Paystack transaction
      const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amount * 100), // kobo
          reference,
          callback_url: callbackUrl || 'https://helpchain.lovable.app/wallet',
          metadata: {
            user_id: userId,
            custom_fields: [
              { display_name: 'User ID', variable_name: 'user_id', value: userId },
            ],
          },
        }),
      });

      const paystackData = await paystackRes.json();
      if (!paystackData.status) {
        throw new Error(paystackData.message || 'Failed to initialize payment');
      }

      return jsonResponse({
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
        access_code: paystackData.data.access_code,
      });
    }

    // ─── POST /wallet/deposit/verify ────────────────────────
    if (req.method === 'POST' && route === '/wallet/deposit/verify') {
      const { reference } = await req.json();

      const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY');
      if (!paystackKey) throw new Error('Payment service not configured');

      // Verify with Paystack
      const verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        { headers: { Authorization: `Bearer ${paystackKey}` } },
      );
      const verifyData = await verifyRes.json();

      if (!verifyData.status || verifyData.data?.status !== 'success') {
        return jsonResponse({ message: 'Payment not yet successful' }, 400);
      }

      // Check if already processed
      const { data: deposit } = await supabase
        .from('deposits')
        .select('status')
        .eq('paystack_reference', reference)
        .maybeSingle();

      if (deposit?.status === 'completed') {
        return jsonResponse({ message: 'Already processed', alreadyProcessed: true });
      }

      const amount = verifyData.data.amount / 100; // kobo → naira

      // Get current wallet
      let { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      const prevBalance = Number(wallet?.available_balance || 0);
      const newBalance = prevBalance + amount;

      if (wallet) {
        await supabase
          .from('wallets')
          .update({ available_balance: newBalance })
          .eq('id', wallet.id);
      } else {
        await supabase.from('wallets').insert({
          user_id: userId,
          available_balance: newBalance,
          escrow_balance: 0,
          currency: 'NGN',
        });
      }

      // Record transaction
      await supabase.from('wallet_transactions').insert({
        user_id: userId,
        transaction_type: 'deposit',
        amount,
        balance_before: prevBalance,
        balance_after: newBalance,
        status: 'completed',
        description: `Deposit of ₦${amount.toLocaleString()} via Paystack`,
        reference,
      });

      // Mark deposit completed
      await supabase
        .from('deposits')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          webhook_verified: true,
          payment_method: verifyData.data.channel || 'card',
        })
        .eq('paystack_reference', reference);

      return jsonResponse({ success: true, amount, newBalance });
    }

    // ─── POST /wallet/withdraw ──────────────────────────────
    if (req.method === 'POST' && route === '/wallet/withdraw') {
      const { amount, bankAccountId, walletAddress } = await req.json();

      if (!amount || amount <= 0) {
        return jsonResponse({ message: 'Invalid amount' }, 400);
      }

      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      const balance = Number(wallet?.available_balance || 0);
      if (balance < amount) {
        return jsonResponse({ message: 'Insufficient balance' }, 400);
      }

      const newBalance = balance - amount;

      await supabase
        .from('wallets')
        .update({ available_balance: newBalance })
        .eq('id', wallet!.id);

      await supabase.from('withdrawals').insert({
        user_id: userId,
        amount,
        status: 'pending',
        bank_account_id: bankAccountId || null,
      });

      await supabase.from('wallet_transactions').insert({
        user_id: userId,
        transaction_type: 'withdrawal',
        amount,
        balance_before: balance,
        balance_after: newBalance,
        status: 'pending',
        description: walletAddress
          ? `Withdrawal to Solana wallet`
          : `Withdrawal to bank account`,
      });

      return jsonResponse({
        success: true,
        message: 'Withdrawal submitted. Processing in 1-3 business days.',
      });
    }

    return jsonResponse({ error: 'Not found' }, 404);
  } catch (err: any) {
    console.error('Wallet API error:', err);
    return jsonResponse({ error: err.message || 'Internal server error' }, 500);
  }
});
