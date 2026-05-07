/* global React, Icon, TypeBadge, StatusPill, ResIcon, CopyBtn, RESOURCES, KEYS, LOGS, statusClass */
const { useState: useStateD2 } = React;

const ResourceDetailPage = ({ resourceId, onBack, onGenerateKey }) => {
  const r = RESOURCES.find(x => x.id === resourceId) || RESOURCES[0];
  const [tab, setTab] = useStateD2("overview");

  const curl = `curl -X POST ${r.endpoint}/query \\
  -H "Authorization: Bearer ll_pk_8h2jaQ7m..." \\
  -H "Content-Type: application/json" \\
  -d '{"sql": "SELECT * FROM users LIMIT 10"}'`;

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, fontSize: 13 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}><Icon name="chevron" size={12} className="" stroke={2}/>Back</button>
        <span style={{ color: "var(--text-3)" }}>/</span>
        <span style={{ color: "var(--text-2)" }}>Resources</span>
        <span style={{ color: "var(--text-3)" }}>/</span>
        <span style={{ color: "var(--text-0)", fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{r.name}</span>
      </div>

      <div className="section" style={{ marginBottom: 18 }}>
        <div className="detail-head">
          <ResIcon type={r.type} size={18}/>
          <div style={{ flex: 1 }}>
            <h2>{r.name}</h2>
            <div className="meta">
              <TypeBadge type={r.type}/>
              <StatusPill status={r.status}/>
              <span>·</span>
              <span>{r.subtype}</span>
              <span>·</span>
              <span className="mono">id: {r.id}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-ghost btn-sm"><Icon name="refresh" size={13}/>Restart</button>
            <button className="btn btn-secondary btn-sm"><Icon name="edit" size={13}/>Edit</button>
            <button className="btn btn-ghost btn-icon btn-sm"><Icon name="moreH" size={14}/></button>
          </div>
        </div>

        <div className="tabs">
          {[
            { id: "overview", label: "Overview" },
            { id: "keys", label: `API Keys · ${KEYS.length}` },
            { id: "logs", label: "Logs" },
            { id: "config", label: "Config" },
          ].map(t => (
            <button key={t.id} className={"tab " + (tab === t.id ? "active" : "")} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <>
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <div className="stat-card"><div className="stat-label"><Icon name="activity" size={13}/>Requests · 24h</div><div className="stat-value">{r.reqs24h.toLocaleString()}</div><div className="stat-delta up">↑ 12%</div></div>
            <div className="stat-card"><div className="stat-label"><Icon name="clock" size={13}/>Avg latency</div><div className="stat-value">38ms</div><div className="stat-delta">p95 · 142ms</div></div>
            <div className="stat-card"><div className="stat-label"><Icon name="warn" size={13}/>Error rate</div><div className="stat-value">0.4%</div><div className="stat-delta">last 1h</div></div>
            <div className="stat-card"><div className="stat-label"><Icon name="key" size={13}/>API keys</div><div className="stat-value">{r.keys}</div><div className="stat-delta">2 active in 24h</div></div>
          </div>

          <div className="section">
            <div className="section-head">
              <div>
                <h3 className="section-title">Endpoint</h3>
                <p className="section-sub">Public gateway URL — requests are tunneled to your local machine.</p>
              </div>
            </div>
            <div style={{ padding: 18 }}>
              <div className="field-label">Gateway URL</div>
              <div className="code">
                <span className="text">{r.endpoint}</span>
                <CopyBtn />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
                <div>
                  <div className="field-label">Local target <span className="opt">on host</span></div>
                  <div className="code"><span className="text">{r.local}</span><CopyBtn/></div>
                </div>
                <div>
                  <div className="field-label">Region</div>
                  <div className="code"><span className="text">us-east-1 · iad1</span></div>
                </div>
              </div>

              <div className="field-label" style={{ marginTop: 18 }}>Example request</div>
              <pre className="code-block">
<button className="copy" style={{ position: "absolute", top: 8, right: 8 }}><CopyBtn/></button>
{curl.split("\n").map((line, i) => (
  <div key={i}>
    {line.includes("curl") ? <><span className="kw">curl</span>{line.slice(4)}</> :
     line.includes('"Authorization"') ? <><span style={{ color: "var(--text-3)" }}>  -H </span><span className="str">"Authorization: Bearer </span><span className="var">ll_pk_8h2jaQ7m...</span><span className="str">"</span> \</> :
     line.includes('"Content-Type"') ? <><span style={{ color: "var(--text-3)" }}>  -H </span><span className="str">{line.match(/"[^"]+"/)[0]}</span> \</> :
     line.includes("-d") ? <><span style={{ color: "var(--text-3)" }}>  -d </span><span className="str">{line.match(/'[^']+'/)?.[0]}</span></> :
     line}
  </div>
))}
              </pre>
            </div>
          </div>

          <div className="section">
            <div className="section-head">
              <div>
                <h3 className="section-title">API keys</h3>
                <p className="section-sub">Tokens authorized to call this resource</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={onGenerateKey}><Icon name="plus" size={12}/>Generate key</button>
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
                {KEYS.map(k => (
                  <tr key={k.name}>
                    <td style={{ fontWeight: 500 }}>{k.name}</td>
                    <td><span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-2)" }}>{k.prefix}</span></td>
                    <td style={{ color: "var(--text-2)", fontSize: 12.5 }}>{k.created}</td>
                    <td style={{ color: "var(--text-2)", fontSize: 12.5 }}>{k.lastUsed}</td>
                    <td><div className="row-actions"><button className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }}>Revoke</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="section">
            <div className="section-head">
              <div>
                <h3 className="section-title">Recent requests</h3>
                <p className="section-sub">Last 20 requests to this resource</p>
              </div>
              <button className="btn btn-ghost btn-sm">View all logs<Icon name="external" size={12}/></button>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Method</th>
                  <th>Path</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Duration</th>
                  <th>Key</th>
                </tr>
              </thead>
              <tbody>
                {LOGS.filter(l => l.res === r.name).slice(0, 8).concat(LOGS.slice(0, 4)).slice(0, 10).map((l, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-3)" }}>{l.time}</td>
                    <td><span className={"method method-" + l.method}>{l.method}</span></td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-1)" }}>{l.path}</td>
                    <td><span className={"sc " + statusClass(l.status)}>{l.status}</span></td>
                    <td className="num" style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)" }}>{l.dur}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-3)" }}>{l.key}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "keys" && (
        <div className="section">
          <div className="section-head">
            <div><h3 className="section-title">API keys</h3><p className="section-sub">Authorize requests to this resource</p></div>
            <button className="btn btn-primary btn-sm" onClick={onGenerateKey}><Icon name="plus" size={12}/>Generate key</button>
          </div>
          <table className="tbl">
            <thead><tr><th>Name</th><th>Prefix</th><th>Created</th><th>Last used</th><th style={{ width: 80 }}></th></tr></thead>
            <tbody>
              {KEYS.map(k => (
                <tr key={k.name}>
                  <td style={{ fontWeight: 500 }}>{k.name}</td>
                  <td><span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-2)" }}>{k.prefix}</span></td>
                  <td style={{ color: "var(--text-2)", fontSize: 12.5 }}>{k.created}</td>
                  <td style={{ color: "var(--text-2)", fontSize: 12.5 }}>{k.lastUsed}</td>
                  <td><div className="row-actions"><button className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }}>Revoke</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "logs" && (
        <div className="section">
          <div className="section-head"><div><h3 className="section-title">Request logs</h3></div></div>
          <table className="tbl">
            <thead><tr><th>Timestamp</th><th>Method</th><th>Path</th><th>Status</th><th style={{ textAlign: "right" }}>Duration</th></tr></thead>
            <tbody>
              {LOGS.slice(0, 12).map((l, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-3)" }}>{l.time}</td>
                  <td><span className={"method method-" + l.method}>{l.method}</span></td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-1)" }}>{l.path}</td>
                  <td><span className={"sc " + statusClass(l.status)}>{l.status}</span></td>
                  <td className="num" style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)" }}>{l.dur}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "config" && (
        <div className="section">
          <div className="section-head"><div><h3 className="section-title">Configuration</h3></div></div>
          <dl className="kv-grid">
            <dt>Resource ID</dt><dd>{r.id}</dd>
            <dt>Type</dt><dd>{r.subtype}</dd>
            <dt>Local target</dt><dd>{r.local}</dd>
            <dt>Gateway URL</dt><dd>{r.endpoint}</dd>
            <dt>Created</dt><dd>March 14, 2026 · 09:42:18 UTC</dd>
            <dt>Host machine</dt><dd>macbook-pro-m4.local</dd>
            <dt>Rate limit</dt><dd>1000 req/min</dd>
            <dt>Timeout</dt><dd>30s</dd>
          </dl>
        </div>
      )}
    </div>
  );
};

window.ResourceDetailPage = ResourceDetailPage;
