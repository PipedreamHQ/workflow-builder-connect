"use client";

import {
  CustomizeProvider,
  FrontendClientProvider,
} from "@pipedream/connect-react";
import { createFrontendClient } from "@pipedream/sdk/browser";
import { type ReactNode, useCallback, useEffect, useMemo } from "react";
import { serverConnectTokenCreate } from "@/lib/pipedream/server";
import { cn } from "@/lib/utils";
import { usePipedreamUserId } from "./use-pipedream-user-id";

// Theme configuration to match shadcn/ui dark theme
const pipedreamTheme = {
  colors: {
    // Background colors
    neutral0: "hsl(var(--background))",
    neutral5: "hsl(var(--muted))",
    neutral10: "hsl(var(--muted))",
    // Border colors
    neutral20: "hsl(var(--border))",
    neutral30: "hsl(var(--border))",
    // Text colors
    neutral40: "hsl(var(--muted-foreground))",
    neutral50: "hsl(var(--muted-foreground))",
    neutral60: "hsl(var(--foreground) / 0.6)",
    neutral70: "hsl(var(--foreground) / 0.7)",
    neutral80: "hsl(var(--foreground) / 0.8)",
    neutral90: "hsl(var(--foreground))",
    // Primary/accent colors
    primary: "hsl(var(--primary))",
    primary75: "hsl(var(--primary) / 0.75)",
    primary50: "hsl(var(--primary) / 0.5)",
    primary25: "hsl(var(--primary) / 0.25)",
    // Danger colors
    danger: "hsl(var(--destructive))",
    dangerLight: "hsl(var(--destructive) / 0.3)",
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

  // Log the external user ID for debugging
  useEffect(() => {
    if (externalUserId && externalUserId !== "anonymous") {
      console.log("[Pipedream] External User ID:", externalUserId);
    }
  }, [externalUserId]);

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
            backgroundColor: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
            borderColor: "hsl(var(--primary))",
          },
        }}
        theme={pipedreamTheme}
      >
        {children}
      </CustomizeProvider>
    </FrontendClientProvider>
  );
}
