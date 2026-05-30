import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";

export default function SettingsPage() {
  return (
    <div className="page" style={{ maxWidth: 1180 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Account and workspace configuration</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-stack">
          <div className="section danger-zone">
            <div className="section-head" style={{ borderBottomColor: "rgba(239,68,68,0.15)" }}>
              <div>
                <h3 className="section-title" style={{ color: "#fca5a5" }}>
                  Danger zone
                </h3>
                <p className="section-sub">Destructive actions - cannot be undone</p>
              </div>
            </div>
            <div
              style={{
                padding: 18,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-0)",
                  }}
                >
                  Delete account
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: "var(--text-2)",
                    marginTop: 2,
                  }}
                >
                  Permanently delete your account, all resources, and all logs. This cannot be
                  undone.
                </div>
              </div>
              <button className="btn btn-danger">
                <Icon name="trash" size={13} />
                Delete account
              </button>
            </div>
          </div>
        </div>

        <div className="section settings-host-card">
          <div className="section-head">
            <div>
              <h3 className="section-title">Host application</h3>
              <p className="section-sub">Connect this machine to tunnel local resources.</p>
            </div>
            <StatusPill status="disconnected" />
          </div>
          <div style={{ padding: 22 }}>
            <div className="field-label">Install host CLI</div>
            <pre className="code-block" style={{ marginBottom: 16 }}>
              <span className="com"># npm</span>
              {"\n"}
              <span className="kw">npm</span> install -g @locallink/cli
              {"\n\n"}
              <span className="com"># Start the host</span>
              {"\n"}
              ll start
            </pre>
            <div className="callout">
              <Icon name="info" size={14} />
              <div>
                No host is connected yet. Once the host app connects, resource tunnels and request
                logs will appear.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
