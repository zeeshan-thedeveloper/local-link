"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOverlays } from "@/components/overlays/OverlayContext";
import { CopyBtn } from "@/components/ui/CopyBtn";
import { Icon } from "@/components/ui/Icon";
import { ResIcon } from "@/components/ui/ResIcon";
import { StatusPill } from "@/components/ui/StatusPill";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { gatewayBaseDomain, resourceEndpoint } from "@/lib/resource-url";
import type { ApiKey, RequestLog, Resource, ResourceType } from "@/lib/types";
import styles from "./page.module.css";

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
type LogPage = { items: RequestLog[]; page: number; limit: number; total: number };

const gatewayUrl =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export default function ResourceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { openGenerateKey } = useOverlays();
  const [resource, setResource] = useState<Resource | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [logPage, setLogPage] = useState<LogPage>({ items: [], page: 1, limit: 10, total: 0 });
  const [hosts, setHosts] = useState<HostStatus[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [rotatedToken, setRotatedToken] = useState<string | null>(null);
  const logLimit = 10;

  const refreshKeys = () => {
    fetchJson<ApiKey[]>(`/resources/${params.id}/keys`)
      .then(setKeys)
      .catch(() => {});
  };

  const revokeKey = (keyId: string) => {
    void fetchJson(`/keys/${keyId}`, { method: "DELETE" })
      .then(refreshKeys)
      .catch(() => {});
  };

  const fetchLogs = (page: number) => {
    fetchJson<{ items: GatewayRequestLog[]; page: number; limit: number; total: number }>(
      `/logs?resourceId=${params.id}&page=${page}&limit=${logLimit}`,
    )
      .then((data) =>
        setLogPage({
          items: data.items.map(normalizeLog),
          page: data.page,
          limit: data.limit,
          total: data.total,
        }),
      )
      .catch(() => {});
  };

  const refreshHosts = () => {
    fetchJson<{ hosts: HostStatus[] }>("/tunnel/status")
      .then((data) => setHosts(data.hosts))
      .catch(() => {});
  };

  useEffect(() => {
    void Promise.all([
      fetchJson<Resource & { type: ResourceType | "ai_model" | "http_api" | "web_app" }>(
        `/resources/${params.id}`,
      ),
      fetchJson<ApiKey[]>(`/resources/${params.id}/keys`).catch(() => [] as ApiKey[]),
      fetchJson<{ items: GatewayRequestLog[]; page: number; limit: number; total: number }>(
        `/logs?resourceId=${params.id}&page=1&limit=${logLimit}`,
      ).catch(() => ({ items: [] as GatewayRequestLog[], page: 1, limit: logLimit, total: 0 })),
      fetchJson<{ hosts: HostStatus[] }>("/tunnel/status")
        .then((data) => data.hosts)
        .catch(() => [] as HostStatus[]),
    ]).then(([resource, keys, logsData, hosts]) => {
      setResource(normalizeResource(resource));
      setKeys(keys);
      setLogPage({
        items: logsData.items.map(normalizeLog),
        page: 1,
        limit: logLimit,
        total: logsData.total,
      });
      setHosts(hosts);
    });
  }, [params.id]);

  useEffect(() => {
    const interval = window.setInterval(refreshHosts, 5_000);
    window.addEventListener("focus", refreshHosts);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshHosts);
    };
  }, []);

  const handleLogPageChange = (newPage: number) => {
    fetchLogs(newPage);
  };

  const host = useMemo(() => hosts.find((item) => item.id === resource?.id), [hosts, resource?.id]);

  useEffect(() => {
    if (!resource) return;
    if (!host) setTab("connect");
  }, [resource?.id]);

  if (!resource) {
    return (
      <div className="page">
        <div className="section">
          <div className="empty">
            <div className="icon-wrap">
              <Icon name="resources" size={18} />
            </div>
            <div className="title">Loading resource</div>
            <div className="sub">Fetching current gateway data.</div>
          </div>
        </div>
      </div>
    );
  }

  const endpoint = resourceEndpoint(resource, gatewayUrl);
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "connect", label: "Connect" },
    ...(resource.type !== "web-app"
      ? [{ id: "keys" as Tab, label: `API Keys - ${keys.length}` }]
      : []),
    { id: "logs", label: "Logs" },
    { id: "config", label: "Config" },
  ];

  return (
    <div className="page">
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, fontSize: 13 }}
      >
        <button className="btn btn-ghost btn-sm" onClick={() => router.push("/resources")}>
          <Icon name="chevron" size={12} stroke={2} />
          Back
        </button>
        <span style={{ color: "var(--text-3)" }}>/</span>
        <span style={{ color: "var(--text-2)" }}>Resources</span>
        <span style={{ color: "var(--text-3)" }}>/</span>
        <span className="mono" style={{ color: "var(--text-0)", fontSize: 12.5 }}>
          {resource.name}
        </span>
      </div>

      <div className="section" style={{ marginBottom: 18 }}>
        <div className="detail-head">
          <ResIcon type={resource.type} size={18} />
          <div style={{ flex: 1 }}>
            <h2>{resource.name}</h2>
            <div className="meta">
              <TypeBadge type={resource.type} />
              <StatusPill
                status={host ? "connected" : "disconnected"}
                label={host ? "Online" : "Offline"}
              />
              <span>-</span>
              <span className="mono">id: {resource.id}</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setTab("connect")}>
            <Icon name="server" size={13} />
            Connect
          </button>
        </div>

        {resource.type === "http-api" ? (
          <div className="callout" style={{ margin: "0 18px 18px" }}>
            <Icon name="warn" size={14} />
            <span>
              This is a legacy HTTP resource. It still works through the path-based{" "}
              <span className="mono">/r/{resource.id}</span> route, but new browser apps and APIs
              should use Web App or API resources.
            </span>
          </div>
        ) : null}

        <div className="tabs">
          {tabs.map((item) => (
            <button
              key={item.id}
              className={"tab " + (tab === item.id ? "active" : "")}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <>
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <div className="stat-card">
              <div className="stat-label">
                <Icon name="activity" size={13} />
                Requests
              </div>
              <div className="stat-value">{logPage.items.length}</div>
              <div className="stat-delta">latest page</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">
                <Icon name="clock" size={13} />
                Last seen
              </div>
              <div className="stat-value" style={{ fontSize: 18 }}>
                {host?.lastSeen ? formatDate(host.lastSeen) : "-"}
              </div>
              <div className="stat-delta">{host ? "Host heartbeat received" : "Host offline"}</div>
            </div>
            {resource.type === "web-app" ? (
              <div className="stat-card">
                <div className="stat-label">
                  <Icon name="globe" size={13} />
                  Access
                </div>
                <div className="stat-value" style={{ fontSize: 18 }}>
                  Public
                </div>
                <div className="stat-delta">no API key required</div>
              </div>
            ) : (
              <div className="stat-card">
                <div className="stat-label">
                  <Icon name="key" size={13} />
                  API keys
                </div>
                <div className="stat-value">{keys.length}</div>
                <div className="stat-delta">authorized tokens</div>
              </div>
            )}
            <div className="stat-card">
              <div className="stat-label">
                <Icon name="resources" size={13} />
                Resource
              </div>
              <div className="stat-value" style={{ fontSize: 18 }}>
                {resource.active ? "Active" : "Inactive"}
              </div>
              <div className="stat-delta">gateway routing</div>
            </div>
          </div>
          {resource.type !== "web-app" && (
            <KeysSection
              keys={keys}
              onGenerateKey={() => openGenerateKey(resource.id, refreshKeys)}
              onRevokeKey={revokeKey}
            />
          )}
          <RequestsTable logPage={logPage} onPageChange={handleLogPageChange} />
        </>
      )}

      {tab === "connect" && (
        <ConnectSection
          resource={resource}
          endpoint={endpoint}
          host={host}
          rotatedToken={rotatedToken}
          onOpenKeys={() => setTab("keys")}
          onOpenConfig={() => setTab("config")}
        />
      )}
      {tab === "keys" && resource.type !== "web-app" && (
        <KeysSection
          keys={keys}
          onGenerateKey={() => openGenerateKey(resource.id, refreshKeys)}
          onRevokeKey={revokeKey}
        />
      )}
      {tab === "logs" && <RequestsTable logPage={logPage} onPageChange={handleLogPageChange} />}
      {tab === "config" && (
        <ConfigSection
          resource={resource}
          endpoint={endpoint}
          host={host}
          rotatedToken={rotatedToken}
          onSaved={(updated) => setResource(normalizeResource(updated))}
          onRotate={async () => {
            const rotated = await fetchJson<{ hostToken: string }>(
              `/resources/${resource.id}/rotate-token`,
              { method: "POST" },
            );
            setRotatedToken(rotated.hostToken);
          }}
        />
      )}
    </div>
  );
}

