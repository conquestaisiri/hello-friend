import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFirebaseAuth } from "./use-firebase-auth";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const TASK_API = `${SUPABASE_URL}/functions/v1/task-api`;

export interface TaskData {
  id: string;
  requester_id: string;
  title: string;
  description: string;
  category: string;
  location: string | null;
  urgency: string;
  budget: number;
  platform_fee: number;
  status: string;
  helper_id: string | null;
  funded_from: string | null;
  created_at: string;
  assigned_at: string | null;
  completed_at: string | null;
}

export function useTasksApi() {
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

  // Fetch user's tasks
  const { data: myTasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery<TaskData[]>({
    queryKey: ["my-tasks", user?.uid],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      if (!headers) return [];
      const res = await fetch(`${TASK_API}/tasks`, { headers });
      if (!res.ok) return [];
      const data = await res.json();
      return data.tasks || [];
    },
    enabled: !!user,
    staleTime: 15000,
  });

  // Fetch open tasks (marketplace)
  const { data: openTasks = [], isLoading: openTasksLoading, refetch: refetchOpenTasks } = useQuery<TaskData[]>({
    queryKey: ["open-tasks"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      if (!headers) return [];
      const res = await fetch(`${TASK_API}/tasks/open`, { headers });
      if (!res.ok) return [];
      const data = await res.json();
      return data.tasks || [];
    },
    enabled: !!user,
    staleTime: 15000,
  });

  // Create task
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: {
      title: string;
      description: string;
      category: string;
      location?: string;
      urgency?: string;
      budget: number;
      workerCount: number;
    }) => {
      const headers = await getAuthHeaders();
      if (!headers) throw new Error("Not authenticated");
      const res = await fetch(`${TASK_API}/tasks`, {
        method: "POST",
        headers,
        body: JSON.stringify(taskData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to create task");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["open-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });

  return {
    myTasks,
    openTasks,
    tasksLoading,
    openTasksLoading,
    refetchTasks,
    refetchOpenTasks,
    createTask: createTaskMutation.mutateAsync,
    createTaskPending: createTaskMutation.isPending,
  };
}
