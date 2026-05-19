"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { ResIcon } from "@/components/ui/ResIcon";
import type { ResourceType } from "@/lib/types";

type CreatedResource = {
  resource: {
    id: string;
    name: string;
    type: ResourceType;
    hostId: string;
    active: boolean;
    tokenPrefix?: string | null;
  };
  hostToken: string;
};

const gatewayUrl =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export function AddResourceSlideOver({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (created: CreatedResource) => void;
}) {
  const [type, setType] = useState<ResourceType>("database");
  const [name, setName] = useState("");
  const [localUrl, setLocalUrl] = useState("");
  const [connectionString, setConnectionString] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const types: Array<{ id: ResourceType; name: string; desc: string }> = [
    { id: "database", name: "Database", desc: "Postgres query endpoint" },
    { id: "http-api", name: "HTTP API", desc: "Any local web service" },
  ];

  const submit = () => {
    setError(null);
    startTransition(async () => {
      try {
        const config =
          type === "database"
            ? {
                engine: "postgres",
                connectionString:
                  connectionString ||
                  localUrl ||
                  "postgresql://locallink:locallink@localhost:5433/locallink",
              }
            : { url: localUrl || "http://localhost:3000" };
        const response = await fetch(`${gatewayUrl}/resources`, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, type, hostId: "pending", config }),
        });
        if (!response.ok) {
          throw new Error(`Gateway request failed: ${response.status}`);
        }
        const created = (await response.json()) as CreatedResource;
        onClose();
        onCreated?.(created);
        setName("");
        setLocalUrl("");
        setConnectionString("");
      } catch (error) {
        setError(error instanceof Error ? error.message : "Could not create resource");
      }
    });
  };

  return (
    <>
      <div className={"scrim " + (open ? "open" : "")} onClick={onClose} />
      <aside className={"slideover " + (open ? "open" : "")}>
        <div className="slideover-head">
          <div>
            <div className="slideover-title">Add resource</div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>
              Tunnel a local service through the gateway
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} type="button">
            <Icon name="close" size={14} />
          </button>
        </div>
        <div className="slideover-body">
          <div className="field">
            <div className="field-label">Resource type</div>
            <div className="type-select">
              {types.map((item) => (
                <button
                  key={item.id}
                  className={"type-select-card " + (type === item.id ? "active" : "")}
                  onClick={() => setType(item.id)}
                  type="button"
                >
                  <div className="top">
                    <ResIcon type={item.id} />
                    <span className="name">{item.name}</span>
                  </div>
                  <div className="desc">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <div className="field-label">Name</div>
            <input
              className="input"
              placeholder="Resource name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="field">
            <div className="field-label">
              Local URL <span className="opt">on host machine</span>
            </div>
            <input
              className="input mono"
              placeholder={
                type === "database"
                  ? "postgresql://localhost:5433/locallink"
                  : "http://localhost:3000"
              }
              value={localUrl}
              onChange={(event) => setLocalUrl(event.target.value)}
            />
            <div className="field-help">
              You can update this later with the host CLI setup wizard.
            </div>
          </div>
          {type === "database" && (
            <div className="field">
              <div className="field-label">
                Connection string <span className="opt">optional</span>
              </div>
              <textarea
                className="textarea"
                rows={3}
                placeholder="postgresql://locallink:locallink@localhost:5433/locallink?sslmode=disable"
                value={connectionString}
                onChange={(event) => setConnectionString(event.target.value)}
              />
            </div>
          )}
          {error && (
            <div className="callout">
              <Icon name="warn" size={14} />
              <div>{error}</div>
            </div>
          )}
        </div>
        <div className="slideover-foot">
          <button className="btn btn-ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={!name.trim() || isPending}
            type="button"
          >
            <Icon name="plus" size={13} />
            {isPending ? "Creating..." : "Create resource"}
          </button>
        </div>
      </aside>
    </>
  );
}
