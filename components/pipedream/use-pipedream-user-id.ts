"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";

/**
 * Hook to get the Pipedream external user ID.
 *
 * Uses Better Auth's user ID (works for both authenticated and anonymous users).
 * This means:
 * - Anonymous users keep their Pipedream connected accounts across browser sessions
 * - When they sign up, connected accounts are preserved (linked to their new account)
 * - Consistent with how workflows are already tied to the user ID
 *
 * This hook must be used by both:
 * - PipedreamProvider (for the frontend SDK client)
 * - PipedreamActionConfig (for testing/running actions)
 *
 * Using the same ID ensures accounts connected via the frontend SDK
 * can be used when running actions.
 *
 * Note: Returns "anonymous" during SSR and initial hydration to avoid
 * hydration mismatches. The actual user ID is set after mount.
 */
export function usePipedreamUserId(): string {
  const { data: session } = useSession();
  const [userId, setUserId] = useState("anonymous");

  // Update userId after mount to avoid hydration mismatch
  // Server and initial client render both return "anonymous"
  // Then we update to the actual user ID on the client
  useEffect(() => {
    setUserId(session?.user?.id || "anonymous");
  }, [session?.user?.id]);

  return userId;
}
