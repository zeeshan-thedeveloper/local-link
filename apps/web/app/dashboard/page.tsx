"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "@/components/layout/AppShell";
import { useOverlays } from "@/components/overlays/OverlayContext";
import { Icon } from "@/components/ui/Icon";
import { ResIcon } from "@/components/ui/ResIcon";
import { KEYS, statusClass } from "@/lib/data";
import type { RequestLog, Resource, ResourceType } from "@/lib/types";
import { displayNameFromEmail } from "@/lib/user";

const gatewayUrl =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export default function DashboardPage() {
  const currentUser = useCurrentUser();
  const { openAddResource } = useOverlays();
  const displayName = currentUser?.name?.trim() || displayNameFromEmail(currentUser?.email);
  const [resources, setResources] = useState<Resource[]>([]);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const hasResources = resources.length > 0;
  const hasLogs = logs.length > 0;
  const activeResources = resources.filter((r) => r.status === "active").length;
  const topResources = useMemo(
    () =>
      resources
        .filter((r) => r.reqs24h > 0)
        .sort((a, b) => b.reqs24h - a.reqs24h)
        .slice(0, 4),
    [resources],
  );
  const stats = [
    {
      label: "Total resources",
      icon: "resources",
      value: String(resources.length),
      delta: hasResources ? `${activeResources} active` : "No resources connected",
    },
    {
      label: "Active API keys",
      icon: "key",
      value: String(KEYS.length),
      delta: "No keys generated",
    },
    {
      label: "Requests today",
      icon: "activity",
      value: String(logs.length),
      delta: hasLogs ? "Recent requests loaded" : "0 requests loaded",
    },
    { label: "Avg response", icon: "clock", value: "-", delta: "No latency data" },
  ];

  useEffect(() => {
    void Promise.all([
      fetch(`${gatewayUrl}/resources`, { credentials: "include" }).then((response) =>
        response.ok ? response.json() : [],
      ),
      fetch(`${gatewayUrl}/logs/recent`, { credentials: "include" }).then((response) =>
        response.ok ? response.json() : [],
      ),
    ])
      .then(
        ([resourceItems, logItems]: [
          Array<Resource & { type: ResourceType | "ai_model" | "http_api" }>,
          RequestLog[],
        ]) => {
          setResources(resourceItems.map(normalizeResource));
          setLogs(logItems);
        },
      )
      .catch(() => {
        setResources([]);
        setLogs([]);
      });
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {displayName}</h1>
          <p className="page-sub">Overview of your local resources and gateway activity.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={openAddResource}>
            <Icon name="plus" size={13} />
            Add resource
          </button>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-label">
              <Icon name={s.icon} size={13} /> {s.label}
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-delta">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="split-2">
        <div className="section">
          <div className="section-head">
            <div>
              <h3 className="section-title">Recent activity</h3>
              <p className="section-sub">Latest requests across all resources</p>
            </div>
            <Link href="/logs" className="btn btn-ghost btn-sm">
              Open logs
              <Icon name="external" size={12} />
            </Link>
          </div>
          {hasLogs ? (
            <table className="tbl">
              <tbody>
                {logs.slice(0, 8).map((l, i) => (
                  <tr key={i}>
                    <td
                      className="mono dim"
                      style={{
                        width: 90,
                        fontFamily: "var(--font-mono)",
                        fontSize: 11.5,
                        color: "var(--text-3)",
                      }}
                    >
                      {l.time.slice(0, 8)}
                    </td>
                    <td style={{ color: "var(--text-1)", fontSize: 12.5 }}>{l.res}</td>
                    <td style={{ width: 60 }}>
                      <span className={"method method-" + l.method}>{l.method}</span>
                    </td>
                    <td
                      className="mono"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "var(--text-2)",
                      }}
                    >
                      {l.path}
                    </td>
                    <td style={{ width: 60 }}>
                      <span className={"sc " + statusClass(l.status)}>{l.status}</span>
                    </td>
                    <td
                      className="num"
                      style={{
                        width: 70,
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "var(--text-2)",
                      }}
                    >
                      {l.dur}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">
              <div className="icon-wrap">
                <Icon name="logs" size={18} />
              </div>
              <div className="title">No recent activity</div>
              <div className="sub">
                Logs will appear here once requests reach a connected resource.
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="section">
            <div className="section-head">
              <h3 className="section-title">Top resources - 24h</h3>
            </div>
            <div style={{ padding: 4 }}>
              {topResources.map((r, i) => {
                const max = Math.max(...resources.map((resource) => resource.reqs24h), 1);
                const pct = (r.reqs24h / max) * 100;
                return (
                  <div
                    key={r.id}
                    style={{
                      padding: "10px 14px",
                      borderBottom: i < 3 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <ResIcon type={r.type} size={11} />
                        <span
                          style={{
                            fontSize: 12.5,
                            color: "var(--text-1)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.name}
                        </span>
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11.5,
                          color: "var(--text-2)",
                        }}
                      >
                        {r.reqs24h.toLocaleString()}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: "var(--bg-2)",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: pct + "%",
                          background: r.type === "database" ? "var(--purple)" : "var(--accent)",
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {topResources.length === 0 ? (
                <div className="empty">
                  <div className="icon-wrap">
                    <Icon name="activity" size={18} />
                  </div>
                  <div className="title">No usage yet</div>
                  <div className="sub">Resource usage appears after traffic starts flowing.</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizeResource(resource: Omit<Resource, "type"> & { type: string }): Resource {
  const type =
    resource.type === "ai_model"
      ? "ai-model"
      : resource.type === "http_api"
        ? "http-api"
        : resource.type;
  return {
    ...resource,
    type: type as ResourceType,
    subtype: resource.subtype ?? type,
    endpoint: resource.endpoint ?? `${gatewayUrl}/r/${resource.id}`,
    local: resource.local ?? "-",
    status: !resource.active
      ? "inactive"
      : (resource as Resource & { connected?: boolean }).connected
        ? "active"
        : "idle",
    keys: resource.keys ?? 0,
    lastActive: resource.lastActive ?? "Never",
    reqs24h: resource.reqs24h ?? 0,
  };
}
