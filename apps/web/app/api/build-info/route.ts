import { getBuildInfo } from "@/lib/build-info";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getBuildInfo(), {
    headers: { "cache-control": "no-store" },
  });
}
