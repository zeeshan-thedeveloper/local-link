import { getCurrentUser } from "@/lib/gateway";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  return Response.json({ user }, { headers: { "cache-control": "no-store" } });
}
