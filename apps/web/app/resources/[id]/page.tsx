"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOverlays } from "@/components/overlays/OverlayContext";
import { CopyBtn } from "@/components/ui/CopyBtn";
import { Icon } from "@/components/ui/Icon";
import { ResIcon } from "@/components/ui/ResIcon";
import { StatusPill } from "@/components/ui/StatusPill";
import { TypeBadge } from "@/components/ui/TypeBadge";
import type { ApiKey, RequestLog, Resource, ResourceType } from "@/lib/types";

type Tab = "overview" | "connect" | "keys" | "logs" | "config";
type HostStatus = { id: string; socketId: string; lastSeen: string | null };
type GatewayRequestLog = Partial<RequestLog> & {
  id: string;
  resourceId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  createdAt: string;
};

const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export default function ResourceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { openGenerateKey } = useOverlays();
  const [resource, setResource] = useState<Resource | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [hosts, setHosts] = useState<HostStatus[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [rotatedToken, setRotatedToken] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      fetchJson<Resource & { type: ResourceType | "ai_model" | "http_api" }>(`/resources/${params.id}`),
      fetchJson<ApiKey[]>(`/resources/${params.id}/keys`).catch(() => []),
      fetchJson<{ items: GatewayRequestLog[] }>(`/logs?resourceId=${params.id}&limit=20`).then((data) => data.items.map(normalizeLog)).catch(() => []),
      fetchJson<{ hosts: HostStatus[] }>("/tunnel/status").then((data) => data.hosts).catch(() => [])
    ]).then(([resource, keys, logs, hosts]) => {
      setResource(normalizeResource(resource));
      setKeys(keys);
      setLogs(logs);
      setHosts(hosts);
    });
  }, [params.id]);

  const host = useMemo(() => hosts.find((item) => item.id === resource?.id), [hosts, resource?.id]);

  if (!resource) {
    return (
      <div className="page">
        <div className="section">
          <div className="empty">
            <div className="icon-wrap"><Icon name="resources" size={18} /></div>
            <div className="title">Loading resource</div>
            <div className="sub">Fetching current gateway data.</div>
          </div>
        </div>
      </div>
    );
  }

  const endpoint = `${gatewayUrl}/r/${resource.id}`;
  const curl = `curl -X POST ${endpoint}/query \\
  -H "Authorization: Bearer ll_..." \\
  -H "Content-Type: application/json" \\
  -d '{"sql": "SELECT * FROM users LIMIT 10"}'`;

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, fontSize: 13 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push("/resources")}><Icon name="chevron" size={12} stroke={2} />Back</button>
        <span style={{ color: "var(--text-3)" }}>/</span>
        <span style={{ color: "var(--text-2)" }}>Resources</span>
        <span style={{ color: "var(--text-3)" }}>/</span>
        <span className="mono" style={{ color: "var(--text-0)", fontSize: 12.5 }}>{resource.name}</span>
      </div>

      <div className="section" style={{ marginBottom: 18 }}>
        <div className="detail-head">
          <ResIcon type={resource.type} size={18} />
          <div style={{ flex: 1 }}>
            <h2>{resource.name}</h2>
            <div className="meta">
              <TypeBadge type={resource.type} />
              <StatusPill status={host ? "connected" : "disconnected"} label={host ? "Online" : "Offline"} />
              <span>-</span>
              <span className="mono">id: {resource.id}</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setTab("connect")}><Icon name="server" size={13} />Connect</button>
        </div>

        <div className="tabs">
          {[
            { id: "overview", label: "Overview" },
            { id: "connect", label: "Connect" },
            { id: "keys", label: `API Keys - ${keys.length}` },
            { id: "logs", label: "Logs" },
            { id: "config", label: "Config" }
          ].map((item) => (
            <button key={item.id} className={"tab " + (tab === item.id ? "active" : "")} onClick={() => setTab(item.id as Tab)}>{item.label}</button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <>
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <div className="stat-card"><div className="stat-label"><Icon name="activity" size={13} />Requests</div><div className="stat-value">{logs.length}</div><div className="stat-delta">latest page</div></div>
            <div className="stat-card"><div className="stat-label"><Icon name="clock" size={13} />Last seen</div><div className="stat-value" style={{ fontSize: 18 }}>{host?.lastSeen ? formatDate(host.lastSeen) : "-"}</div><div className="stat-delta">{host ? "Host heartbeat received" : "Host offline"}</div></div>
            <div className="stat-card"><div className="stat-label"><Icon name="key" size={13} />API keys</div><div className="stat-value">{keys.length}</div><div className="stat-delta">authorized tokens</div></div>
            <div className="stat-card"><div className="stat-label"><Icon name="resources" size={13} />Resource</div><div className="stat-value" style={{ fontSize: 18 }}>{resource.active ? "Active" : "Inactive"}</div><div className="stat-delta">gateway routing</div></div>
          </div>
          <EndpointSection endpoint={endpoint} curl={curl} />
          <KeysSection keys={keys} onGenerateKey={openGenerateKey} />
          <RequestsTable logs={logs} />
        </>
      )}

      {tab === "connect" && (
        <ConnectSection
          resource={resource}
          host={host}
          rotatedToken={rotatedToken}
          onRotate={async () => {
            const rotated = await fetchJson<{ hostToken: string }>(`/resources/${resource.id}/rotate-token`, { method: "POST" });
            setRotatedToken(rotated.hostToken);
          }}
        />
      )}
      {tab === "keys" && <KeysSection keys={keys} onGenerateKey={openGenerateKey} />}
      {tab === "logs" && <RequestsTable logs={logs} />}
      {tab === "config" && (
        <div className="section">
          <div className="section-head"><div><h3 className="section-title">Configuration</h3></div></div>
          <dl className="kv-grid">
            <dt>Resource ID</dt><dd>{resource.id}</dd>
            <dt>Type</dt><dd>{resource.type}</dd>
            <dt>Host ID</dt><dd>{resource.hostId}</dd>
            <dt>Gateway URL</dt><dd>{endpoint}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}

function EndpointSection({ endpoint, curl }: { endpoint: string; curl: string }) {
  return (
    <div className="section">
      <div className="section-head"><div><h3 className="section-title">Endpoint</h3><p className="section-sub">Public gateway URL for this resource.</p></div></div>
      <div style={{ padding: 18 }}>
        <div className="field-label">Gateway URL</div>
        <div className="code"><span className="text">{endpoint}</span><CopyBtn /></div>
        <div className="field-label" style={{ marginTop: 18 }}>Example request</div>
        <pre className="code-block">{curl}</pre>
      </div>
    </div>
  );
}

function ConnectSection({ resource, host, rotatedToken, onRotate }: { resource: Resource; host?: HostStatus; rotatedToken: string | null; onRotate: () => Promise<void> }) {
  const register = `locallink register \\
  --id ${resource.id} \\
  --type ${resource.type} \\
  ${resource.type === "database" ? "--connection-string ..." : "--url ..."}`;
  return (
    <div className="section">
      <div className="section-head">
        <div><h3 className="section-title">Host connection</h3><p className="section-sub">Current status and setup commands for this resource.</p></div>
        <StatusPill status={host ? "connected" : "disconnected"} label={host ? "Online" : "Offline"} />
      </div>
      <div style={{ padding: 18, display: "grid", gap: 14 }}>
        <dl className="kv-grid" style={{ margin: 0 }}>
          <dt>Last seen</dt><dd>{host?.lastSeen ? formatDate(host.lastSeen) : "Never"}</dd>
          <dt>Socket</dt><dd>{host?.socketId ?? "-"}</dd>
        </dl>
        <CommandBlock label="Install" value="npm install -g @locallink/host" />
        <CommandBlock label="Initialize" value={`locallink init --gateway ${gatewayUrl} --token <token shown once>`} />
        <CommandBlock label="Register local connection" value={register} />
        <CommandBlock label="Start" value="locallink start" />
        {rotatedToken && <CommandBlock label="New token" value={rotatedToken} />}
        <button className="btn btn-secondary" type="button" onClick={() => void onRotate()} style={{ justifySelf: "start" }}>
          <Icon name="refresh" size={13} />Regenerate token
        </button>
      </div>
    </div>
  );
}

function CommandBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="field-label">{label}</div>
      <pre className="code-block" style={{ margin: 0 }}>{value}</pre>
    </div>
  );
}

