import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFirebaseAuth } from "./use-firebase-auth";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const WALLET_API = `${SUPABASE_URL}/functions/v1/wallet-api`;

export interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "escrow_lock" | "escrow_release" | "escrow_refund" | "fee" | "earning";
  amount: number;
  status: string;
  description: string;
  reference?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  availableBalance: number;
  escrowBalance: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function useWallet() {
  const queryClient = useQueryClient();
  const { user, getIdToken } = useFirebaseAuth();

  const getAuthHeaders = async (): Promise<HeadersInit | undefined> => {
    try {
      const token = await getIdToken();
      if (!token) return undefined;
      return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return undefined;
    }
  };

  const { data: walletData, isLoading: walletLoading, refetch: refetchWallet } = useQuery<{ wallet: Wallet | null }>({
    queryKey: ["wallet", user?.uid],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      if (!headers) return { wallet: null };
      const res = await fetch(`${WALLET_API}/wallet`, { headers });
      if (!res.ok) {
        if (res.status === 401) return { wallet: null };
        throw new Error("Failed to fetch wallet");
      }
      return res.json();
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery<{ transactions: Transaction[] }>({
    queryKey: ["wallet-transactions", user?.uid],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      if (!headers) return { transactions: [] };
      const res = await fetch(`${WALLET_API}/wallet/transactions`, { headers });
      if (!res.ok) {
        if (res.status === 401) return { transactions: [] };
        throw new Error("Failed to fetch transactions");
      }
      return res.json();
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const initializeDepositMutation = useMutation({
    mutationFn: async ({ amount, callbackUrl }: { amount: number; callbackUrl?: string }) => {
      const headers = await getAuthHeaders();
      if (!headers) throw new Error("Please sign in to make a deposit");
      const res = await fetch(`${WALLET_API}/wallet/deposit/initialize`, {
        method: "POST",
        headers,
        body: JSON.stringify({ amount, callbackUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to initialize deposit");
      }
      return res.json();
    },
  });

  const verifyDepositMutation = useMutation({
    mutationFn: async (reference: string) => {
      const headers = await getAuthHeaders();
      if (!headers) throw new Error("Please sign in to verify deposit");
      const res = await fetch(`${WALLET_API}/wallet/deposit/verify`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reference }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to verify deposit");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async ({ amount, bankCode, accountNumber, accountName, walletAddress }: { amount: number; bankCode?: string; accountNumber?: string; accountName?: string; walletAddress?: string }) => {
      const headers = await getAuthHeaders();
      if (!headers) throw new Error("Please sign in to withdraw");
      const res = await fetch(`${WALLET_API}/wallet/withdraw`, {
        method: "POST",
        headers,
        body: JSON.stringify({ amount, bankCode, accountNumber, accountName, walletAddress }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to withdraw");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
    },
  });

  const initializeDeposit = async (amount: number) => {
    const callbackUrl = typeof window !== "undefined"
      ? `${window.location.origin}/wallet`
      : "https://helpchain.lovable.app/wallet";
    return initializeDepositMutation.mutateAsync({ amount, callbackUrl });
  };

  const verifyDeposit = async (reference: string) => {
    return verifyDepositMutation.mutateAsync(reference);
  };

  const withdraw = async (amount: number, bankCode?: string, accountNumber?: string, accountName?: string, walletAddress?: string) => {
    return withdrawMutation.mutateAsync({ amount, bankCode, accountNumber, accountName, walletAddress });
  };

  const isWithdrawalLocked = () => {
    const escrow = walletData?.wallet?.escrowBalance || 0;
    return escrow > 0;
  };

  return {
    balance: walletData?.wallet?.availableBalance || 0,
    availableBalance: walletData?.wallet?.availableBalance || 0,
    escrowBalance: walletData?.wallet?.escrowBalance || 0,
    wallet: walletData?.wallet,
    transactions: transactionsData?.transactions || [],
    isLoading: walletLoading,
    transactionsLoading,
    initializeDeposit,
    verifyDeposit,
    isWithdrawalLocked,
    withdraw,
    refetchWallet,
    depositPending: initializeDepositMutation.isPending,
    verifyPending: verifyDepositMutation.isPending,
    withdrawPending: withdrawMutation.isPending,
  };
}
