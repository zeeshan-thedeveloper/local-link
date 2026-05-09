"use client";

import { useState } from "react";
import { CopyBtn } from "@/components/ui/CopyBtn";
import { Icon } from "@/components/ui/Icon";

type Props = {
  open: boolean;
  resourceId: string | null;
  gatewayUrl: string;
  onClose: () => void;
  onCreated: () => void;
};

export function GenerateKeyModal({ open, resourceId, gatewayUrl, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setCreatedKey(null);
    setName("");
    setError(null);
    onClose();
  };

  const generate = async () => {
    if (!resourceId || !name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${gatewayUrl}/resources/${resourceId}/keys`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() })
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = (await res.json()) as { key: string };
      setCreatedKey(data.key);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const curlExample = createdKey && resourceId
    ? `curl ${gatewayUrl}/r/${resourceId}/your-path \\\n  -H "Authorization: Bearer ${createdKey}"`
    : "";

  return (
    <>
      <div className={"scrim " + (open ? "open" : "")} onClick={close} />
      <div className={"modal " + (open ? "open" : "")}>
        {!createdKey ? (
          <>
            <div className="modal-head">
              <h3 className="modal-title">Generate API key</h3>
              <p className="modal-sub">Create a key to authorize requests to this resource</p>
            </div>
            <div className="modal-body">
              <div className="field">
                <div className="field-label">Key name</div>
                <input
                  className="input"
                  placeholder="e.g. my-service-prod"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") void generate(); }}
                  autoFocus
                />
                <div className="field-help">A label so you can recognize this key later</div>
              </div>
              {error && <div className="callout" style={{ color: "var(--red)" }}><Icon name="warn" size={14} />{error}</div>}
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={() => void generate()} disabled={!name.trim() || loading}>
                <Icon name="key" size={13} />{loading ? "Generating…" : "Generate key"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-head">
              <h3 className="modal-title">Key created</h3>
              <p className="modal-sub">Copy this key now — it will not be shown again</p>
            </div>
            <div className="modal-body">
              <div className="field-label">Your new API key</div>
              <div className="key-reveal">
                <div className="text">{createdKey}</div>
                <CopyBtn onCopy={() => void navigator.clipboard.writeText(createdKey)} />
              </div>
              <div className="callout">
                <Icon name="warn" size={14} />
                <div>Store this key securely — LocalLink only stores a hash and cannot recover it.</div>
              </div>
              <div style={{ marginTop: 16 }}>
                <div className="field-label">Example request</div>
                <pre className="code-block">{curlExample}</pre>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary" onClick={close}>Done</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
