"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSensorSocket } from "@/src/hooks/useSensorSocket";

//  QueryClient config
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error: unknown) => {
          const status = (error as { response?: { status: number } })?.response
            ?.status;
          if (status && status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: true,
        staleTime: 30 * 1000, // 30 detik default
      },
    },
  });
}

function WebSocketInitializer() {
  useSensorSocket();
  return null;
}

// Root Providers
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketInitializer />
      {children}
    </QueryClientProvider>
  );
}
