"use client";

import {
  CustomizeProvider,
  FrontendClientProvider,
  useApps,
} from "@pipedream/connect-react";
import { createFrontendClient } from "@pipedream/sdk/browser";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { serverConnectTokenCreate } from "@/lib/pipedream/server";
import { cn } from "@/lib/utils";
import { usePipedreamUserId } from "./use-pipedream-user-id";

// Prefetcher component that warms the react-query cache
// Must be inside FrontendClientProvider to access the query context
// Uses useEffect to avoid SSR hydration mismatches
function AppsPrefetcher({ children }: { children: ReactNode }) {
  const [shouldPrefetch, setShouldPrefetch] = useState(false);

  // Only prefetch on client after hydration
  useEffect(() => {
    setShouldPrefetch(true);
  }, []);

  return (
    <>
      {shouldPrefetch && <AppsPrefetchTrigger />}
      {children}
    </>
  );
}

// Separate component to trigger the prefetch
function AppsPrefetchTrigger() {
  useApps({
    sortKey: "featured_weight",
    sortDirection: "desc",
    hasActions: true,
  });
  return null;
}

// Theme configuration to match shadcn/ui theme
// Note: CSS variables use oklch() format, so we use var() directly instead of hsl() wrapper
const pipedreamTheme = {
  colors: {
    // Background colors
    neutral0: "var(--background)",
    neutral5: "var(--muted)",
    neutral10: "var(--muted)",
    // neutral20 is used for input backgrounds in connect-react
    // CSS handles border colors separately with !important
    neutral20: "var(--background)",
    neutral30: "var(--border)",
    // Text colors - using foreground for better contrast in inputs
    neutral40: "var(--muted-foreground)",
    neutral50: "var(--muted-foreground)",
    neutral60: "color-mix(in oklch, var(--foreground) 70%, transparent)",
    neutral70: "color-mix(in oklch, var(--foreground) 80%, transparent)",
    neutral80: "var(--foreground)",
    neutral90: "var(--foreground)",
    // Primary/accent colors
    primary: "var(--primary)",
    primary75: "color-mix(in oklch, var(--primary) 75%, transparent)",
    primary50: "color-mix(in oklch, var(--primary) 50%, transparent)",
    primary25: "color-mix(in oklch, var(--primary) 25%, transparent)",
    // Danger colors
    danger: "var(--destructive)",
    dangerLight: "color-mix(in oklch, var(--destructive) 30%, transparent)",
    // App icon background - white/light for visibility in dark mode
    appIconBackground: "oklch(1 0 0)",
  },
  borderRadius: 6,
  spacing: {
    baseUnit: 4,
    controlHeight: 10,
    menuGutter: 6,
  },
};

type PipedreamProviderProps = {
  children: ReactNode;
};

export function PipedreamProvider({ children }: PipedreamProviderProps) {
  // Use shared hook for consistent externalUserId across provider and action config
  const externalUserId = usePipedreamUserId();

  // Token callback that calls our server action
  const tokenCallback = useCallback(
    async ({ externalUserId: userId }: { externalUserId: string }) =>
      serverConnectTokenCreate({ externalUserId: userId }),
    []
  );

  const client = useMemo(
    () =>
      createFrontendClient({
        externalUserId,
        tokenCallback,
      }),
    [externalUserId, tokenCallback]
  );

  return (
    <FrontendClientProvider client={client}>
      <AppsPrefetcher>
        <CustomizeProvider
          classNames={{
            controlSubmit: ({ form }) =>
              cn(
                "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 font-medium text-primary-foreground text-sm shadow transition-colors hover:bg-primary/90",
                form?.submitting &&
                  "cursor-not-allowed opacity-70 hover:bg-primary"
              ),
          }}
          styles={{
            controlSubmit: {
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
              borderColor: "var(--primary)",
            },
          }}
          theme={pipedreamTheme}
        >
          {children}
        </CustomizeProvider>
      </AppsPrefetcher>
    </FrontendClientProvider>
  );
}
