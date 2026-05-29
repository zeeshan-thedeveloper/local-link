"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AddResourceSlideOver } from "@/components/overlays/AddResourceSlideOver";
import { ConnectHostModal } from "@/components/overlays/ConnectHostModal";
import { GenerateKeyModal } from "@/components/overlays/GenerateKeyModal";
import type { GeneratedApiKey } from "@/components/overlays/OverlayContext";
import { OverlayContextProvider } from "@/components/overlays/OverlayContext";
import type { CurrentUser } from "@/lib/gateway";
import type { ResourceType } from "@/lib/types";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const CurrentUserContext = createContext<CurrentUser | null>(null);
const gatewayUrl =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";
const currentUserUpdatedEvent = "locallink:current-user-updated";

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}

export function notifyCurrentUserUpdated(user: CurrentUser | null) {
  window.dispatchEvent(
    new CustomEvent<CurrentUser | null>(currentUserUpdatedEvent, { detail: user }),
  );
}

async function fetchGatewayCurrentUser(): Promise<CurrentUser | null> {
  try {
    const response = await fetch(`${gatewayUrl}/auth/me`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      user?: { email?: string; id?: string; sub?: string; name?: string | null };
    };
    const gatewayUser = data.user;
    const userId = gatewayUser?.sub ?? gatewayUser?.id;
    if (!gatewayUser?.email || !userId) return null;
    return { id: userId, email: gatewayUser.email, name: gatewayUser.name ?? null };
  } catch {
    return null;
  }
}

async function fetchWebCurrentUser(): Promise<CurrentUser | null> {
  try {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { user?: CurrentUser | null };
    return data.user ?? null;
  } catch {
    return null;
  }
}

function crumbsForPath(pathname: string) {
  if (pathname.startsWith("/resources/")) return ["LocalLink", "Resources", "Detail"];
  if (pathname.startsWith("/resources")) return ["LocalLink", "Resources"];
  if (pathname.startsWith("/logs")) return ["LocalLink", "Logs"];
  if (pathname.startsWith("/settings")) return ["LocalLink", "Settings"];
  return ["LocalLink", "Dashboard"];
}

export function AppShell({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  currentUser: CurrentUser | null;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState(currentUser);
  const [addOpen, setAddOpen] = useState(false);
  const [keyContext, setKeyContext] = useState<{
    resource: { id: string; type: ResourceType; slug?: string };
    onCreated?: (created: GeneratedApiKey) => void;
  } | null>(null);
  const [connectHost, setConnectHost] = useState<{
    resource: { id: string; name: string; type: ResourceType };
    token: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [connectedHostCount, setConnectedHostCount] = useState(0);
  const overlayValue = useMemo(
    () => ({
      openAddResource: () => setAddOpen(true),
      openGenerateKey: (
        resource: { id: string; type: ResourceType; slug?: string },
        onCreated?: (created: GeneratedApiKey) => void,
      ) => setKeyContext({ resource, onCreated }),
    }),
    [],
  );

  useEffect(() => {
    setUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    const onUserUpdated = (event: Event) => {
      setUser((event as CustomEvent<CurrentUser | null>).detail);
    };

    window.addEventListener(currentUserUpdatedEvent, onUserUpdated);
    return () => window.removeEventListener(currentUserUpdatedEvent, onUserUpdated);
  }, []);

  useEffect(() => {
    if (pathname === "/" || pathname.startsWith("/login")) return;

    let cancelled = false;
    const hydrateUser = async () => {
      const gatewayUser = await fetchGatewayCurrentUser();
      if (!cancelled && gatewayUser) {
        setUser(gatewayUser);
        return;
      }
      const webUser = await fetchWebCurrentUser();
      if (!cancelled) {
        setUser(webUser);
      }
    };

    void hydrateUser();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/" || pathname.startsWith("/login")) return;

    let cancelled = false;
    const loadHostStatus = async () => {
      try {
        const response = await fetch(`${gatewayUrl}/tunnel/status`, { credentials: "include" });
        if (!response.ok) return;
        const data = (await response.json()) as { hosts?: Array<{ id: string }> };
        if (!cancelled) setConnectedHostCount(data.hosts?.length ?? 0);
      } catch {
        if (!cancelled) setConnectedHostCount(0);
      }
    };

    void loadHostStatus();
    const interval = window.setInterval(() => void loadHostStatus(), 10_000);
    window.addEventListener("focus", loadHostStatus);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", loadHostStatus);
    };
  }, [pathname]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 1800);
  };

  if (pathname === "/" || pathname.startsWith("/login")) {
    return (
      <CurrentUserContext.Provider value={user}>
        <OverlayContextProvider value={overlayValue}>{children}</OverlayContextProvider>
      </CurrentUserContext.Provider>
    );
  }

  return (
    <CurrentUserContext.Provider value={user}>
      <OverlayContextProvider value={overlayValue}>
        <div className="app">
          <Sidebar connectedHostCount={connectedHostCount} />
          <main className="main">
            <Topbar crumbs={crumbsForPath(pathname)} currentUser={user} />
            {children}
          </main>
        </div>
        <AddResourceSlideOver
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onCreated={(created) => {
            setConnectHost({
              resource: {
                id: created.resource.id,
                name: created.resource.name,
                type: created.resource.type,
              },
              token: created.hostToken,
            });
            showToast("Resource created");
          }}
        />
        <ConnectHostModal
          open={Boolean(connectHost)}
          onClose={() => setConnectHost(null)}
          resource={connectHost?.resource ?? null}
          gatewayUrl={gatewayUrl}
          token={connectHost?.token ?? ""}
        />
        <GenerateKeyModal
          open={Boolean(keyContext)}
          resource={keyContext?.resource ?? null}
          onClose={() => setKeyContext(null)}
          onCreated={(created) => {
            keyContext?.onCreated?.(created);
            showToast("API key created");
          }}
          gatewayUrl={gatewayUrl}
        />
        <div className="toast-root">
          {toast && (
            <div className="toast">
              <span className="dot" />
              {toast}
            </div>
          )}
        </div>
      </OverlayContextProvider>
    </CurrentUserContext.Provider>
  );
}
