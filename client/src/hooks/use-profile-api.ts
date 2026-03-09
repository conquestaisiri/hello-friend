import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFirebaseAuth } from "./use-firebase-auth";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const TASK_API = `${SUPABASE_URL}/functions/v1/task-api`;

export interface ProfileData {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  country: string | null;
  base_currency: string | null;
  rating: number;
  rating_count: number;
  reputation_score: number;
  verification_tier: number;
  helps_given: number;
  helps_received: number;
  success_rate: number;
  on_time_rate: number;
  response_time: string | null;
  skills: string[] | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export function useProfileApi() {
  const queryClient = useQueryClient();
  const { user, getIdToken } = useFirebaseAuth();

  const getAuthHeaders = async (): Promise<HeadersInit | undefined> => {
    try {
      const token = await getIdToken();
      if (!token) return undefined;
      return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    } catch {
      return undefined;
    }
  };

  const { data: profile, isLoading, refetch } = useQuery<ProfileData | null>({
    queryKey: ["profile", user?.uid],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      if (!headers) return null;
      const res = await fetch(`${TASK_API}/profile`, { headers });
      if (!res.ok) return null;
      const data = await res.json();
      return data.profile || null;
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: {
      fullName?: string;
      bio?: string;
      location?: string;
      skills?: string[];
      country?: string;
      baseCurrency?: string;
      avatarUrl?: string;
      email?: string;
    }) => {
      const headers = await getAuthHeaders();
      if (!headers) throw new Error("Not authenticated");
      const res = await fetch(`${TASK_API}/profile`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      return data.profile;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  return {
    profile,
    isLoading,
    refetch,
    updateProfile: updateProfile.mutateAsync,
    updateProfilePending: updateProfile.isPending,
  };
}
