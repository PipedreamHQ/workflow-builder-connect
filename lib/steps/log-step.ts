/**
 * Logging step for workflow execution tracking
 * Uses regular fetch to send logs to API endpoint
 */
import "server-only";

import { redactSensitiveData } from "../utils/redact";

const TRAILING_SLASH_REGEX = /\/$/;

const getBaseUrl = (): string => {
  const explicit =
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) {
    return explicit.replace(TRAILING_SLASH_REGEX, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(TRAILING_SLASH_REGEX, "")}`;
  }

  // Local/dev fallback: honor PORT if the dev server is running on a non-default port
  const port = process.env.PORT || "3000";
  return `http://127.0.0.1:${port}`;
};

export type LogStepInput = {
  action: "start" | "complete";
  executionId?: string;
  nodeId?: string;
  nodeName?: string;
  nodeType?: string;
  nodeInput?: unknown;
  logId?: string;
  startTime?: number;
  status?: "success" | "error";
  output?: unknown;
  error?: string;
};

export async function logStep(input: LogStepInput): Promise<{
  logId?: string;
  startTime?: number;
  success: boolean;
}> {
  "use step";

  try {
    // Redact sensitive data from input and output before logging
    const redactedInput = redactSensitiveData(input.nodeInput);
    const redactedOutput = redactSensitiveData(input.output);

    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/workflow-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: input.action,
        data: {
          executionId: input.executionId,
          nodeId: input.nodeId,
          nodeName: input.nodeName,
          nodeType: input.nodeType,
          input: redactedInput,
          logId: input.logId,
          startTime: input.startTime,
          status: input.status,
          output: redactedOutput,
          error: input.error,
        },
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return { ...result, success: true };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to log:", error);
    return { success: true };
  }
}
