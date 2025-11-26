/**
 * Executable step function for Pipedream Action
 *
 * This step runs any of Pipedream's 3000+ pre-built actions.
 * Authentication is handled by Pipedream Connect - the configuredProps
 * contains authProvisionId references to the user's connected accounts.
 */
import "server-only";

import { runPipedreamAction } from "@/lib/pipedream/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getErrorMessage } from "../utils";

type PipedreamActionResult =
  | { success: true; data: unknown }
  | { success: false; error: string };

export async function pipedreamActionStep(input: {
  pipedreamComponentKey: string;
  pipedreamConfiguredProps: Record<string, unknown> | string;
}): Promise<PipedreamActionResult> {
  "use step";

  // Get the current user's ID to use as externalUserId
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const externalUserId = session?.user?.id || "anonymous";

  const { pipedreamComponentKey, pipedreamConfiguredProps } = input;

  if (!pipedreamComponentKey) {
    return {
      success: false,
      error: "No Pipedream component key specified",
    };
  }

  // Parse configuredProps if stored as JSON string
  const configuredProps =
    typeof pipedreamConfiguredProps === "string"
      ? (JSON.parse(pipedreamConfiguredProps) as Record<string, unknown>)
      : pipedreamConfiguredProps || {};

  try {
    const result = await runPipedreamAction({
      externalUserId,
      componentKey: pipedreamComponentKey,
      configuredProps,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: `Pipedream action failed: ${getErrorMessage(error)}`,
    };
  }
}
