/* global React, Icon, TypeBadge, StatusPill, ResIcon, CopyBtn, RESOURCES, KEYS, LOGS, statusClass */
const { useState: useStateD, useEffect: useEffectD } = React;

// ============ DASHBOARD ============
const DashboardPage = ({ hostConnected, populated, onOpen, onAddResource, onGenerateKey }) => {
  const stats = [
    { label: "Total resources", icon: "resources", value: populated ? "6" : "0", delta: populated ? "+2 this week" : "—" },
    { label: "Active API keys", icon: "key", value: populated ? "8" : "0", delta: populated ? "3 in use today" : "—" },
    { label: "Requests today", icon: "activity", value: populated ? "12,184" : "0", delta: populated ? "↑ 18% vs yesterday" : "—", up: true },
    { label: "Avg response", icon: "clock", value: populated ? "47ms" : "—", delta: populated ? "p95 · 312ms" : "—" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Overview of your local resources and gateway activity.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" onClick={onGenerateKey}><Icon name="key" size={13}/>Generate API key</button>
          <button className="btn btn-primary" onClick={onAddResource}><Icon name="plus" size={13}/>Add resource</button>
        </div>
      </div>

      {!hostConnected && (
        <div className="banner alert">
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--red-soft)", color: "var(--red)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="warn" size={16}/>
          </div>
          <div className="body">
            <div className="title">Host app not connected</div>
            <div className="sub">Install and run the LocalLink host CLI on your machine to tunnel local resources. Without it, the gateway cannot reach your services.</div>
          </div>
          <button className="btn btn-secondary"><Icon name="download" size={13}/>Install host app</button>
        </div>
      )}

      {hostConnected && (
        <div className="banner">
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--green-soft)", color: "var(--green)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="server" size={16}/>
          </div>
          <div className="body">
            <div className="title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              Host connected <StatusPill status="connected" />
            </div>
            <div className="sub">
              <span className="mono">macbook-pro-m4.local</span> · connected 4 days ago · v0.8.2 · <span className="mono">7 tunnels active</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm"><Icon name="refresh" size={13}/>Reconnect</button>
        </div>
      )}

      <div className="stat-grid">
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-label"><Icon name={s.icon} size={13}/> {s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className={"stat-delta " + (s.up ? "up" : "")}>{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-head">
          <div>
            <h3 className="section-title">Resources</h3>
            <p className="section-sub">{populated ? "6 registered · 4 active right now" : "Nothing here yet"}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm">View all<Icon name="chevronR" size={12}/></button>
          </div>
        </div>
        {populated ? (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: "30%" }}>Name</th>
                <th>Type</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Reqs · 24h</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {RESOURCES.slice(0, 5).map(r => (
                <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => onOpen(r.id)}>
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
                  <td><span className="mono" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)" }}>{r.endpoint.replace("https://", "")}</span></td>
                  <td><StatusPill status={r.status}/></td>
                  <td className="num" style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{r.reqs24h.toLocaleString()}</td>
                  <td><div className="row-actions"><button className="btn btn-ghost btn-sm">Manage</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">
            <div className="icon-wrap"><Icon name="resources" size={18}/></div>
            <div className="title">No resources yet</div>
            <div className="sub">Register a database, AI model, or HTTP service running on your local machine to get started.</div>
            <button className="btn btn-primary" onClick={onAddResource}><Icon name="plus" size={13}/>Add your first resource</button>
          </div>
        )}
      </div>

      <div className="split-2">
        <div className="section">
          <div className="section-head">
            <div>
              <h3 className="section-title">Recent activity</h3>
              <p className="section-sub">Latest 8 requests across all resources</p>
            </div>
            <button className="btn btn-ghost btn-sm">Open logs<Icon name="external" size={12}/></button>
          </div>
          {populated ? (
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
          ) : <div className="empty"><div className="title">No requests yet</div></div>}
        </div>

        <div>
          <div className="section">
            <div className="section-head"><h3 className="section-title">Quick actions</h3></div>
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="qa-card" onClick={onAddResource} style={{ background: "transparent", border: "1px solid var(--border)" }}>
                <div className="icon-wrap"><Icon name="plus" size={15}/></div>
                <div style={{ textAlign: "left" }}>
                  <div className="name">Add a resource</div>
                  <div className="desc">Tunnel a new local service</div>
                </div>
                <Icon name="chevronR" size={14} className="arrow"/>
              </button>
              <button className="qa-card" onClick={onGenerateKey} style={{ background: "transparent", border: "1px solid var(--border)" }}>
                <div className="icon-wrap"><Icon name="key" size={15}/></div>
                <div style={{ textAlign: "left" }}>
                  <div className="name">Generate API key</div>
                  <div className="desc">Issue a token for a resource</div>
                </div>
                <Icon name="chevronR" size={14} className="arrow"/>
              </button>
              <button className="qa-card" style={{ background: "transparent", border: "1px solid var(--border)" }}>
                <div className="icon-wrap"><Icon name="download" size={15}/></div>
                <div style={{ textAlign: "left" }}>
                  <div className="name">Update host CLI</div>
                  <div className="desc">v0.8.2 → v0.9.0 available</div>
                </div>
                <Icon name="chevronR" size={14} className="arrow"/>
              </button>
            </div>
          </div>

          <div className="section">
            <div className="section-head"><h3 className="section-title">Top resources · 24h</h3></div>
            <div style={{ padding: 4 }}>
              {populated ? RESOURCES.filter(r => r.reqs24h > 0).sort((a,b) => b.reqs24h - a.reqs24h).slice(0, 4).map((r, i) => {
                const max = 8421;
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
                      <div style={{ height: "100%", width: pct + "%", background: r.type === "database" ? "var(--purple)" : r.type === "ai" ? "var(--green)" : "var(--accent)", opacity: 0.7 }}/>
                    </div>
                  </div>
                );
              }) : <div className="empty"><div className="title">No data</div></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.DashboardPage = DashboardPage;
