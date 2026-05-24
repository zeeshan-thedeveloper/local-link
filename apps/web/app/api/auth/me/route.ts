import { getCurrentUser, gatewayUrl } from "@/lib/gateway";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  return Response.json({ user }, { headers: { "cache-control": "no-store" } });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  const response = await fetch(`${gatewayUrl}/auth/me`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      cookie: cookieHeader,
    },
    body: JSON.stringify(await request.json()),
    cache: "no-store",
  });

  return Response.json(await response.json(), {
    status: response.status,
    headers: { "cache-control": "no-store" },
  });
}
