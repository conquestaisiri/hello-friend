import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWallet, type Transaction } from "@/hooks/use-wallet";
import { useLocalizationStore } from "@/stores/localization-store";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle,
  TrendingUp, Shield, CircleDollarSign, Coins, Eye, EyeOff,
  Download, Upload, Filter, CreditCard, Building, Globe, Loader2, ExternalLink, Link2
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const NGN_TO_USDC_RATE = 1500;
const WALLET_API = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-api`;

function TransactionIcon({ type }: { type: string }) {
  switch (type) {
    case "deposit": return <ArrowDownLeft className="h-4 w-4 text-chart-2" />;
    case "withdrawal": return <ArrowUpRight className="h-4 w-4 text-destructive" />;
    case "escrow_lock": return <Shield className="h-4 w-4 text-chart-4" />;
    case "escrow_release": return <ArrowUpRight className="h-4 w-4 text-chart-3" />;
    case "escrow_refund": return <ArrowDownLeft className="h-4 w-4 text-chart-1" />;
    case "earning": return <TrendingUp className="h-4 w-4 text-chart-2" />;
    case "fee": return <CircleDollarSign className="h-4 w-4 text-muted-foreground" />;
    default: return <CircleDollarSign className="h-4 w-4" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "completed" ? "default" : status === "pending" ? "secondary" : "destructive"} className="text-xs">
      {status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
      {status === "pending" && <Clock className="h-3 w-3 mr-1" />}
      {status === "failed" && <XCircle className="h-3 w-3 mr-1" />}
      {status}
    </Badge>
  );
}

// Phantom wallet detection
function getPhantomProvider() {
  if (typeof window !== "undefined" && "solana" in window) {
    const provider = (window as any).solana;
    if (provider?.isPhantom) return provider;
  }
  return null;
}

function WalletPageContent() {
  const {
    availableBalance, escrowBalance, transactions, isLoading, transactionsLoading,
    initializeDeposit, verifyDeposit, withdraw, refetchWallet,
    depositPending, verifyPending, withdrawPending,
  } = useWallet();
  const { user, getIdToken } = useFirebaseAuth();
  const { formatLocal, currency } = useLocalizationStore();
  const { toast } = useToast();

  const [showAssets, setShowAssets] = useState(false);
  const [filter, setFilter] = useState("all");
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("card");
  const [withdrawMethod, setWithdrawMethod] = useState("bank");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Bank withdrawal fields
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [banksLoading, setBanksLoading] = useState(false);

  // Phantom wallet state
  const [phantomConnected, setPhantomConnected] = useState(false);
  const [phantomAddress, setPhantomAddress] = useState("");
  const [phantomAvailable, setPhantomAvailable] = useState(false);

  const totalBalance = availableBalance + escrowBalance;
  const usdcEquivalent = (availableBalance / NGN_TO_USDC_RATE).toFixed(2);
  const filteredTransactions = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  // Check for Phantom on mount
  useEffect(() => {
    const provider = getPhantomProvider();
    setPhantomAvailable(!!provider);
    if (provider?.isConnected && provider.publicKey) {
      setPhantomConnected(true);
      setPhantomAddress(provider.publicKey.toString());
    }
  }, []);

  // Load banks when withdrawal opens with bank method
  useEffect(() => {
    if (withdrawOpen && withdrawMethod === "bank" && banks.length === 0) {
      loadBanks();
    }
  }, [withdrawOpen, withdrawMethod]);

  // Auto-verify account when bank + 10-digit account number
  useEffect(() => {
    if (selectedBank && accountNumber.length === 10) {
      verifyBankAccount();
    } else {
      setAccountName("");
    }
  }, [selectedBank, accountNumber]);

  const loadBanks = async () => {
    setBanksLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`${WALLET_API}/banks`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setBanks(data.banks || []);
      }
    } catch (err) {
      console.error("Failed to load banks:", err);
    } finally {
      setBanksLoading(false);
    }
  };

  const verifyBankAccount = async () => {
    setVerifyingAccount(true);
    setAccountName("");
    try {
      const token = await getIdToken();
      const res = await fetch(`${WALLET_API}/verify-account`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber, bankCode: selectedBank }),
      });
      if (res.ok) {
        const data = await res.json();
        setAccountName(data.accountName || "");
      } else {
        const data = await res.json();
        toast({ title: "Verification failed", description: data.message, variant: "destructive" });
      }
    } catch (err) {
      console.error("Failed to verify account:", err);
    } finally {
      setVerifyingAccount(false);
    }
  };

  const connectPhantom = async () => {
    const provider = getPhantomProvider();
    if (!provider) {
      window.open("https://phantom.app/", "_blank");
      return;
    }
    try {
      const resp = await provider.connect();
      setPhantomConnected(true);
      setPhantomAddress(resp.publicKey.toString());
      setCryptoAddress(resp.publicKey.toString());
      toast({ title: "Wallet Connected", description: `Connected to ${resp.publicKey.toString().slice(0, 8)}...` });
    } catch (err: any) {
      toast({ title: "Connection failed", description: err.message, variant: "destructive" });
    }
  };

  const disconnectPhantom = async () => {
    const provider = getPhantomProvider();
    if (provider) {
      await provider.disconnect();
    }
    setPhantomConnected(false);
    setPhantomAddress("");
    setCryptoAddress("");
  };

  // Handle Paystack redirect callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("reference") || params.get("trxref");

    if (ref && user) {
      window.history.replaceState({}, "", "/wallet");
      setVerifyingPayment(true);

      verifyDeposit(ref)
        .then((result) => {
          toast({ title: "💰 Deposit Successful!", description: `₦${result.amount?.toLocaleString() || ""} has been added to your wallet.` });
          refetchWallet();
        })
        .catch((err) => {
          toast({ title: "Payment Verification", description: err.message || "Could not verify payment.", variant: "destructive" });
        })
        .finally(() => setVerifyingPayment(false));
    }
  }, [user]);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount < 100) {
      toast({ title: "Invalid amount", description: "Minimum deposit is ₦100", variant: "destructive" });
      return;
    }
    try {
      const result = await initializeDeposit(amount);
      if (result.authorization_url) {
        window.location.href = result.authorization_url;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (err: any) {
      toast({ title: "Deposit failed", description: err.message || "Unable to start payment.", variant: "destructive" });
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    try {
      const result = await withdraw(
        amount,
        withdrawMethod === "bank" ? selectedBank : undefined,
        withdrawMethod === "bank" ? accountNumber : undefined,
        withdrawMethod === "bank" ? accountName : undefined,
        withdrawMethod === "crypto" ? (cryptoAddress || phantomAddress) : undefined,
      );
      toast({ title: "Withdrawal initiated", description: result.message || `₦${amount.toLocaleString()} withdrawal is being processed.` });
      setWithdrawAmount("");
      setCryptoAddress("");
      setAccountNumber("");
      setAccountName("");
      setSelectedBank("");
      setWithdrawOpen(false);
      refetchWallet();
    } catch (err: any) {
      toast({ title: "Withdrawal failed", description: err.message || "Unable to process withdrawal.", variant: "destructive" });
    }
  };

  if (verifyingPayment) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative mx-auto w-fit">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="relative bg-card p-5 rounded-full shadow-xl">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground">Verifying your payment...</h2>
            <p className="text-muted-foreground text-sm">This only takes a moment.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your funds, deposits, and withdrawals</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setDepositOpen(true)} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground">
              <Download size={16} /> Deposit
            </Button>
            <Button onClick={() => setWithdrawOpen(true)} variant="outline" className="gap-2 rounded-xl">
              <Upload size={16} /> Withdraw
            </Button>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="md:col-span-2 bg-gradient-to-br from-primary to-accent text-primary-foreground border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-primary-foreground/80 text-sm font-medium"><Wallet size={18} /> Total Balance</div>
                <button onClick={() => setShowAssets(!showAssets)} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  {showAssets ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {isLoading ? (
                <div className="h-12 flex items-center"><Loader2 className="w-6 h-6 animate-spin text-primary-foreground/60" /></div>
              ) : (
                <p className="text-4xl font-bold tracking-tight">{formatLocal(totalBalance)}</p>
              )}
              <div className="flex gap-6 mt-4 text-sm">
                <div><span className="text-primary-foreground/70">Available</span><p className="font-semibold">{formatLocal(availableBalance)}</p></div>
                <div><span className="text-primary-foreground/70">In Escrow</span><p className="font-semibold">{formatLocal(escrowBalance)}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Coins size={16} /> Asset Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {showAssets ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{currency.code}</span>
                    <span className="text-sm font-semibold">{formatLocal(availableBalance)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">USDC (equiv.)</span>
                    <span className="text-sm font-semibold">${usdcEquivalent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">SOL</span>
                    <span className="text-sm font-semibold text-muted-foreground">0.00</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <p className="text-xs text-muted-foreground">
                    USDC is the internal unit of account. Fiat values are displayed for convenience.
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Click <Eye className="inline h-3.5 w-3.5" /> to view asset details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Phantom Wallet + Blockchain Info */}
        <Card className="mb-8 border-dashed border-accent/40">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="bg-accent/10 p-3 rounded-xl">
                <Globe className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-foreground">Blockchain Integration</h3>
                  {phantomConnected ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs gap-1">
                        <Link2 className="h-3 w-3" />
                        {phantomAddress.slice(0, 4)}...{phantomAddress.slice(-4)}
                      </Badge>
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={disconnectPhantom}>
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={connectPhantom}>
                      <img src="https://phantom.app/img/phantom-icon-purple.svg" alt="" className="w-4 h-4" />
                      {phantomAvailable ? "Connect Phantom" : "Install Phantom"}
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  HelpChain uses <strong>USDC on Solana</strong> as the internal ledger. Connect your Phantom wallet for crypto withdrawals.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">USDC Ledger ✓</Badge>
                  <Badge variant="secondary" className="text-xs">Solana Network ✓</Badge>
                  <Badge variant={phantomConnected ? "default" : "outline"} className="text-xs">
                    {phantomConnected ? "Phantom Connected ✓" : "Phantom — Not Connected"}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-muted-foreground">On-chain Escrow — Coming Soon</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div><CardTitle className="text-lg">Transaction History</CardTitle><CardDescription>Your recent financial activity</CardDescription></div>
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-muted-foreground" />
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="text-sm bg-muted border-0 rounded-lg px-3 py-1.5 text-foreground">
                  <option value="all">All</option>
                  <option value="deposit">Deposits</option>
                  <option value="withdrawal">Withdrawals</option>
                  <option value="escrow_lock">Escrow</option>
                  <option value="escrow_release">Releases</option>
                  <option value="escrow_refund">Refunds</option>
                  <option value="earning">Earnings</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="text-center py-12"><Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" /></div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CircleDollarSign className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"><TransactionIcon type={tx.type} /></div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("text-sm font-semibold", ["deposit", "escrow_refund", "earning"].includes(tx.type) ? "text-chart-2" : "text-foreground")}>
                        {["deposit", "escrow_refund", "earning"].includes(tx.type) ? "+" : "-"}{formatLocal(tx.amount)}
                      </span>
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />

      {/* Deposit Modal */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="bg-gradient-to-br from-primary to-accent p-2 rounded-xl text-primary-foreground shadow-lg">
                <Shield className="w-5 h-5" />
              </span>
              Fund Your Wallet
            </DialogTitle>
            <DialogDescription>Add funds securely via Paystack (Card, Bank Transfer, USSD)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  { value: "card", label: "Debit/Credit Card", icon: CreditCard },
                  { value: "bank", label: "Bank Transfer", icon: Building },
                ].map((m) => (
                  <div key={m.value}
                    className={cn(
                      "cursor-pointer rounded-xl border-2 p-4 text-center transition-all",
                      depositMethod === m.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30",
                    )}
                    onClick={() => setDepositMethod(m.value)}>
                    <m.icon className={cn("w-6 h-6 mx-auto mb-2", depositMethod === m.value ? "text-primary" : "text-muted-foreground")} />
                    <p className="text-sm font-medium">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Amount ({currency.symbol})</Label>
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-mono text-muted-foreground">{currency.symbol}</span>
                <Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0" className="h-14 text-xl font-mono pl-10" min="100" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Minimum: ₦100</span>
                <span>Current Balance: {formatLocal(availableBalance)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {[1000, 5000, 10000, 25000].map((q) => (
                <Button key={q} type="button" variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setDepositAmount(q.toString())}>
                  {currency.symbol}{(q / 1000)}k
                </Button>
              ))}
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Secured by Paystack — Nigeria's leading payment processor
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositOpen(false)}>Cancel</Button>
            <Button onClick={handleDeposit} disabled={parseFloat(depositAmount) < 100 || depositPending} className="shadow-lg shadow-primary/20">
              {depositPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <>Continue to Payment <ExternalLink className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>Send funds to your bank or crypto wallet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Withdrawal Method</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  { value: "bank", label: "Bank Account", icon: Building },
                  { value: "crypto", label: "Crypto Wallet", icon: Globe },
                ].map((m) => (
                  <div key={m.value}
                    className={cn(
                      "cursor-pointer rounded-xl border-2 p-4 text-center transition-all",
                      withdrawMethod === m.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30",
                    )}
                    onClick={() => setWithdrawMethod(m.value)}>
                    <m.icon className={cn("w-6 h-6 mx-auto mb-2", withdrawMethod === m.value ? "text-primary" : "text-muted-foreground")} />
                    <p className="text-sm font-medium">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {withdrawMethod === "bank" && (
              <>
                <div>
                  <Label>Bank</Label>
                  <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={banksLoading ? "Loading banks..." : "Select your bank"} />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((b) => (
                        <SelectItem key={b.code} value={b.code}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input
                    placeholder="0123456789"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="mt-2 h-12 font-mono"
                    maxLength={10}
                  />
                </div>
                {verifyingAccount && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying account...
                  </div>
                )}
                {accountName && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {accountName}
                    </p>
                  </div>
                )}
              </>
            )}

            {withdrawMethod === "crypto" && (
              <div className="space-y-3">
                {phantomConnected ? (
                  <div className="bg-accent/5 p-3 rounded-xl border border-accent/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src="https://phantom.app/img/phantom-icon-purple.svg" alt="" className="w-5 h-5" />
                        <div>
                          <p className="text-sm font-medium">Phantom Wallet</p>
                          <p className="text-xs text-muted-foreground font-mono">{phantomAddress.slice(0, 8)}...{phantomAddress.slice(-6)}</p>
                        </div>
                      </div>
                      <Badge variant="default" className="text-xs">Connected</Badge>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full gap-2" onClick={connectPhantom}>
                    <img src="https://phantom.app/img/phantom-icon-purple.svg" alt="" className="w-4 h-4" />
                    {phantomAvailable ? "Connect Phantom Wallet" : "Install Phantom Wallet"}
                  </Button>
                )}
                <div>
                  <Label>Wallet Address (USDC on Solana)</Label>
                  <Input
                    placeholder="Enter Solana wallet address"
                    value={cryptoAddress || phantomAddress}
                    onChange={(e) => setCryptoAddress(e.target.value)}
                    className="mt-2 h-12 font-mono text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Amount ({currency.symbol})</Label>
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-mono text-muted-foreground">{currency.symbol}</span>
                <Input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0" className="h-14 text-xl font-mono pl-10" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Available: {formatLocal(availableBalance)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
            <Button
              onClick={handleWithdraw}
              variant="destructive"
              disabled={
                withdrawPending ||
                (withdrawMethod === "bank" && (!selectedBank || !accountNumber || !accountName)) ||
                (withdrawMethod === "crypto" && !cryptoAddress && !phantomAddress)
              }
            >
              {withdrawPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : "Withdraw"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function WalletPage() {
  return (
    <ProtectedRoute>
      <WalletPageContent />
    </ProtectedRoute>
  );
}
