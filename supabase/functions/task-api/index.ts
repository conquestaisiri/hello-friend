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

function getRoute(url: URL): string {
  const pathname = url.pathname;
  const patterns = [/^\/functions\/v1\/task-api/, /^\/task-api/];
  for (const p of patterns) {
    if (p.test(pathname)) return pathname.replace(p, '') || '/';
  }
  return pathname || '/';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const route = getRoute(url);
  console.log(`[task-api] ${req.method} ${url.pathname} -> route: ${route}`);

  const userId = getUserId(req);
  if (!userId) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    // ─── POST /tasks - Create a new task ────────────────────
    if (req.method === 'POST' && route === '/tasks') {
      const body = await req.json();
      const { title, description, category, location, urgency, budget, workerCount } = body;

      if (!title || !description || !category) {
        return jsonResponse({ error: 'Title, description, and category are required' }, 400);
      }

      const budgetNum = Number(budget) || 0;
      const workers = Number(workerCount) || 1;
      const totalBudget = budgetNum * workers;
      const platformFee = Math.round(totalBudget * 0.06);
      const grandTotal = totalBudget + platformFee;

      // If budget > 0, check wallet and lock escrow
      if (totalBudget > 0) {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!wallet || Number(wallet.available_balance) < grandTotal) {
          return jsonResponse({
            error: 'Insufficient balance',
            message: `You need ₦${grandTotal.toLocaleString()} but only have ₦${(wallet ? Number(wallet.available_balance) : 0).toLocaleString()}.`,
          }, 400);
        }

        // Deduct from available, add to escrow
        const newAvailable = Number(wallet.available_balance) - grandTotal;
        const newEscrow = Number(wallet.escrow_balance) + grandTotal;

        await supabase
          .from('wallets')
          .update({ available_balance: newAvailable, escrow_balance: newEscrow })
          .eq('user_id', userId);

        // Record escrow transaction
        await supabase.from('wallet_transactions').insert({
          user_id: userId,
          amount: grandTotal,
          transaction_type: 'escrow_lock',
          description: `Task escrow: ${title}`,
          balance_before: Number(wallet.available_balance),
          balance_after: newAvailable,
          status: 'completed',
        });
      }

      // Insert task
      const { data: task, error: taskErr } = await supabase
        .from('tasks')
        .insert({
          requester_id: userId,
          title,
          description,
          category,
          location: location || null,
          urgency: urgency || 'flexible',
          budget: budgetNum,
          platform_fee: platformFee,
          status: 'open',
          funded_from: totalBudget > 0 ? 'wallet' : null,
        })
        .select()
        .single();

      if (taskErr) throw taskErr;

      // Create a notification for the user
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'task_created',
        title: 'Task Posted!',
        message: `Your task "${title}" is now live on the marketplace.`,
        related_entity_type: 'task',
        related_entity_id: task.id,
      });

      return jsonResponse({ task, message: 'Task created successfully' }, 201);
    }

    // ─── GET /tasks - List user's tasks ─────────────────────
    if (req.method === 'GET' && route === '/tasks') {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`requester_id.eq.${userId},helper_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return jsonResponse({ tasks: tasks || [] });
    }

    // ─── GET /tasks/open - List all open tasks ──────────────
    if (req.method === 'GET' && route === '/tasks/open') {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return jsonResponse({ tasks: tasks || [] });
    }

    // ─── POST /notifications/welcome - Create welcome notification ──
    if (req.method === 'POST' && route === '/notifications/welcome') {
      const { displayName } = await req.json();
      
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'welcome',
        title: 'Welcome to HelpChain! 🎉',
        message: `Hey ${displayName || 'there'}! Welcome to HelpChain. Start by posting a task or browsing available tasks to help others. Complete your profile to increase your visibility and earn trust!`,
      });

      return jsonResponse({ success: true });
    }

    // ─── GET /notifications ─────────────────────────────────
    if (req.method === 'GET' && route === '/notifications') {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return jsonResponse({ notifications: notifications || [] });
    }

    // ─── PATCH /notifications/:id/read ──────────────────────
    if (req.method === 'PATCH' && route.startsWith('/notifications/') && route.endsWith('/read')) {
      const notifId = route.replace('/notifications/', '').replace('/read', '');
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notifId)
        .eq('user_id', userId);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    // ─── PATCH /notifications/read-all ──────────────────────
    if (req.method === 'PATCH' && route === '/notifications/read-all') {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return jsonResponse({ success: true });
    }

    // ─── Profile routes ─────────────────────────────────────
    // GET /profile
    if (req.method === 'GET' && route === '/profile') {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return jsonResponse({ profile });
    }

    // PUT /profile - Update profile
    if (req.method === 'PUT' && route === '/profile') {
      const body = await req.json();
      const { fullName, bio, location, skills, country, baseCurrency, avatarUrl } = body;

      // Check if profile exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .update({
            ...(fullName !== undefined && { full_name: fullName }),
            ...(bio !== undefined && { bio }),
            ...(location !== undefined && { location }),
            ...(skills !== undefined && { skills }),
            ...(country !== undefined && { country }),
            ...(baseCurrency !== undefined && { base_currency: baseCurrency }),
            ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        return jsonResponse({ profile });
      } else {
        // Create profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            full_name: fullName || 'User',
            email: body.email || `${userId.slice(0, 8)}@helpchain.app`,
            bio: bio || '',
            location: location || '',
            skills: skills || [],
            country: country || 'NG',
            base_currency: baseCurrency || 'NGN',
            avatar_url: avatarUrl || null,
          })
          .select()
          .single();

        if (error) throw error;
        return jsonResponse({ profile }, 201);
      }
    }

    return jsonResponse({ error: 'Not found' }, 404);
  } catch (err: any) {
    console.error('[task-api] Error:', err);
    return jsonResponse({ error: err.message || 'Internal server error' }, 500);
  }
});
