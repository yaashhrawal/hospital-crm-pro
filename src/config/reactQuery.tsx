import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface ReactQueryProviderProps {
  children: ReactNode;
}

export const ReactQueryProvider: React.FC<ReactQueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Query keys for consistent caching
export const queryKeys = {
  // Auth
  currentUser: ['auth', 'currentUser'] as const,
  
  // Patients
  patients: (params?: any) => ['patients', params] as const,
  patient: (id: string) => ['patients', id] as const,
  patientByPhone: (phone: string) => ['patients', 'phone', phone] as const,
  patientStats: ['patients', 'stats'] as const,
  
  // Appointments
  appointments: (params?: any) => ['appointments', params] as const,
  appointment: (id: string) => ['appointments', id] as const,
  todayAppointments: ['appointments', 'today'] as const,
  doctorAppointments: (doctorId: string) => ['appointments', 'doctor', doctorId] as const,
  appointmentStats: ['appointments', 'stats'] as const,
  
  // Bills
  bills: (params?: any) => ['bills', params] as const,
  bill: (id: string) => ['bills', id] as const,
  billStats: ['bills', 'stats'] as const,
  
  // Dashboard
  dashboardStats: ['dashboard', 'stats'] as const,
  chartData: ['dashboard', 'charts'] as const,
  kpiMetrics: ['dashboard', 'kpi'] as const,
  topPerformers: ['dashboard', 'performers'] as const,
  
  // Departments
  departments: ['departments'] as const,
  department: (id: string) => ['departments', id] as const,
  
  // Users
  users: (params?: any) => ['users', params] as const,
  user: (id: string) => ['users', id] as const,
  doctors: ['users', 'doctors'] as const,
} as const;

// Custom hooks for common query patterns

// Generic hooks
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();
  return (queryKey: any) => queryClient.invalidateQueries({ queryKey });
};

export const useOptimisticUpdate = () => {
  const queryClient = useQueryClient();
  
  return <T,>(
    queryKey: any,
    updater: (oldData: T | undefined) => T | undefined,
    rollbackData?: T
  ) => {
    // Cancel any outgoing refetches
    queryClient.cancelQueries({ queryKey });
    
    // Snapshot the previous value
    const previousData = queryClient.getQueryData<T>(queryKey);
    
    // Optimistically update
    queryClient.setQueryData<T>(queryKey, updater);
    
    // Return a rollback function
    return () => {
      if (rollbackData !== undefined) {
        queryClient.setQueryData<T>(queryKey, rollbackData);
      } else if (previousData !== undefined) {
        queryClient.setQueryData<T>(queryKey, previousData);
      }
    };
  };
};

// Mutation helpers
export const createMutationOptions = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: any, variables: TVariables) => void;
    invalidateQueries?: any[];
    optimisticUpdate?: {
      queryKey: any;
      updater: (oldData: any, variables: TVariables) => any;
    };
  }
) => {
  const queryClient = useQueryClient();
  
  return {
    mutationFn,
    onMutate: async (variables: TVariables) => {
      if (options?.optimisticUpdate) {
        const { queryKey, updater } = options.optimisticUpdate;
        
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey });
        
        // Snapshot the previous value
        const previousData = queryClient.getQueryData(queryKey);
        
        // Optimistically update
        queryClient.setQueryData(queryKey, (oldData: any) => updater(oldData, variables));
        
        // Return a context object with the snapshotted value
        return { previousData };
        return { previousData };
      }
    },
    onError: (err: any, variables: TVariables, context: any) => {
      // If we have a context, it means we optimistically updated
      if (context?.previousData && options?.optimisticUpdate) {
        queryClient.setQueryData(options.optimisticUpdate.queryKey, context.previousData);
      }
      
      options?.onError?.(err, variables);
    },
    onSuccess: (data: TData, variables: TVariables) => {
      options?.onSuccess?.(data, variables);
    },
    onSettled: () => {
      // Always refetch after error or success
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
    },
  };
};

// Real-time subscription helper
export const useRealtimeSubscription = (
  subscriptionFn: (callback: () => void) => () => void,
  queryKeysToInvalidate: any[][],
  enabled: boolean = true
) => {
  const queryClient = useQueryClient();
  
  React.useEffect(() => {
    if (!enabled) return;
    
    const invalidateQueries = () => {
      queryKeysToInvalidate.forEach(queryKey => {
        queryClient.invalidateQueries(queryKey);
      });
    };
    
    const unsubscribe = subscriptionFn(invalidateQueries);
    
    return unsubscribe;
  }, [enabled, queryClient]);
};

// Error boundary for React Query
export class QueryErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static override getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Query Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">An error occurred while loading data.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Pagination helper
export const usePagination = (initialPage: number = 1, pageSize: number = 20) => {
  const [page, setPage] = React.useState(initialPage);
  const [limit] = React.useState(pageSize);

  const goToPage = React.useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const nextPage = React.useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const prevPage = React.useCallback(() => {
    setPage(prev => Math.max(1, prev - 1));
  }, []);

  const resetPage = React.useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    limit,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
  };
};

export { queryClient };
export default ReactQueryProvider;