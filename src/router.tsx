import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh longer
        gcTime: 1000 * 60 * 10, // 10 minutes cache time (formerly cacheTime)
        refetchOnWindowFocus: false, // Reduce unnecessary refetches
        refetchOnReconnect: false,
        retry: 1, // Reduce retry attempts for faster failure
        // Enable network-only first fetch for critical data
        networkMode: 'online',
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: 'intent', // Preload on hover/focus for instant navigation
    defaultPreloadStaleTime: 10000, // Keep preloaded data for 10 seconds
    defaultPendingMs: 500, // Show loading state after 500ms (feels faster)
    defaultPendingMinMs: 200, // Minimum time to show loading state
  });

  return router;
};
