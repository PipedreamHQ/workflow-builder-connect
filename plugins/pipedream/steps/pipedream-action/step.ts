/**
 * Executable step function for Pipedream Action
 *
 * This step runs any of Pipedream's 3000+ pre-built actions.
 * Authentication is handled by Pipedream Connect - the configuredProps
 * contains authProvisionId references to the user's connected accounts.
 */
import "server-only";

import { runPipedreamAction } from "@/lib/pipedream/server";
import { type StepInput, withStepLogging } from "@/lib/steps/step-handler";
import { getErrorMessage } from "@/lib/utils";

type PipedreamActionResult =
  | { success: true; data: unknown }
  | { success: false; error: string };

type PipedreamActionInput = StepInput & {
  pipedreamComponentKey: string;
  pipedreamConfiguredProps: Record<string, unknown> | string;
  externalUserId?: string;
};

export async function pipedreamActionStep(
  input: PipedreamActionInput
): Promise<PipedreamActionResult> {
  "use step";

  return withStepLogging(input, async () => {
    // Use passed externalUserId, fall back to EXTERNAL_USER_ID env var for Pipedream Connect
    const externalUserId =
      input.externalUserId || process.env.EXTERNAL_USER_ID || "anonymous";

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
  });
}
