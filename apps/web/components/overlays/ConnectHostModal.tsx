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

export function ConnectHostModal({
  open,
  onClose,
  resource,
  gatewayUrl,
  token,
}: ConnectHostModalProps) {
  if (!resource) return null;

  const install = "npm install -g @locallink/cli";
  const setup = `locallink setup --gateway ${gatewayUrl} --token ${token}`;
  const start = "locallink start";
  const all = [install, setup, start].join("\n\n");

  return (
    <>
      <div className={"scrim " + (open ? "open" : "")} />
      <div className={"modal modal-connect-host " + (open ? "open" : "")}>
        <div className="modal-head">
          <h3 className="modal-title">Connect your host</h3>
          <p className="modal-sub">
            Run these on the machine where {resource.name} is running. The token is shown only once.
          </p>
        </div>
        <div className="modal-body">
          <CommandBlock label="Step 1 - Install the CLI" value={install} />
          <CommandBlock label="Step 2 - Setup wizard" value={setup} />
          <p className="field-help" style={{ margin: 0 }}>
            The wizard verifies this resource, uses your gateway config, and can start the tunnel
            immediately.
          </p>
          <CommandBlock label="Step 3 - Start later" value={start} />
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
    <div className="command-block">
      <div className="field-label">{label}</div>
      <pre className="code-block">
        <code>{value}</code>
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
