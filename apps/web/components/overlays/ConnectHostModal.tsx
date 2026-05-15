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

  const setup = `pnpm --filter @locallink/cli dev -- setup \\
  --gateway ${gatewayUrl} \\
  --token ${token}`;
  const start = "pnpm --filter @locallink/cli dev -- start";
  const all = [setup, start].join("\n\n");

  return (
    <>
      <div className={"scrim " + (open ? "open" : "")} />
      <div className={"modal " + (open ? "open" : "")} style={{ width: 620 }}>
        <div className="modal-head">
          <h3 className="modal-title">Connect your host</h3>
          <p className="modal-sub">
            Run this from the LocalLink repo on the machine where {resource.name} is running. The token is shown only once.
          </p>
        </div>
        <div className="modal-body" style={{ display: "grid", gap: 12 }}>
          <CommandBlock label="Step 1 - Setup wizard" value={setup} />
          <p className="field-help" style={{ margin: 0 }}>
            The wizard verifies this resource, asks for the local connection details, saves your host config, and can
            start the tunnel immediately.
          </p>
          <CommandBlock label="Step 2 - Start later" value={start} />
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
