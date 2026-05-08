"use server";

import { gatewayUrl } from "@/lib/gateway";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const response = await fetch(`${gatewayUrl}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: formData.get("email"),
      password: formData.get("password")
    })
  });
  if (!response.ok) redirect("/login?error=1");

  const token = getSessionToken(response.headers);
  if (!token) redirect("/login?error=session");

  const cookieStore = await cookies();
  cookieStore.set("locallink_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  redirect("/dashboard");
}

function getSessionToken(headers: Headers) {
  const cookieHeaders =
    (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ??
    [headers.get("set-cookie")].filter((value): value is string => Boolean(value));

  const sessionCookie = cookieHeaders.find((header) => /^locallink_session=/i.test(header));
  const token = sessionCookie?.match(/^locallink_session=([^;]+)/i)?.[1];

  if (token) {
    return decodeURIComponent(token);
  }

  return null;
}
