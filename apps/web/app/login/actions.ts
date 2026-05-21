"use server";

import type { CurrentUser } from "@/lib/gateway";
import { gatewayUrl } from "@/lib/gateway";
import { cookies } from "next/headers";

export type LoginState =
  | { ok: false; error: "credentials" | "session" }
  | { ok: true; user: CurrentUser }
  | null;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const response = await fetch(`${gatewayUrl}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: formData.get("email"),
      password: formData.get("password"),
    }),
  });
  if (!response.ok) return { ok: false, error: "credentials" };

  const body = (await response.json()) as {
    user?: { id: string; email: string; name?: string | null };
    token?: string;
  };

  const token = body.token ?? getSessionToken(response.headers);
  if (!token) return { ok: false, error: "session" };

  const cookieStore = await cookies();
  cookieStore.set("locallink_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  const gatewayUser = body.user;
  if (!gatewayUser?.id || !gatewayUser.email) {
    return { ok: false, error: "session" };
  }

  return {
    ok: true,
    user: {
      id: gatewayUser.id,
      email: gatewayUser.email,
      name: gatewayUser.name ?? null,
    },
  };
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