function ConnectSection({
  resource,
  endpoint,
  host,
  rotatedToken,
  onOpenKeys,
  onOpenConfig,
}: {
  resource: Resource;
  endpoint: string;
  host?: HostStatus;
  rotatedToken: string | null;
  onOpenKeys: () => void;
  onOpenConfig: () => void;
}) {
  const tokenArg = rotatedToken ?? "<host token from Config>";
  const setupSteps = [
    {
      number: 1,
      label: "Configure gateway",
      command: `pnpm --filter @locallink/cli dev -- setup --gateway ${gatewayUrl}`,
    },
    {
      number: 2,
      label: "Authenticate",
      command: `append --token ${tokenArg}`,
    },
    {
      number: 3,
      label: "Start the host",
      command: "pnpm --filter @locallink/cli dev -- start",
    },
  ];

  if (host) {
    return (
      <div className="section">
        <div className="section-head">
          <div>
            <h3 className="section-title">Host connected</h3>
            <p className="section-sub">This resource is online and ready to proxy requests.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <StatusPill status="connected" label="Online" />
            <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
              Last seen {formatDate(host.lastSeen)}
            </span>
          </div>
        </div>
        <div style={{ padding: 18, display: "grid", gap: 14 }}>
          <div className="code">
            <span className="text">{endpoint}</span>
            <CopyBtn onCopy={() => void navigator.clipboard.writeText(endpoint)} />
          </div>
          <p className="field-help" style={{ margin: 0 }}>
            Setup instructions are hidden while the host is online. Host token management is
            available in Config.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="section-head">
        <div>
          <h3 className="section-title">Connect host</h3>
          <p className="section-sub">
            Run these commands on the machine where your local resource is running.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <StatusPill status="disconnected" label="Offline" />
        </div>
      </div>
      <div style={{ padding: 18, display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gap: 14 }}>
          {setupSteps.map((step) => (
            <CommandStep
              key={step.number}
              number={step.number}
              label={step.label}
              command={step.command}
            />
          ))}
        </div>
        {resource.type === "web-app" ? (
          <div className="callout" style={{ gap: 8 }}>
            <Icon name="globe" size={14} />
            <span>
              <strong>Web apps are public.</strong> Once connected, anyone can open{" "}
              <a
                href={endpoint}
                target="_blank"
                rel="noopener noreferrer"
                className="mono"
                style={{ color: "var(--accent)" }}
              >
                {endpoint}
              </a>{" "}
              in a browser - no API key needed.
            </span>
          </div>
        ) : (
          <div className="callout">
            <Icon name="key" size={14} />
            <span>
              Requests require an API key. Generate one under the{" "}
              <button
                type="button"
                onClick={onOpenKeys}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "var(--accent)",
                  cursor: "pointer",
                  font: "inherit",
                  padding: 0,
                }}
              >
                API Keys
              </button>{" "}
              tab.
            </span>
          </div>
        )}
        <p className="field-help" style={{ margin: 0 }}>
          The original token is shown only once. Generate a replacement in the{" "}
          <button
            type="button"
            onClick={onOpenConfig}
            style={{
              background: "transparent",
              border: 0,
              color: "var(--accent)",
              cursor: "pointer",
              font: "inherit",
              padding: 0,
            }}
          >
            Config
          </button>{" "}
          tab when you need to connect this resource again.
        </p>
      </div>
    </div>
  );
}

