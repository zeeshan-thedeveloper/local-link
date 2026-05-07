"use client";

import { createContext, useContext, useMemo, useState } from "react";
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
  const [keyOpen, setKeyOpen] = useState(false);
  const [connectHost, setConnectHost] = useState<{
    resource: { id: string; name: string; type: ResourceType };
    token: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const hostConnected = false;
  const overlayValue = useMemo(() => ({
    openAddResource: () => setAddOpen(true),
    openGenerateKey: () => setKeyOpen(true),
  }), []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 1800);
  };

  if (pathname.startsWith("/login")) {
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
          <Sidebar hostConnected={hostConnected} />
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
          gatewayUrl={process.env.NEXT_PUBLIC_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003"}
          token={connectHost?.token ?? ""}
        />
        <GenerateKeyModal open={keyOpen} onClose={() => setKeyOpen(false)} />
        <div className="toast-root">
          {toast && <div className="toast"><span className="dot"/>{toast}</div>}
        </div>
      </OverlayContextProvider>
    </CurrentUserContext.Provider>
  );
}
