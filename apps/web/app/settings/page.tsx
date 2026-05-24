"use client";

import { useEffect, useState } from "react";
import { notifyCurrentUserUpdated } from "@/components/layout/AppShell";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...((init.headers as Record<string, string>) ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<{ user: { email: string; name?: string } }>("/api/auth/me")
      .then(({ user }) => {
        setEmail(user.email ?? "");
        setDisplayName(user.name ?? user.email?.split("@")[0] ?? "");
      })
      .catch(() => {});
  }, []);

  const saveDisplayName = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const nextName = displayName.trim();
      const { user } = await fetchJson<{
        user: { id?: string; sub?: string; email: string; name?: string | null };
      }>("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ name: nextName }),
      });
      setDisplayName(user.name ?? nextName);
      notifyCurrentUserUpdated({
        id: user.sub ?? user.id ?? "",
        email: user.email,
        name: user.name,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

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
          <div className="section">
            <div className="section-head">
              <div>
                <h3 className="section-title">Account</h3>
                <p className="section-sub">Personal account - single user workspace</p>
              </div>
            </div>
            <div style={{ padding: 22, display: "grid", gap: 16 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div className="field" style={{ margin: 0 }}>
                  <div className="field-label">Email</div>
                  <input
                    className="input"
                    value={email}
                    readOnly
                    style={{ color: "var(--text-2)" }}
                  />
                  <div className="field-help">Account email cannot be changed.</div>
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <div className="field-label">Display name</div>
                  <input
                    className="input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
              </div>

              {error && (
                <div className="callout" style={{ color: "var(--red)" }}>
                  <Icon name="warn" size={14} />
                  {error}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => void saveDisplayName()}
                  disabled={saving || displayName.trim().length === 0}
                >
                  {saved ? (
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
          </div>

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
