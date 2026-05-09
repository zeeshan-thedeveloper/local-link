"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AddResourceSlideOver } from "@/components/overlays/AddResourceSlideOver";
import { ConnectHostModal } from "@/components/overlays/ConnectHostModal";
import { GenerateKeyModal } from "@/components/overlays/GenerateKeyModal";
import { OverlayContextProvider } from "@/components/overlays/OverlayContext";
import type { CurrentUser } from "@/lib/gateway";
import type { ResourceType } from "@/lib/types";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const CurrentUserContext = createContext<CurrentUser | null>(null);
const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}

function crumbsForPath(pathname: string) {
  if (pathname.startsWith("/resources/")) return ["LocalLink", "Resources", "Detail"];
  if (pathname.startsWith("/resources")) return ["LocalLink", "Resources"];
  if (pathname.startsWith("/logs")) return ["LocalLink", "Logs"];
  if (pathname.startsWith("/settings")) return ["LocalLink", "Settings"];
  return ["LocalLink", "Dashboard"];
}

export function AppShell({ children, currentUser }: { children: React.ReactNode; currentUser: CurrentUser | null }) {
  const pathname = usePathname();
  const [addOpen, setAddOpen] = useState(false);
  const [keyContext, setKeyContext] = useState<{ resourceId: string; onCreated?: () => void } | null>(null);
  const [connectHost, setConnectHost] = useState<{
    resource: { id: string; name: string; type: ResourceType };
    token: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [connectedHostCount, setConnectedHostCount] = useState(0);
  const overlayValue = useMemo(() => ({
    openAddResource: () => setAddOpen(true),
    openGenerateKey: (resourceId: string, onCreated?: () => void) => setKeyContext({ resourceId, onCreated }),
  }), []);

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
      <CurrentUserContext.Provider value={currentUser}>
        <OverlayContextProvider value={overlayValue}>{children}</OverlayContextProvider>
      </CurrentUserContext.Provider>
    );
  }

  return (
    <CurrentUserContext.Provider value={currentUser}>
      <OverlayContextProvider value={overlayValue}>
        <div className="app">
          <Sidebar connectedHostCount={connectedHostCount} />
          <main className="main">
            <Topbar crumbs={crumbsForPath(pathname)} currentUser={currentUser} />
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
                type: created.resource.type
              },
              token: created.hostToken
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
          resourceId={keyContext?.resourceId ?? null}
          onClose={() => setKeyContext(null)}
          onCreated={() => { keyContext?.onCreated?.(); showToast("API key created"); }}
          gatewayUrl={gatewayUrl}
        />
        <div className="toast-root">
          {toast && <div className="toast"><span className="dot"/>{toast}</div>}
        </div>
      </OverlayContextProvider>
    </CurrentUserContext.Provider>
  );
}
