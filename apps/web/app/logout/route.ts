import { gatewayUrl } from "@/lib/gateway";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get("locallink_session");

  if (session) {
    await fetch(`${gatewayUrl}/auth/logout`, {
      method: "POST",
      headers: { cookie: `locallink_session=${session.value}` },
    }).catch(() => {});
  }

  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set("locallink_session", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
