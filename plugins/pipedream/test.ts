import { isPipedreamEnabled } from "@/lib/pipedream/server";

export async function testPipedream(
  _credentials: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    const enabled = await isPipedreamEnabled();
    if (!enabled) {
      return {
        success: false,
        error:
          "Pipedream is not configured. PIPEDREAM_CLIENT_ID, PIPEDREAM_CLIENT_SECRET, and PIPEDREAM_PROJECT_ID environment variables are required.",
      };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
