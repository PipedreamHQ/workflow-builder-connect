"use client";

import {
  CustomizeProvider,
  FrontendClientProvider,
} from "@pipedream/connect-react";
import { createFrontendClient } from "@pipedream/sdk/browser";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "@/lib/auth-client";
import { serverConnectTokenCreate } from "@/lib/pipedream/server";
import { cn } from "@/lib/utils";

// Generate or retrieve a session-stable anonymous user ID
function getAnonymousUserId(): string {
  const STORAGE_KEY = "pipedream_anonymous_user_id";

  // Check sessionStorage first for consistency during the session
  if (typeof window !== "undefined") {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return stored;
    }

    // Generate a new UUID v4
    const newId = crypto.randomUUID();
    sessionStorage.setItem(STORAGE_KEY, newId);
    return newId;
  }

  // Fallback for SSR
  return crypto.randomUUID();
}

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
  const { data: session } = useSession();

  // Determine external user ID with priority:
  // 1. NEXT_PUBLIC_EXTERNAL_USER_ID env var override (for testing)
  // 2. Authenticated (non-anonymous) user's session ID
  // 3. Random UUID per browser session (stored in sessionStorage - new ID each browser session)
  //
  // We intentionally DON'T use Better Auth's anonymous user ID because:
  // - It persists in cookies across browser sessions
  // - We want each browser session to have isolated Pipedream account connections
  const envOverride = process.env.NEXT_PUBLIC_EXTERNAL_USER_ID;
  const isAuthenticated = session?.user?.id && !session?.user?.isAnonymous;
  const authenticatedUserId = isAuthenticated ? session.user.id : null;

  const [sessionId, setSessionId] = useState<string | null>(null);

  // Generate session-scoped ID on client side only (to avoid hydration mismatch)
  useEffect(() => {
    if (!(envOverride || authenticatedUserId)) {
      setSessionId(getAnonymousUserId());
    }
  }, [envOverride, authenticatedUserId]);

  const externalUserId =
    envOverride || authenticatedUserId || sessionId || "anonymous";

  // Log the external user ID for debugging
  useEffect(() => {
    if (externalUserId && externalUserId !== "anonymous") {
      let source: string;
      if (envOverride) {
        source = "env override";
      } else if (authenticatedUserId) {
        source = "authenticated user";
      } else {
        source = "session UUID";
      }
      console.log(
        "[Pipedream] External User ID:",
        externalUserId,
        `(${source})`
      );
    }
  }, [externalUserId, envOverride, authenticatedUserId]);

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