function KeysSection({ keys, onGenerateKey }: { keys: ApiKey[]; onGenerateKey: () => void }) {
  return (
    <div className="section">
      <div className="section-head">
        <div><h3 className="section-title">API keys</h3><p className="section-sub">Tokens authorized to call this resource</p></div>
        <button className="btn btn-primary btn-sm" onClick={onGenerateKey}><Icon name="plus" size={12} />Generate key</button>
      </div>
      <table className="tbl">
        <thead><tr><th>Name</th><th>Prefix</th><th>Created</th><th>Last used</th><th style={{ width: 80 }}></th></tr></thead>
        <tbody>
          {keys.length > 0 ? keys.map((key) => (
            <tr key={key.id ?? key.name}>
              <td style={{ fontWeight: 500 }}>{key.name}</td>
              <td><span className="mono" style={{ fontSize: 12.5, color: "var(--text-2)" }}>{key.prefix}</span></td>
              <td style={{ color: "var(--text-2)", fontSize: 12.5 }}>{formatDate(key.createdAt ?? key.created)}</td>
              <td style={{ color: "var(--text-2)", fontSize: 12.5 }}>{key.lastUsed ? formatDate(key.lastUsed) : "Never"}</td>
              <td><div className="row-actions"><button className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }}>Revoke</button></div></td>
            </tr>
          )) : (
            <tr><td colSpan={5}><div className="empty"><div className="title">No API keys</div><div className="sub">Generate a key after connecting a resource.</div></div></td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RequestsTable({ logs }: { logs: RequestLog[] }) {
  return (
    <div className="section">
      <div className="section-head"><div><h3 className="section-title">Request logs</h3></div></div>
      {logs.length === 0 ? (
        <div className="empty"><div className="icon-wrap"><Icon name="logs" size={18} /></div><div className="title">No request logs</div><div className="sub">Requests will appear here once this resource receives traffic.</div></div>
      ) : (
        <table className="tbl">
          <thead><tr><th>Timestamp</th><th>Method</th><th>Path</th><th>Status</th><th style={{ textAlign: "right" }}>Duration</th></tr></thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id ?? `${log.createdAt}-${log.path}`}>
                <td className="mono" style={{ fontSize: 11.5, color: "var(--text-3)" }}>{formatDate(log.createdAt)}</td>
                <td><span className={"method method-" + log.method}>{log.method}</span></td>
                <td className="mono" style={{ fontSize: 12, color: "var(--text-1)" }}>{log.path}</td>
                <td><span className="sc sc-2xx">{log.statusCode ?? log.status}</span></td>
                <td className="num" style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)" }}>{log.durationMs ?? log.dur}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${gatewayUrl}${path}`, { credentials: "include", ...init });
  if (!response.ok) throw new Error(`Gateway request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

function normalizeResource(resource: Omit<Resource, "type"> & { type: string }): Resource {
  const type = resource.type === "ai_model" ? "ai-model" : resource.type === "http_api" ? "http-api" : resource.type;
  return {
    ...resource,
    type: type as ResourceType,
    subtype: resource.subtype ?? type,
    endpoint: resource.endpoint ?? `${gatewayUrl}/r/${resource.id}`,
    local: resource.local ?? "-",
    status: resource.active ? "active" : "inactive",
    keys: resource.keys ?? 0,
    lastActive: resource.lastActive ?? "Never",
    reqs24h: resource.reqs24h ?? 0
  };
}

function normalizeLog(log: GatewayRequestLog): RequestLog {
  return {
    ...log,
    method: log.method as RequestLog["method"],
    time: log.time ?? log.createdAt ?? "",
    res: log.res ?? "",
    status: log.status ?? log.statusCode ?? 0,
    dur: log.dur ?? String(log.durationMs ?? 0),
    key: log.key ?? ""
  };
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
