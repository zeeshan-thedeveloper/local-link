"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "@/components/layout/AppShell";
import { useOverlays } from "@/components/overlays/OverlayContext";
import { Icon } from "@/components/ui/Icon";
import { ResIcon } from "@/components/ui/ResIcon";
import { StatusPill } from "@/components/ui/StatusPill";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { KEYS, LOGS, statusClass } from "@/lib/data";
import type { Resource, ResourceType } from "@/lib/types";
import { displayNameFromEmail } from "@/lib/user";

const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export default function DashboardPage() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const { openAddResource } = useOverlays();
  const [resources, setResources] = useState<Resource[]>([]);
  const hasResources = resources.length > 0;
  const hasLogs = LOGS.length > 0;
  const activeResources = resources.filter(r => r.status === "active").length;
  const topResources = useMemo(
    () => resources.filter(r => r.reqs24h > 0).sort((a,b) => b.reqs24h - a.reqs24h).slice(0, 4),
    [resources]
  );
  const stats = [
    { label: "Total resources", icon: "resources", value: String(resources.length), delta: hasResources ? `${activeResources} active` : "No resources connected" },
    { label: "Active API keys", icon: "key", value: String(KEYS.length), delta: "No keys generated" },
    { label: "Requests today", icon: "activity", value: String(LOGS.length), delta: "No requests yet" },
    { label: "Avg response", icon: "clock", value: "-", delta: "No latency data" },
  ];

  useEffect(() => {
    void fetch(`${gatewayUrl}/resources`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then((items: Array<Resource & { type: ResourceType | "ai_model" | "http_api" }>) => {
        setResources(items.map(normalizeResource));
      });
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {displayNameFromEmail(currentUser?.email)}</h1>
          <p className="page-sub">Overview of your local resources and gateway activity.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => router.push("/resources")}><Icon name="key" size={13}/>Generate API key</button>
          <button className="btn btn-primary" onClick={openAddResource}><Icon name="plus" size={13}/>Add resource</button>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-label"><Icon name={s.icon} size={13}/> {s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-delta">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-head">
          <div>
            <h3 className="section-title">Resources</h3>
            <p className="section-sub">
              {hasResources ? `${resources.length} registered - ${activeResources} active right now` : "Nothing here yet"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/resources" className="btn btn-ghost btn-sm">View all<Icon name="chevronR" size={12}/></Link>
          </div>
        </div>
        {hasResources ? (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: "30%" }}>Name</th>
                <th>Type</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Reqs - 24h</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {resources.slice(0, 5).map(r => (
                <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/resources/${r.id}`)}>
                  <td>
                    <div className="resource-name-cell">
                      <ResIcon type={r.type}/>
                      <div>
                        <div className="name">{r.name}</div>
                        <div className="sub">{r.subtype}</div>
                      </div>
                    </div>
                  </td>
                  <td><TypeBadge type={r.type}/></td>
                  <td><span className="mono" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)" }}>{r.endpoint.replace(/^https?:\/\//, "")}</span></td>
                  <td><StatusPill status={r.status}/></td>
                  <td className="num" style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{r.reqs24h.toLocaleString()}</td>
                  <td><div className="row-actions"><Link href={`/resources/${r.id}`} className="btn btn-ghost btn-sm" onClick={(e) => e.stopPropagation()}>Manage</Link></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">
            <div className="icon-wrap"><Icon name="resources" size={18}/></div>
            <div className="title">No resources connected</div>
            <div className="sub">Connect your first resource to start routing requests through the gateway.</div>
            <button className="btn btn-primary" onClick={openAddResource}><Icon name="plus" size={13}/>Add resource</button>
          </div>
        )}
      </div>

      <div className="split-2">
        <div className="section">
          <div className="section-head">
            <div>
              <h3 className="section-title">Recent activity</h3>
              <p className="section-sub">Latest requests across all resources</p>
            </div>
            <Link href="/logs" className="btn btn-ghost btn-sm">Open logs<Icon name="external" size={12}/></Link>
          </div>
          {hasLogs ? (
            <table className="tbl">
              <tbody>
                {LOGS.slice(0, 8).map((l, i) => (
                  <tr key={i}>
                    <td className="mono dim" style={{ width: 90, fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-3)" }}>{l.time.slice(0, 8)}</td>
                    <td style={{ color: "var(--text-1)", fontSize: 12.5 }}>{l.res}</td>
                    <td style={{ width: 60 }}><span className={"method method-" + l.method}>{l.method}</span></td>
                    <td className="mono" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)" }}>{l.path}</td>
                    <td style={{ width: 60 }}><span className={"sc " + statusClass(l.status)}>{l.status}</span></td>
                    <td className="num" style={{ width: 70, textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)" }}>{l.dur}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">
              <div className="icon-wrap"><Icon name="logs" size={18}/></div>
              <div className="title">No recent activity</div>
              <div className="sub">Logs will appear here once requests reach a connected resource.</div>
            </div>
          )}
        </div>

        <div>
          <div className="section">
            <div className="section-head"><h3 className="section-title">Quick actions</h3></div>
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="qa-card" onClick={openAddResource} style={{ background: "transparent", border: "1px solid var(--border)" }}>
                <div className="icon-wrap"><Icon name="plus" size={15}/></div>
                <div style={{ textAlign: "left" }}><div className="name">Add a resource</div><div className="desc">Tunnel a new local service</div></div>
                <Icon name="chevronR" size={14} className="arrow"/>
              </button>
              <button className="qa-card" onClick={() => router.push("/resources")} style={{ background: "transparent", border: "1px solid var(--border)" }}>
                <div className="icon-wrap"><Icon name="key" size={15}/></div>
                <div style={{ textAlign: "left" }}><div className="name">Generate API key</div><div className="desc">Issue a token for a resource</div></div>
                <Icon name="chevronR" size={14} className="arrow"/>
              </button>
            </div>
          </div>

          <div className="section">
            <div className="section-head"><h3 className="section-title">Top resources - 24h</h3></div>
            <div style={{ padding: 4 }}>
              {topResources.map((r, i) => {
                const max = Math.max(...resources.map(resource => resource.reqs24h), 1);
                const pct = (r.reqs24h / max) * 100;
                return (
                  <div key={r.id} style={{ padding: "10px 14px", borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <ResIcon type={r.type} size={11}/>
                        <span style={{ fontSize: 12.5, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-2)" }}>{r.reqs24h.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 4, background: "var(--bg-2)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: pct + "%", background: r.type === "database" ? "var(--purple)" : r.type === "ai-model" ? "var(--green)" : "var(--accent)", opacity: 0.7 }}/>
                    </div>
                  </div>
                );
              })}
              {topResources.length === 0 ? (
                <div className="empty">
                  <div className="icon-wrap"><Icon name="activity" size={18}/></div>
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
  const type = resource.type === "ai_model" ? "ai-model" : resource.type === "http_api" ? "http-api" : resource.type;
  return {
    ...resource,
    type: type as ResourceType,
    subtype: resource.subtype ?? type,
    endpoint: resource.endpoint ?? `${gatewayUrl}/r/${resource.id}`,
    local: resource.local ?? "-",
    status: !resource.active ? "inactive" : (resource as Resource & { connected?: boolean }).connected ? "active" : "idle",
    keys: resource.keys ?? 0,
    lastActive: resource.lastActive ?? "Never",
    reqs24h: resource.reqs24h ?? 0
  };
}
