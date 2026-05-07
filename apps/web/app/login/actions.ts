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

  const setCookie = response.headers.get("set-cookie");
  const token = setCookie?.match(/locallink_session=([^;]+)/)?.[1];
  if (token) {
    const cookieStore = await cookies();
    cookieStore.set("locallink_session", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
  }
  redirect("/dashboard");
}
