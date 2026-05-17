import { gatewayUrl } from "@/lib/gateway";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get("locallink_session");

  if (session) {
    await fetch(`${gatewayUrl}/auth/logout`, {
      method: "POST",
      headers: { cookie: `locallink_session=${session.value}` }
    }).catch(() => {});
    cookieStore.delete("locallink_session");
  }

  return NextResponse.redirect(new URL("/", request.url));
}
