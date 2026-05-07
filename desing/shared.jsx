/* global React */
const { useState, useEffect, useRef } = React;

// ============ ICONS ============
const Icon = ({ name, className = "", size = 16, stroke = 1.6 }) => {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
    resources: <><path d="M3 7c0-1.66 4-3 9-3s9 1.34 9 3-4 3-9 3-9-1.34-9-3z"/><path d="M3 7v5c0 1.66 4 3 9 3s9-1.34 9-3V7"/><path d="M3 12v5c0 1.66 4 3 9 3s9-1.34 9-3v-5"/></>,
    logs: <><path d="M14 3v5h5"/><path d="M5 21V3h9l5 5v13z"/><path d="M9 13h6M9 17h6M9 9h2"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/></>,
    ai: <><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/></>,
    http: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    key: <><circle cx="7.5" cy="15.5" r="3.5"/><path d="m10 13 8-8M16 3l4 4-2 2-4-4M14 7l3 3"/></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    check: <><path d="M20 6 9 17l-5-5"/></>,
    chevron: <><path d="m9 18 6-6-6-6"/></>,
    arrow: <><path d="M5 12h14M13 5l7 7-7 7"/></>,
    search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
    close: <><path d="M18 6 6 18M6 6l12 12"/></>,
    trash: <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></>,
    activity: <><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></>,
    refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M8 16H3v5"/></>,
    warn: <><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></>,
    play: <><polygon points="5 3 19 12 5 21 5 3"/></>,
    moreH: <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
    bolt: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    server: <><rect x="2" y="3" width="20" height="8" rx="2"/><rect x="2" y="13" width="20" height="8" rx="2"/><path d="M6 7h.01M6 17h.01"/></>,
    chevronD: <><path d="m6 9 6 6 6-6"/></>,
    chevronR: <><path d="m9 6 6 6-6 6"/></>,
    external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/></>,
  };
  return (
    <svg className={"icon " + className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

// ============ FAKE DATA ============
const RESOURCES = [
  { id: "r_pgmain", name: "postgres-main", type: "database", subtype: "PostgreSQL 16", endpoint: "https://gw.locallink.dev/r/pgmain_8h2j", local: "postgresql://localhost:5432/app", status: "active", keys: 3, lastActive: "2s ago", reqs24h: 8421 },
  { id: "r_redis", name: "redis-cache", type: "database", subtype: "Redis 7.2", endpoint: "https://gw.locallink.dev/r/redis_4a91", local: "redis://localhost:6379", status: "active", keys: 1, lastActive: "12s ago", reqs24h: 2104 },
  { id: "r_ollama", name: "ollama-llama3", type: "ai", subtype: "Ollama · llama3.1:70b", endpoint: "https://gw.locallink.dev/r/llama_xq2b", local: "http://localhost:11434", status: "active", keys: 2, lastActive: "1m ago", reqs24h: 412 },
  { id: "r_sd", name: "stable-diffusion", type: "ai", subtype: "ComfyUI · SDXL", endpoint: "https://gw.locallink.dev/r/sdxl_p7tn", local: "http://localhost:8188", status: "idle", keys: 1, lastActive: "4h ago", reqs24h: 19 },
  { id: "r_meili", name: "meilisearch-docs", type: "http", subtype: "Meilisearch", endpoint: "https://gw.locallink.dev/r/meili_w3vc", local: "http://localhost:7700", status: "active", keys: 1, lastActive: "8s ago", reqs24h: 1207 },
  { id: "r_internal", name: "internal-api", type: "http", subtype: "Express · Node 20", endpoint: "https://gw.locallink.dev/r/intapi_kf09", local: "http://localhost:3001", status: "inactive", keys: 0, lastActive: "3d ago", reqs24h: 0 },
];

const KEYS = [
  { name: "production", prefix: "ll_pk_8h2jaQ7m...", created: "Mar 14, 2026", lastUsed: "12s ago" },
  { name: "staging", prefix: "ll_sk_4xv9bL2p...", created: "Mar 14, 2026", lastUsed: "2h ago" },
  { name: "ci-runner", prefix: "ll_ci_n0vR8tKw...", created: "Feb 28, 2026", lastUsed: "1d ago" },
];

const LOGS = [
  { time: "14:32:18.412", res: "postgres-main", method: "POST", path: "/query", status: 200, dur: "42ms", key: "ll_pk_8h2j..." },
  { time: "14:32:17.891", res: "ollama-llama3", method: "POST", path: "/api/generate", status: 200, dur: "1.84s", key: "ll_pk_8h2j..." },
  { time: "14:32:17.219", res: "postgres-main", method: "POST", path: "/query", status: 200, dur: "31ms", key: "ll_pk_8h2j..." },
  { time: "14:32:15.044", res: "redis-cache", method: "GET", path: "/keys/session:9f2", status: 200, dur: "3ms", key: "ll_pk_8h2j..." },
  { time: "14:32:14.776", res: "meilisearch-docs", method: "POST", path: "/indexes/docs/search", status: 200, dur: "18ms", key: "ll_sk_4xv9..." },
  { time: "14:32:13.502", res: "postgres-main", method: "POST", path: "/query", status: 401, dur: "2ms", key: "ll_ci_n0vR..." },
  { time: "14:32:12.118", res: "postgres-main", method: "POST", path: "/query", status: 200, dur: "27ms", key: "ll_pk_8h2j..." },
  { time: "14:32:09.882", res: "ollama-llama3", method: "POST", path: "/api/embeddings", status: 200, dur: "94ms", key: "ll_sk_4xv9..." },
  { time: "14:32:07.331", res: "stable-diffusion", method: "POST", path: "/prompt", status: 500, dur: "184ms", key: "ll_sk_4xv9..." },
  { time: "14:32:06.014", res: "redis-cache", method: "GET", path: "/keys/user:1882", status: 200, dur: "2ms", key: "ll_pk_8h2j..." },
  { time: "14:32:04.770", res: "meilisearch-docs", method: "GET", path: "/indexes/docs/stats", status: 200, dur: "6ms", key: "ll_sk_4xv9..." },
  { time: "14:32:03.221", res: "postgres-main", method: "POST", path: "/query", status: 200, dur: "38ms", key: "ll_pk_8h2j..." },
  { time: "14:32:01.103", res: "postgres-main", method: "POST", path: "/query", status: 404, dur: "8ms", key: "ll_pk_8h2j..." },
  { time: "14:31:59.901", res: "ollama-llama3", method: "POST", path: "/api/generate", status: 200, dur: "2.21s", key: "ll_pk_8h2j..." },
  { time: "14:31:58.448", res: "redis-cache", method: "DELETE", path: "/keys/cache:old", status: 200, dur: "4ms", key: "ll_pk_8h2j..." },
  { time: "14:31:56.220", res: "postgres-main", method: "POST", path: "/query", status: 200, dur: "29ms", key: "ll_pk_8h2j..." },
  { time: "14:31:54.118", res: "meilisearch-docs", method: "POST", path: "/indexes/docs/search", status: 200, dur: "21ms", key: "ll_sk_4xv9..." },
  { time: "14:31:51.883", res: "postgres-main", method: "POST", path: "/query", status: 200, dur: "33ms", key: "ll_pk_8h2j..." },
  { time: "14:31:48.012", res: "ollama-llama3", method: "POST", path: "/api/generate", status: 429, dur: "1ms", key: "ll_sk_4xv9..." },
  { time: "14:31:45.502", res: "redis-cache", method: "GET", path: "/keys/session:1a7", status: 200, dur: "2ms", key: "ll_pk_8h2j..." },
];

const statusClass = (s) => s >= 500 ? "sc-5xx" : s >= 400 ? "sc-4xx" : s >= 300 ? "sc-3xx" : "sc-2xx";

// ============ SHARED ============
const TypeIcon = ({ type, size = 14 }) => (
  <Icon name={type === "database" ? "database" : type === "ai" ? "ai" : "http"} size={size} />
);

const TypeBadge = ({ type }) => {
  const labels = { database: "Database", ai: "AI Model", http: "HTTP API" };
  return <span className={"type-badge " + type}><span className="dot"/>{labels[type]}</span>;
};

const StatusPill = ({ status, label }) => {
  const cls = status === "active" || status === "connected" ? "green"
    : status === "inactive" || status === "disconnected" ? "red"
    : "yellow";
  const text = label || (status === "active" ? "Active" : status === "inactive" ? "Inactive" : status === "idle" ? "Idle" : status === "connected" ? "Connected" : "Disconnected");
  return <span className={"pill " + cls}><span className="dot"/>{text}</span>;
};

const ResIcon = ({ type, size = 14 }) => (
  <div className={"res-icon " + type}><Icon name={type === "database" ? "database" : type === "ai" ? "ai" : "http"} size={size} /></div>
);

const CopyBtn = ({ onCopy }) => {
  const [done, setDone] = useState(false);
  return (
    <button className="copy" onClick={() => { setDone(true); setTimeout(() => setDone(false), 1200); onCopy && onCopy(); }} title="Copy">
      <Icon name={done ? "check" : "copy"} size={13} />
    </button>
  );
};

const Sidebar = ({ page, setPage, hostConnected }) => {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "resources", label: "Resources", icon: "resources" },
    { id: "logs", label: "Logs", icon: "logs" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark"/>
        <span className="name">LocalLink</span>
      </div>
      <nav className="sidebar-nav">
        {items.map(it => (
          <button key={it.id} className={"nav-item " + (page === it.id || (page === "resource-detail" && it.id === "resources") ? "active" : "")} onClick={() => setPage(it.id)}>
            <Icon name={it.icon} size={15} />
            <span>{it.label}</span>
            <span className="kbd">{["G D","G R","G L","G S"][items.indexOf(it)]}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className={"host-indicator " + (hostConnected ? "" : "disconnected")}>
          <span className="dot"/>
          <span className="label">{hostConnected ? "Host connected" : "Host offline"}</span>
          <span className="meta">{hostConnected ? "macbook-pro-m4" : "—"}</span>
        </div>
      </div>
    </aside>
  );
};

const Topbar = ({ crumbs }) => (
  <div className="topbar">
    <div className="topbar-crumbs">
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="sep">/</span>}
          <span className={i === crumbs.length - 1 ? "current" : ""}>{c}</span>
        </React.Fragment>
      ))}
    </div>
    <div className="topbar-right">
      <button className="btn btn-ghost btn-sm"><Icon name="search" size={13}/>Search<span className="kbd" style={{ marginLeft: 4, fontSize: 10, padding: "0 4px", border: "1px solid var(--border)", borderRadius: 3, color: "var(--text-3)" }}>⌘K</span></button>
      <div className="user-menu">
        <div className="avatar">DK</div>
        <span>dev@kestrel.io</span>
        <Icon name="chevronD" size={12}/>
      </div>
    </div>
  </div>
);

Object.assign(window, { Icon, TypeIcon, TypeBadge, StatusPill, ResIcon, CopyBtn, Sidebar, Topbar, RESOURCES, KEYS, LOGS, statusClass });
