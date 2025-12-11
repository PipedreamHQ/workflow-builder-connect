import { isPipedreamEnabled } from "@/lib/pipedream/server";

export async function GET() {
  const enabled = await isPipedreamEnabled();
  return Response.json({ enabled });
}
