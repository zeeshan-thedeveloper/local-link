"use client";

import { useTheme } from "@/components/layout/ThemeProvider";
import { Icon } from "@/components/ui/Icon";
import type { CurrentUser } from "@/lib/gateway";

function initialsForEmail(email: string) {
  const [name = ""] = email.split("@");
  const parts = name.split(/[._-]+/).filter(Boolean);
  const first = parts[0]?.[0];
  const second = parts[1]?.[0];
  if (first && second) return `${first}${second}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "LL";
}

export function Topbar({ crumbs, currentUser }: { crumbs: string[]; currentUser: CurrentUser | null }) {
  const { theme, toggleTheme } = useTheme();
  const userEmail = currentUser?.email ?? "Signed out";

  return (
    <div className="topbar">
      <div className="topbar-crumbs">
        {crumbs.map((c, i) => (
          <span key={`${c}-${i}`} style={{ display: "contents" }}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length - 1 ? "current" : ""}>{c}</span>
          </span>
        ))}
      </div>
      <div className="topbar-right">
        <button className="btn btn-ghost btn-sm" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
          <Icon name={theme === "dark" ? "sun" : "moon"} size={13}/>
        </button>
        <button className="btn btn-ghost btn-sm"><Icon name="search" size={13}/>Search<span className="kbd" style={{ marginLeft: 4, fontSize: 10, padding: "0 4px", border: "1px solid var(--border)", borderRadius: 3, color: "var(--text-3)" }}>⌘K</span></button>
        <div className="user-menu">
          <div className="avatar">{initialsForEmail(userEmail)}</div>
          <span>{userEmail}</span>
          <Icon name="chevronD" size={12}/>
        </div>
      </div>
    </div>
  );
}
