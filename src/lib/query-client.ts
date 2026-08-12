import { QueryClient } from "@tanstack/react-query";

/**
 * Global TanStack React Query Client configured for KindyConnect.
 * Optimizes network requests via smart staleness, caching, and retry policies.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep inactive cache data in memory for 15 minutes
      gcTime: 15 * 60 * 1000,
      // Avoid aggressive automatic background refetches on window focus
      refetchOnWindowFocus: false,
      // Re-connect refetch
      refetchOnReconnect: "always",
      // Retry failed network queries twice with exponential backoff
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Type-safe query key factory for centralized cache key management
 */
export const queryKeys = {
  all: ["kindyConnect"] as const,
  initialData: (userId?: string | null) => ["kindyConnect", "initialData", userId || "all"] as const,
  schools: () => ["kindyConnect", "schools"] as const,
  users: (schoolId?: string | null) => ["kindyConnect", "users", schoolId || "all"] as const,
  pupils: (schoolId?: string | null) => ["kindyConnect", "pupils", schoolId || "all"] as const,
  classes: (schoolId?: string | null) => ["kindyConnect", "classes", schoolId || "all"] as const,
  marks: (schoolId?: string | null) => ["kindyConnect", "marks", schoolId || "all"] as const,
  attendance: (schoolId?: string | null) => ["kindyConnect", "attendance", schoolId || "all"] as const,
  audit: (schoolId?: string | null) => ["kindyConnect", "audit", schoolId || "all"] as const,
  notifications: () => ["kindyConnect", "notifications"] as const,
  cacheStats: () => ["kindyConnect", "cacheStats"] as const,
};
