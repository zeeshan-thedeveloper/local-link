import { cookies } from "next/headers";

export const gatewayUrl = process.env.GATEWAY_URL ?? "http://localhost:3003";

export type CurrentUser = {
  email: string;
  id: string;
};

export async function gatewayFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  const response = await fetch(`${gatewayUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      cookie: cookieHeader,
      ...init.headers
    },
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`Gateway request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const { user } = await gatewayFetch<{ user?: { email?: string; sub?: string } }>("/auth/me");
    if (!user?.email || !user.sub) return null;
    return { email: user.email, id: user.sub };
  } catch {
    return null;
  }
}
