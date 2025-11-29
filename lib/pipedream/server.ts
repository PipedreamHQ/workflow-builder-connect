"use server";

import {
  type ConfiguredProps,
  PipedreamClient,
  ProjectEnvironment,
} from "@pipedream/sdk";

const {
  PIPEDREAM_CLIENT_ID,
  PIPEDREAM_CLIENT_SECRET,
  PIPEDREAM_PROJECT_ID,
  PIPEDREAM_PROJECT_ENVIRONMENT,
  PIPEDREAM_ALLOWED_ORIGINS,
} = process.env;

// Validate required environment variables
const isPipedreamConfigured =
  PIPEDREAM_CLIENT_ID && PIPEDREAM_CLIENT_SECRET && PIPEDREAM_PROJECT_ID;

// Map environment string to project environment
const getProjectEnvironment = (): ProjectEnvironment => {
  if (PIPEDREAM_PROJECT_ENVIRONMENT === "production") {
    return ProjectEnvironment.Production;
  }
  return ProjectEnvironment.Development;
};

// Create backend client (only if credentials are available)
const client =
  isPipedreamConfigured &&
  PIPEDREAM_CLIENT_ID &&
  PIPEDREAM_CLIENT_SECRET &&
  PIPEDREAM_PROJECT_ID
    ? new PipedreamClient({
        clientId: PIPEDREAM_CLIENT_ID,
        clientSecret: PIPEDREAM_CLIENT_SECRET,
        projectId: PIPEDREAM_PROJECT_ID,
        projectEnvironment: getProjectEnvironment(),
      })
    : null;

/**
 * Create a connect token for frontend SDK authentication.
 * Called by the frontend client's tokenCallback.
 */
export async function serverConnectTokenCreate(opts: {
  externalUserId: string;
}) {
  if (!client) {
    throw new Error(
      "Pipedream is not configured. Please add PIPEDREAM_CLIENT_ID, PIPEDREAM_CLIENT_SECRET, and PIPEDREAM_PROJECT_ID environment variables."
    );
  }

  const allowedOrigins = JSON.parse(PIPEDREAM_ALLOWED_ORIGINS || "[]");

  const response = await client.tokens.create({
    externalUserId: opts.externalUserId,
    allowedOrigins,
  });

  // Return in the format expected by the frontend SDK's TokenCallback
  return {
    token: response.token,
    expiresAt: response.expiresAt,
    connectLinkUrl: response.connectLinkUrl,
  };
}

/**
 * Run a Pipedream action from the backend (used during workflow execution).
 */
export async function runPipedreamAction(opts: {
  externalUserId: string;
  componentKey: string;
  configuredProps: ConfiguredProps;
}) {
  if (!client) {
    throw new Error("Pipedream is not configured.");
  }

  return await client.actions.run({
    id: opts.componentKey,
    externalUserId: opts.externalUserId,
    configuredProps: opts.configuredProps,
  });
}

/**
 * Check if Pipedream is configured (has required env vars).
 * Exported as async to satisfy Next.js server action constraints.
 */
export async function isPipedreamEnabled() {
  return isPipedreamConfigured;
}
