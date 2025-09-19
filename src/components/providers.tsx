"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { AuthProvider } from "./providers/auth-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { RightPaneProvider } from "@/hooks/use-right-pane";

export function Providers({ children, ...props }: ThemeProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RightPaneProvider>
          <NextThemesProvider {...props} attribute="class" defaultTheme="system" enableSystem>
            {children}
          </NextThemesProvider>
        </RightPaneProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
