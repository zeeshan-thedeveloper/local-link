"use client";

import { Icon } from "@/components/ui/Icon";
import type { ResourceType } from "@/lib/types";

type ConnectHostModalProps = {
  open: boolean;
  onClose: () => void;
  resource: { id: string; name: string; type: ResourceType } | null;
  gatewayUrl: string;
  token: string;
};

export function ConnectHostModal({ open, onClose, resource, gatewayUrl, token }: ConnectHostModalProps) {
  if (!resource) return null;

  const install = "npm install -g @locallink/host";
  const init = `locallink init \\
  --gateway ${gatewayUrl} \\
  --token ${token}`;
  const register = `locallink register \\
  --id ${resource.id} \\
  --type ${resource.type} \\
  ${resource.type === "database" ? "--connection-string ..." : "--url ..."}`;
  const start = "locallink start";
  const all = [install, init, register, start].join("\n\n");

  return (
    <>
      <div className={"scrim " + (open ? "open" : "")} />
      <div className={"modal " + (open ? "open" : "")} style={{ width: 620 }}>
        <div className="modal-head">
          <h3 className="modal-title">Connect your host</h3>
          <p className="modal-sub">
            Run this command on the machine where {resource.name} is running. The token is shown only once.
          </p>
        </div>
        <div className="modal-body" style={{ display: "grid", gap: 12 }}>
          <CommandBlock label="Step 1 - Install" value={install} />
          <CommandBlock label="Step 2 - Initialize" value={init} />
          <CommandBlock label="Step 3 - Register local connection" value={register} />
          <CommandBlock label="Step 4 - Start" value={start} />
          <div className="callout">
            <Icon name="warn" size={14} />
            <div>This token will not be shown again. Store it securely.</div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" type="button" onClick={() => copyText(all)}>
            <Icon name="copy" size={13} />
            Copy all commands
          </button>
          <button className="btn btn-primary" type="button" onClick={onClose}>
            Done, I copied it
          </button>
        </div>
      </div>
    </>
  );
}

function CommandBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="field-label">{label}</div>
      <pre className="code-block" style={{ margin: 0, paddingRight: 48 }}>
        {value}
        <button className="copy" type="button" onClick={() => copyText(value)} title="Copy">
          <Icon name="copy" size={13} />
        </button>
      </pre>
    </div>
  );
}

function copyText(value: string) {
  void navigator.clipboard?.writeText(value);
}
