import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWalletLocalStore, type LocalTransaction } from "@/stores/wallet-local-store";
import { useLocalizationStore } from "@/stores/localization-store";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle,
  TrendingUp, Shield, CircleDollarSign, Coins, Eye, EyeOff,
  Download, Upload, Filter, CreditCard, Building, Globe, Copy
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function TransactionIcon({ type }: { type: LocalTransaction["type"] }) {
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

function WalletPageContent() {
  const { availableBalance, escrowBalance, usdcBalance, transactions, deposit, withdraw } = useWalletLocalStore();
  const { formatLocal, currency } = useLocalizationStore();
  const { toast } = useToast();
  const [showAssets, setShowAssets] = useState(false);
  const [filter, setFilter] = useState("all");
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("bank");
  const [withdrawMethod, setWithdrawMethod] = useState("bank");

  const totalBalance = availableBalance + escrowBalance;
  const filteredTransactions = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) { toast({ title: "Invalid amount", variant: "destructive" }); return; }
    deposit(amount);
    toast({ title: "Deposit successful", description: `${formatLocal(amount)} added to your wallet` });
    setDepositAmount("");
    setDepositOpen(false);
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { toast({ title: "Invalid amount", variant: "destructive" }); return; }
    const success = withdraw(amount);
    if (success) {
      toast({ title: "Withdrawal initiated", description: `${formatLocal(amount)} will be sent to your account` });
    } else {
      toast({ title: "Insufficient balance", variant: "destructive" });
    }
    setWithdrawAmount("");
    setWithdrawOpen(false);
  };

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
              <p className="text-4xl font-bold tracking-tight">{formatLocal(totalBalance)}</p>
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
                  <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">USDC</span><span className="text-sm font-semibold">${usdcBalance.toFixed(2)}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">SOL</span><span className="text-sm font-semibold">0.00</span></div>
                  <div className="h-px bg-border my-2" />
                  <p className="text-xs text-muted-foreground">Fiat values are shown by default. Toggle to view crypto assets.</p>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Click <Eye className="inline h-3.5 w-3.5" /> to view asset details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
            {filteredTransactions.length === 0 ? (
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
            <DialogTitle>Deposit Funds</DialogTitle>
            <DialogDescription>Add money to your HelpChain wallet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  { value: "bank", label: "Bank Transfer", icon: Building },
                  { value: "card", label: "Debit/Credit Card", icon: CreditCard },
                ].map((m) => (
                  <div key={m.value}
                    className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${depositMethod === m.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                    onClick={() => setDepositMethod(m.value)}>
                    <m.icon className={`w-6 h-6 mx-auto mb-2 ${depositMethod === m.value ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-sm font-medium">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Amount ({currency.symbol})</Label>
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-mono text-muted-foreground">{currency.symbol}</span>
                <Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0" className="h-14 text-xl font-mono pl-10" />
              </div>
            </div>
            <div className="flex gap-2">
              {[5000, 10000, 25000, 50000].map((q) => (
                <Button key={q} type="button" variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setDepositAmount(q.toString())}>
                  {formatLocal(q)}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositOpen(false)}>Cancel</Button>
            <Button onClick={handleDeposit} className="bg-gradient-to-r from-primary to-accent text-primary-foreground">Deposit</Button>
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
                    className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${withdrawMethod === m.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                    onClick={() => setWithdrawMethod(m.value)}>
                    <m.icon className={`w-6 h-6 mx-auto mb-2 ${withdrawMethod === m.value ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-sm font-medium">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
            {withdrawMethod === "crypto" && (
              <div>
                <Label>Wallet Address (USDC on Solana)</Label>
                <Input placeholder="Enter Solana wallet address" className="mt-2 h-12" />
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
            <Button onClick={handleWithdraw} variant="destructive">Withdraw</Button>
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
