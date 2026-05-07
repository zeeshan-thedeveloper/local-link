"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { RESOURCES } from "@/lib/data";

export function GenerateKeyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [created, setCreated] = useState(false);
  const hasResources = RESOURCES.length > 0;
  const fullKey = "ll_pk_8h2jaQ7m9nRfX2vkLBpZqYwT4cA6dN1xJ3sH";
  const close = () => { setCreated(false); setName(""); onClose(); };

  return (
    <>
      <div className={"scrim " + (open ? "open" : "")} onClick={close}/>
      <div className={"modal " + (open ? "open" : "")}>
        {!created ? (
          <>
            <div className="modal-head">
              <h3 className="modal-title">Generate API key</h3>
              <p className="modal-sub">Create a new key authorized for one or more resources</p>
            </div>
            <div className="modal-body">
              <div className="field">
                <div className="field-label">Key name</div>
                <input className="input" placeholder="Key name" value={name} onChange={e => setName(e.target.value)} autoFocus/>
                <div className="field-help">A label so you can recognize this key later</div>
              </div>
              <div className="field">
                <div className="field-label">Authorized resource</div>
                <select className="select" disabled={!hasResources}>
                  {hasResources ? (
                    <>
                      {RESOURCES.map((resource) => <option key={resource.id}>{resource.name}</option>)}
                      <option>All resources</option>
                    </>
                  ) : (
                    <option>No resources available</option>
                  )}
                </select>
              </div>
              <div className="field">
                <div className="field-label">Expires</div>
                <select className="select"><option>Never</option><option>30 days</option><option>90 days</option><option>1 year</option></select>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setCreated(true)} disabled={!name || !hasResources}><Icon name="key" size={13}/>Generate key</button>
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
                <div className="text">{fullKey}</div>
                <button className="copy"><Icon name="copy" size={13}/>Copy</button>
              </div>
              <div className="callout">
                <Icon name="warn" size={14}/>
                <div>Store this key in a secure place — a secrets manager or environment variable. LocalLink only stores a hash, so we cannot recover it later.</div>
              </div>
              <div style={{ marginTop: 16 }}>
                <div className="field-label">Use it like this</div>
                <pre className="code-block">{`curl https://gw.locallink.dev/r/pgmain_8h2j/query \\
  -H "Authorization: Bearer ${fullKey.slice(0, 24)}..."`}</pre>
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
