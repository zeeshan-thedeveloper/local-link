"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

export function Sidebar({ connectedHostCount }: { connectedHostCount: number }) {
  const pathname = usePathname();
  const items = [
    { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: "dashboard", kbd: "G D" },
    { id: "resources", href: "/resources", label: "Resources", icon: "resources", kbd: "G R" },
    { id: "settings", href: "/settings", label: "Settings", icon: "settings", kbd: "G S" },
  ];
  const activeId = pathname.startsWith("/resources") ? "resources" : pathname.split("/")[1] || "dashboard";
  const hostConnected = connectedHostCount > 0;
  const hostLabel = hostConnected
    ? `${connectedHostCount} ${connectedHostCount === 1 ? "host" : "hosts"} connected`
    : "No host connected";

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark"/>
        <span className="name">LocalLink</span>
      </div>
      <nav className="sidebar-nav">
        {items.map((it) => (
          <Link key={it.id} href={it.href} className={"nav-item " + (activeId === it.id ? "active" : "")}>
            <Icon name={it.icon} size={15} />
            <span>{it.label}</span>
            <span className="kbd">{it.kbd}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className={"host-indicator " + (hostConnected ? "" : "disconnected")}>
          <span className="dot"/>
          <span className="label">{hostLabel}</span>
          {hostConnected ? <span className="meta">Live tunnel</span> : null}
        </div>
      </div>
    </aside>
  );
}
