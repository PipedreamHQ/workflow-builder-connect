/**
 * Code template for Pipedream Action step
 * This template is used when exporting workflows to standalone Next.js projects
 */
export const pipedreamActionCodegenTemplate = `import { createBackendClient } from "@pipedream/sdk/server";

const client = createBackendClient({
  projectId: process.env.PIPEDREAM_PROJECT_ID!,
  credentials: {
    clientId: process.env.PIPEDREAM_CLIENT_ID!,
    clientSecret: process.env.PIPEDREAM_CLIENT_SECRET!,
  },
});

export async function pipedreamActionStep(input: {
  pipedreamComponentKey: string;
  pipedreamConfiguredProps: Record<string, unknown>;
  externalUserId?: string;
}) {
  "use step";

  const { pipedreamComponentKey, pipedreamConfiguredProps } = input;
  const externalUserId = input.externalUserId || process.env.EXTERNAL_USER_ID || "anonymous";

  if (!pipedreamComponentKey) {
    return {
      success: false,
      error: "No Pipedream component key specified",
    };
  }

  try {
    const result = await client.runAction({
      externalUserId,
      actionId: pipedreamComponentKey,
      configuredProps: pipedreamConfiguredProps,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: \`Pipedream action failed: \${error instanceof Error ? error.message : "Unknown error"}\`,
    };
  }
}`;
