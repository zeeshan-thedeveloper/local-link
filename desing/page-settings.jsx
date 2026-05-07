/* global React, Icon, StatusPill, CopyBtn */
const SettingsPage = ({ hostConnected }) => (
  <div className="page" style={{ maxWidth: 880 }}>
    <div className="page-header">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Account, host, and workspace configuration</p>
      </div>
    </div>

    <div className="section">
      <div className="section-head"><div><h3 className="section-title">Account</h3><p className="section-sub">Personal account · single user workspace</p></div></div>
      <div style={{ padding: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="field" style={{ margin: 0 }}>
          <div className="field-label">Email</div>
          <input className="input" value="dev@kestrel.io" readOnly style={{ color: "var(--text-2)" }}/>
          <div className="field-help">Account email cannot be changed. Contact support to migrate.</div>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <div className="field-label">Display name</div>
          <input className="input" defaultValue="Devon Karras"/>
        </div>
      </div>
      <div style={{ padding: "0 22px 22px", borderTop: "1px solid var(--border)", marginTop: 4 }}>
        <h4 style={{ fontSize: 13, fontWeight: 500, margin: "16px 0 12px" }}>Change password</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div className="field" style={{ margin: 0 }}>
            <div className="field-label">Current password</div>
            <input type="password" className="input" placeholder="••••••••"/>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <div className="field-label">New password</div>
            <input type="password" className="input" placeholder="••••••••"/>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <div className="field-label">Confirm new</div>
            <input type="password" className="input" placeholder="••••••••"/>
          </div>
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost">Cancel</button>
          <button className="btn btn-primary">Update password</button>
        </div>
      </div>
    </div>

    <div className="section">
      <div className="section-head">
        <div><h3 className="section-title">Host application</h3><p className="section-sub">CLI running on your local machine that maintains tunnels to the gateway</p></div>
        <StatusPill status={hostConnected ? "connected" : "disconnected"}/>
      </div>
      <div style={{ padding: 22 }}>
        <div className="field-label">Install host CLI</div>
        <pre className="code-block" style={{ marginBottom: 16 }}>
          <span className="com"># macOS · Homebrew</span>{"\n"}
          <span className="kw">brew</span> install locallink/tap/ll{"\n\n"}
          <span className="com"># Or via npm</span>{"\n"}
          <span className="kw">npm</span> install -g @locallink/cli{"\n\n"}
          <span className="com"># Then authenticate</span>{"\n"}
          ll login --token <span className="var">$LOCALLINK_TOKEN</span>{"\n"}
          ll start
        </pre>

        <div className="field-label">Host token <span className="opt">use this on the host CLI</span></div>
        <div className="code">
          <span className="text" style={{ color: "var(--text-2)" }}>llh_•••••••••••••••••••••••••••••••••L7p2</span>
          <CopyBtn/>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn btn-secondary btn-sm"><Icon name="eye" size={13}/>Reveal</button>
          <button className="btn btn-ghost btn-sm"><Icon name="refresh" size={13}/>Regenerate token</button>
        </div>

        <div className="callout" style={{ marginTop: 18 }}>
          <Icon name="info" size={14}/>
          <div>Regenerating the token will disconnect your current host immediately. You'll need to re-authenticate the CLI with the new token.</div>
        </div>
      </div>
    </div>

    <div className="section">
      <div className="section-head"><div><h3 className="section-title">Defaults</h3></div></div>
      <div style={{ padding: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="field" style={{ margin: 0 }}>
          <div className="field-label">Default region</div>
          <select className="select"><option>us-east-1 (Virginia)</option><option>eu-west-1 (Dublin)</option></select>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <div className="field-label">Default rate limit <span className="opt">per key</span></div>
          <input className="input" defaultValue="1000 req/min"/>
        </div>
      </div>
    </div>

    <div className="section danger-zone">
      <div className="section-head" style={{ borderBottomColor: "rgba(239,68,68,0.15)" }}>
        <div><h3 className="section-title" style={{ color: "#fca5a5" }}>Danger zone</h3><p className="section-sub">Destructive actions · cannot be undone</p></div>
      </div>
      <div style={{ padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-0)" }}>Delete account</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>Permanently delete your account, all resources, and all logs. This cannot be undone.</div>
        </div>
        <button className="btn btn-danger"><Icon name="trash" size={13}/>Delete account</button>
      </div>
    </div>
  </div>
);

window.SettingsPage = SettingsPage;
