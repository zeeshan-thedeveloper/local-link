"use client";

import { Fragment, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ResIcon } from "@/components/ui/ResIcon";
import { statusClass } from "@/lib/data";
import type { RequestLog, Resource, ResourceType } from "@/lib/types";

type StatusFilter = "all" | "2xx" | "4xx" | "5xx";
type BackendLog = {
  id: string;
  resourceId: string;
  apiKeyId: string | null;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  createdAt: string;
};
type LogsResponse = { items: BackendLog[]; page: number; limit: number; total: number };

const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export default function LogsPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [resource, setResource] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const populated = logs.length > 0;

  useEffect(() => {
    void Promise.all([
      fetch(`${gatewayUrl}/logs?limit=50`, { credentials: "include" }).then((response) => (response.ok ? response.json() : { items: [] })),
      fetch(`${gatewayUrl}/resources`, { credentials: "include" }).then((response) => (response.ok ? response.json() : []))
    ])
      .then(([logsResponse, resourceItems]: [
        LogsResponse,
        Array<Resource & { type: ResourceType | "ai_model" | "http_api" }>
      ]) => {
        const normalizedResources = resourceItems.map(normalizeResource);
        const resourceMap = new Map(normalizedResources.map(item => [item.id, item.name]));
        setResources(normalizedResources);
        setLogs(logsResponse.items.map(item => normalizeLog(item, resourceMap)));
      })
      .catch(() => {
        setResources([]);
        setLogs([]);
      });
  }, []);

  const items = logs.filter(l => {
    if (filter === "2xx" && !(l.status >= 200 && l.status < 300)) return false;
    if (filter === "4xx" && !(l.status >= 400 && l.status < 500)) return false;
    if (filter === "5xx" && !(l.status >= 500)) return false;
    if (resource !== "all" && l.res !== resource) return false;
    return true;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Request logs</h1>
          <p className="page-sub">Live stream of every request through the gateway</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="pill green"><span className="dot"/>Live</span>
          <button className="btn btn-secondary"><Icon name="download" size={13}/>Export CSV</button>
        </div>
      </div>

      <div className="section">
        <div className="filters">
          <select className="filter-input" value={resource} onChange={e => setResource(e.target.value)} style={{ minWidth: 180 }}>
            <option value="all">All resources</option>
            {resources.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
          {[
            { id: "all", label: "All" },
            { id: "2xx", label: "2xx" },
            { id: "4xx", label: "4xx" },
            { id: "5xx", label: "5xx" },
          ].map(f => (
            <button key={f.id} className={"chip " + (filter === f.id ? "active" : "")} onClick={() => setFilter(f.id as StatusFilter)}>{f.label}</button>
          ))}
          <span className="chip"><Icon name="clock" size={12}/>Last 1 hour</span>
          <input className="filter-input filter-search" placeholder="Search path or method..." style={{ flex: 1, maxWidth: 360, marginLeft: "auto" }}/>
          <button className="chip"><Icon name="refresh" size={12}/></button>
        </div>

        {populated && items.length > 0 ? (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th style={{ width: 130 }}>Timestamp</th>
                <th>Resource</th>
                <th style={{ width: 70 }}>Method</th>
                <th>Path</th>
                <th style={{ width: 70 }}>Status</th>
                <th style={{ width: 80, textAlign: "right" }}>Duration</th>
                <th style={{ width: 140 }}>API key</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l, i) => {
                const resType = resources.find(r => r.name === l.res)?.type || "http-api";
                return (
                  <Fragment key={l.id ?? i}>
                    <tr style={{ cursor: "pointer" }} onClick={() => setExpanded(expanded === i ? null : i)}>
                      <td style={{ color: "var(--text-3)" }}><Icon name={expanded === i ? "chevronD" : "chevronR"} size={12}/></td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-3)" }}>{l.time}</td>
                      <td><div style={{ display: "flex", alignItems: "center", gap: 7 }}><ResIcon type={resType} size={10}/><span style={{ fontSize: 12.5 }}>{l.res}</span></div></td>
                      <td><span className={"method method-" + l.method}>{l.method}</span></td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-1)" }}>{l.path}</td>
                      <td><span className={"sc " + statusClass(l.status)}>{l.status}</span></td>
                      <td className="num" style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)" }}>{l.dur}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-3)" }}>{l.key}</td>
                    </tr>
                    {expanded === i && (
                      <tr className="log-detail"><td colSpan={8} style={{ padding: 0 }}>
                        <div className="log-detail-inner">
                          <div>
                            <h4>Request</h4>
                            <pre>{`${l.method} ${l.path} HTTP/1.1
Host: gw.locallink.dev
Authorization: Bearer ${l.key}
Content-Type: application/json
User-Agent: locallink-sdk/0.4.1
X-Request-Id: req_8h2j${i}q4xv9bL2p

{
  "query": "SELECT * FROM users WHERE id = $1",
  "params": [42]
}`}</pre>
                          </div>
                          <div>
                            <h4>Response - {l.status} - {l.dur}</h4>
                            <pre>{`HTTP/1.1 ${l.status} ${l.status === 200 ? "OK" : l.status === 401 ? "Unauthorized" : l.status === 404 ? "Not Found" : l.status === 429 ? "Too Many Requests" : "Internal Server Error"}
Content-Type: application/json
X-Tunnel-Latency: ${l.dur}
X-Resource-Id: ${resources.find(r => r.name === l.res)?.id || "r_xxx"}

${l.status === 200 ? '{\n  "rows": [{"id": 42, "email": "ada@kestrel.io"}],\n  "rowCount": 1\n}' : l.status === 401 ? '{\n  "error": "invalid_api_key",\n  "message": "Key was revoked"\n}' : '{\n  "error": "upstream_error"\n}'}`}</pre>
                          </div>
                        </div>
                      </td></tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty">
            <div className="icon-wrap"><Icon name="logs" size={18}/></div>
            <div className="title">No requests in this window</div>
            <div className="sub">Adjust filters or wait for traffic. Logs appear here in real time as requests flow through the gateway.</div>
          </div>
        )}

        {populated && items.length > 0 && (
          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--text-3)" }}>
            <span>Showing {items.length} of {logs.length} requests</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button className="btn btn-ghost btn-sm">Prev</button>
              <button className="btn btn-ghost btn-sm">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeLog(item: BackendLog, resourceMap: Map<string, string>): RequestLog {
  return {
    id: item.id,
    time: new Date(item.createdAt).toISOString(),
    res: resourceMap.get(item.resourceId) ?? item.resourceId,
    method: item.method as RequestLog["method"],
    path: item.path,
    status: item.statusCode,
    dur: `${item.durationMs}ms`,
    key: item.apiKeyId ?? "–",
  };
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
