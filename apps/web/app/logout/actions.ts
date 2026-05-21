"use server";

import { gatewayUrl } from "@/lib/gateway";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout() {
  const cookieStore = await cookies();
  const session = cookieStore.get("locallink_session");

  if (session) {
    await fetch(`${gatewayUrl}/auth/logout`, {
      method: "POST",
      headers: { cookie: `locallink_session=${session.value}` },
    }).catch(() => {});
    cookieStore.delete("locallink_session");
  }

  redirect("/login");
}