function CommandStep({
  number,
  label,
  command,
}: {
  number: number;
  label: string;
  command: string;
}) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          color: "var(--text-1)",
          display: "grid",
          placeItems: "center",
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {number}
      </div>
      <div style={{ flex: 1 }}>
        <div className="field-label">{label}</div>
        <pre className="code-block" style={{ margin: 0 }}>
          {command}
        </pre>
      </div>
    </div>
  );
}

function KeysSection({
  keys,
  onGenerateKey,
  onRevokeKey,
}: {
  keys: ApiKey[];
  onGenerateKey: () => void;
  onRevokeKey: (id: string) => void;
}) {
  return (
    <div className="section">
      <div className="section-head">
        <div>
          <h3 className="section-title">API keys</h3>
          <p className="section-sub">Tokens authorized to call this resource</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onGenerateKey}>
          <Icon name="plus" size={12} />
          Generate key
        </button>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Name</th>
            <th>Prefix</th>
            <th>Created</th>
            <th>Last used</th>
            <th style={{ width: 80 }}></th>
          </tr>
        </thead>
        <tbody>
          {keys.length > 0 ? (
            keys.map((key) => (
              <tr key={key.id ?? key.name}>
                <td style={{ fontWeight: 500 }}>{key.name}</td>
                <td>
                  <span className="mono" style={{ fontSize: 12.5, color: "var(--text-2)" }}>
                    {key.prefix}
                  </span>
                </td>
                <td style={{ color: "var(--text-2)", fontSize: 12.5 }}>
                  {formatDate(key.createdAt ?? key.created)}
                </td>
                <td style={{ color: "var(--text-2)", fontSize: 12.5 }}>
                  {key.lastUsed ? formatDate(key.lastUsed) : "Never"}
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: "var(--red)" }}
                      onClick={() => key.id && onRevokeKey(key.id)}
                      disabled={!key.id}
                    >
                      Revoke
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5}>
                <div className="empty">
                  <div className="title">No API keys</div>
                  <div className="sub">Generate a key to start making requests.</div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RequestsTable({
  logPage,
  onPageChange,
}: {
  logPage: LogPage;
  onPageChange: (page: number) => void;
}) {
  const { items, page, limit, total } = logPage;
  const hasKnownTotal = total > 0;
  const totalPages = hasKnownTotal ? Math.max(1, Math.ceil(total / limit)) : page;
  const showPagination = page > 1 || items.length > 0;
  const canGoNext = hasKnownTotal ? page < totalPages : items.length >= limit;
  const paginationControls = showPagination ? (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Prev
      </button>
      <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>
        {page} / {hasKnownTotal ? totalPages : "?"}
      </span>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => onPageChange(page + 1)}
        disabled={!canGoNext}
      >
        Next
      </button>
    </div>
  ) : null;

  return (
    <div className="section">
      <div className="section-head">
        <div>
          <h3 className="section-title">Request logs</h3>
          {total > 0 && <p className="section-sub">{total} total requests</p>}
        </div>
        {paginationControls}
      </div>
      {items.length === 0 ? (
        <div className="empty">
          <div className="icon-wrap">
            <Icon name="logs" size={18} />
          </div>
          <div className="title">No request logs</div>
          <div className="sub">Requests will appear here once this resource receives traffic.</div>
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Method</th>
              <th>Path</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Duration</th>
            </tr>
          </thead>
          <tbody>
            {items.map((log) => {
              const status = log.statusCode ?? log.status;
              return (
                <tr key={log.id ?? `${log.createdAt}-${log.path}`}>
                  <td className="mono" style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                    {formatDate(log.createdAt)}
                  </td>
                  <td>
                    <span className={"method method-" + log.method}>{log.method}</span>
                  </td>
                  <td className="mono" style={{ fontSize: 12, color: "var(--text-1)" }}>
                    {log.path}
                  </td>
                  <td>
                    <span
                      className={"sc sc-" + (status >= 500 ? "5xx" : status >= 400 ? "4xx" : "2xx")}
                    >
                      {status}
                    </span>
                  </td>
                  <td
                    className="num"
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--text-2)",
                    }}
                  >
                    {log.durationMs ?? log.dur}ms
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {paginationControls && items.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "12px 18px",
            borderTop: "1px solid var(--border)",
          }}
        >
          {paginationControls}
        </div>
      )}
    </div>
  );
}

type DbConfig = { engine: string; connectionString?: string; filePath?: string };
type HttpConfig = { url: string; publicAccess?: boolean; headers?: Record<string, string> };
type AiConfig = { provider: string; baseUrl: string; model: string };

function ConfigSection({
  resource,
  endpoint,
  host,
  rotatedToken,
  onSaved,
  onRotate,
}: {
  resource: Resource;
  endpoint: string;
  host?: HostStatus;
  rotatedToken: string | null;
  onSaved: (r: Resource) => void;
  onRotate: () => Promise<void>;
}) {
  const config = resource.config as DbConfig | HttpConfig | AiConfig | null | undefined;
  const isDb = resource.type === "database";
  const isHttp =
    resource.type === "http-api" || resource.type === "web-app" || resource.type === "api";
  const canTogglePublicAccess = resource.type === "http-api" || resource.type === "api";

  const [slug, setSlug] = useState(resource.slug ?? "");
  const [connStr, setConnStr] = useState((config as DbConfig)?.connectionString ?? "");
  const [httpUrl, setHttpUrl] = useState((config as HttpConfig)?.url ?? "");
  const [publicAccess, setPublicAccess] = useState((config as HttpConfig)?.publicAccess ?? false);
  const [show, setShow] = useState(false);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    const http = config as HttpConfig | undefined;
    if (isHttp && http) {
      setHttpUrl(http.url ?? "");
      setPublicAccess(http.publicAccess ?? false);
    }
    setSlug(resource.slug ?? "");
  }, [resource.id, resource.slug, resource.config, isHttp, config]);
  const [saving, setSaving] = useState(false);
  const [savedSection, setSavedSection] = useState<"public" | "local" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const savePublicEndpoint = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await fetchJson<Resource>(`/resources/${resource.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      onSaved(updated);
      setSavedSection("public");
      setTimeout(() => setSavedSection(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const saveLocalSetup = async () => {
    setSaving(true);
    setError(null);
    try {
      const newConfig = isDb
        ? { engine: (config as DbConfig)?.engine ?? "postgres", connectionString: connStr }
        : isHttp
          ? resource.type === "web-app"
            ? { url: httpUrl }
            : { url: httpUrl, publicAccess }
          : config;
      const updated = await fetchJson<Resource>(`/resources/${resource.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ config: newConfig }),
      });
      onSaved(updated);
      setSavedSection("local");
      setTimeout(() => setSavedSection(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const rotateToken = async () => {
    setRotating(true);
    setError(null);
    try {
      await onRotate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Token regeneration failed");
    } finally {
      setRotating(false);
    }
  };

  return (
    <div className="section">
      <div className="section-head">
        <div>
          <h3 className="section-title">Configuration</h3>
          <p className="section-sub">Manage the public endpoint and local proxy target</p>
        </div>
      </div>
      <div className={styles.configContent}>
        <div className={`${styles.configGroup} ${styles.localSetup}`}>
          <div className={styles.configGroupHead}>
            <div>
              <h3>Local Setup</h3>
              <p>Configure which local address the host agent proxies to the gateway.</p>
            </div>
          </div>

          {isDb && (
            <div className="field">
              <div className="field-label">Connection string</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="input"
                  type={show ? "text" : "password"}
                  value={connStr}
                  onChange={(e) => setConnStr(e.target.value)}
                  placeholder="postgresql://user:password@localhost:5432/dbname"
                  style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 12.5 }}
                />
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  style={{ flexShrink: 0 }}
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          )}

          {isHttp && (
            <div className="field">
              <div className="field-label">Local URL</div>
              <input
                className="input"
                type="text"
                value={httpUrl}
                onChange={(e) => setHttpUrl(e.target.value)}
                placeholder="http://localhost:3000"
              />
              <div className="field-help">
                The address where your local {resource.type === "web-app" ? "app" : "server"} is
                running.
              </div>
            </div>
          )}

          <div className="field-help">
            Changes take effect on the next request handled by the host.
          </div>

          {error && (
            <div className="callout" style={{ color: "var(--red)" }}>
              <Icon name="warn" size={14} />
              {error}
            </div>
          )}

          <div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => void saveLocalSetup()}
              disabled={saving}
            >
              {savedSection === "local" ? (
                <>
                  <Icon name="check" size={13} />
                  Saved
                </>
              ) : saving ? (
                "Saving..."
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </div>

        <div className={`${styles.configGroup} ${styles.publicEndpoint}`}>
          <div className={styles.configGroupHead}>
            <div>
              <h3>Public Endpoint</h3>
              <p>How external clients reach this resource on the internet.</p>
            </div>
            <StatusPill
              status={host ? "connected" : "disconnected"}
              label={host ? "Online" : "Offline"}
            />
          </div>
          <div className="field">
            <div className="field-label">Slug</div>
            <input
              className="input mono"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-resource"
            />
            <div className="field-help">
              Used in your gateway URL:{" "}
              <span className="mono">
                {slug || "my-resource"}.{gatewayBaseDomain}
              </span>
            </div>
          </div>
          <div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => void savePublicEndpoint()}
              disabled={saving}
            >
              {savedSection === "public" ? (
                <>
                  <Icon name="check" size={13} />
                  Saved
                </>
              ) : saving ? (
                "Saving..."
              ) : (
                "Save changes"
              )}
            </button>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "2px 0" }} />
          <div style={{ display: "grid", gap: 10 }}>
            <InfoRow label="Gateway URL">
              <a
                href={endpoint}
                target="_blank"
                rel="noopener noreferrer"
                className="mono"
                style={{
                  fontSize: 12,
                  color: "var(--accent)",
                  wordBreak: "break-all",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {endpoint}
                <Icon name="external" size={11} />
              </a>
              <CopyBtn onCopy={() => void navigator.clipboard.writeText(endpoint)} />
            </InfoRow>
            {resource.type !== "web-app" ? (
              <>
                <InfoRow label="Resource ID">
                  <span className="mono" style={{ fontSize: 12 }}>
                    {resource.id}
                  </span>
                  <CopyBtn onCopy={() => void navigator.clipboard.writeText(resource.id)} />
                </InfoRow>
                <InfoRow label="Type">
                  <TypeBadge type={resource.type} />
                </InfoRow>
              </>
            ) : null}
          </div>
          {canTogglePublicAccess && (
            <div className="field" style={{ marginTop: 2 }}>
              <div className="field-label">Access</div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--bg-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>Public access</div>
                  <div className="field-help" style={{ margin: 0, marginTop: 2 }}>
                    Allow browsers to open <span className="mono">{endpoint}</span> without an API
                    key.
                  </div>
                </div>
                <ToggleSwitch checked={publicAccess} onChange={setPublicAccess} />
              </div>
            </div>
          )}
          {resource.type === "web-app" ? (
            <p className="field-help" style={{ marginTop: 12 }}>
              Web apps are public and use subdomain routing, so assets load without a path prefix.
            </p>
          ) : null}
        </div>

        <div className={styles.configGroup}>
          <div className={styles.configGroupHead}>
            <div>
              <h3>Host Token</h3>
              <p>Regenerate the token used by a host agent to connect this resource.</p>
            </div>
          </div>
          {rotatedToken ? (
            <div className="key-reveal" style={{ margin: 0 }}>
              <div className="text">{rotatedToken}</div>
              <CopyBtn onCopy={() => void navigator.clipboard.writeText(rotatedToken)} />
            </div>
          ) : (
            <p className="field-help" style={{ margin: 0 }}>
              The original token was shown only once. Regenerating creates a new token and leaves
              the resource available for a reconnect.
            </p>
          )}
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            onClick={() => void rotateToken()}
            disabled={rotating}
            style={{ justifySelf: "start" }}
          >
            <Icon name="refresh" size={13} />
            {rotating ? "Regenerating..." : "Regenerate token"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 110, flexShrink: 0, color: "var(--text-3)", fontSize: 12.5 }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {children}
      </div>
    </div>
  );
}

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${gatewayUrl}${path}`, { credentials: "include", ...init });
  if (!response.ok) throw new Error(`Gateway request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

function normalizeResource(resource: Omit<Resource, "type"> & { type: string }): Resource {
  const type =
    resource.type === "ai_model"
      ? "ai-model"
      : resource.type === "http_api"
        ? "http-api"
        : resource.type === "web_app"
          ? "web-app"
          : resource.type;
  const normalized: Resource = {
    ...resource,
    type: type as ResourceType,
    subtype: resource.subtype ?? type,
    endpoint: resource.endpoint ?? "",
    local: resource.local ?? "-",
    status: resource.active ? "active" : "inactive",
    keys: resource.keys ?? 0,
    lastActive: resource.lastActive ?? "Never",
    reqs24h: resource.reqs24h ?? 0,
  };
  return { ...normalized, endpoint: resource.endpoint ?? resourceEndpoint(normalized, gatewayUrl) };
}

function normalizeLog(log: GatewayRequestLog): RequestLog {
  return {
    ...log,
    method: log.method as RequestLog["method"],
    time: log.time ?? log.createdAt ?? "",
    res: log.res ?? "",
    status: log.status ?? log.statusCode ?? 0,
    dur: log.dur ?? String(log.durationMs ?? 0),
    key: log.key ?? "",
  };
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}
