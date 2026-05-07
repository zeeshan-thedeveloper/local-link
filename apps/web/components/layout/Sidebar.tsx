"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

export function Sidebar({ hostConnected }: { hostConnected: boolean }) {
  const pathname = usePathname();
  const items = [
    { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: "dashboard", kbd: "G D" },
    { id: "resources", href: "/resources", label: "Resources", icon: "resources", kbd: "G R" },
    { id: "logs", href: "/logs", label: "Logs", icon: "logs", kbd: "G L" },
    { id: "settings", href: "/settings", label: "Settings", icon: "settings", kbd: "G S" },
  ];
  const activeId = pathname.startsWith("/resources") ? "resources" : pathname.split("/")[1] || "dashboard";

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
          <span className="label">{hostConnected ? "Host connected" : "No host connected"}</span>
          {hostConnected ? <span className="meta">Connected</span> : null}
        </div>
      </div>
    </aside>
  );
}
