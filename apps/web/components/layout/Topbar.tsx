"use client";

import { useState } from "react";
import { notifyCurrentUserUpdated } from "@/components/layout/AppShell";
import { BuildBadge } from "@/components/layout/BuildBadge";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Icon } from "@/components/ui/Icon";
import type { CurrentUser } from "@/lib/gateway";

const gatewayUrl =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

function initialsForUser(label: string, email: string) {
  const source = label || email.split("@")[0] || "";
  const parts = source.split(/[._\-\s]+/).filter(Boolean);
  const first = parts[0]?.[0];
  const second = parts[1]?.[0];
  if (first && second) return `${first}${second}`.toUpperCase();
  return source.slice(0, 2).toUpperCase() || "LL";
}

export function Topbar({
  crumbs,
  currentUser,
}: {
  crumbs: string[];
  currentUser: CurrentUser | null;
}) {
  const { theme, toggleTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);
  const userEmail = currentUser?.email ?? "Signed out";
  const userLabel = currentUser?.name?.trim() || userEmail;

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    notifyCurrentUserUpdated(null);
    try {
      // Clear gateway-domain session cookie (OAuth/session source of truth).
      await fetch(`${gatewayUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Continue best-effort cleanup below.
    }
    try {
      // Clear web-domain session cookie used by server routes.
      await fetch("/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      // Final redirect still ensures the user leaves protected pages.
    } finally {
      window.location.assign("/login");
    }
  };

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
        <button
          className="btn btn-ghost btn-sm"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={13} />
        </button>
        <button className="btn btn-ghost btn-sm">
          <Icon name="search" size={13} />
          Search
          <span
            className="kbd"
            style={{
              marginLeft: 4,
              fontSize: 10,
              padding: "0 4px",
              border: "1px solid var(--border)",
              borderRadius: 3,
              color: "var(--text-3)",
            }}
          >
            ⌘K
          </span>
        </button>
        <BuildBadge className="build-badge" />
        <div className="user-menu">
          <div className="avatar">{initialsForUser(userLabel, userEmail)}</div>
          <span title={userEmail}>{userLabel}</span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            aria-label="Log out"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
          >
            <Icon name="logout" size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
