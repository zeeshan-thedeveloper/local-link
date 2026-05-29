"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { ResIcon } from "@/components/ui/ResIcon";
import { generateSlug } from "@/lib/slug";
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
const gatewayBaseDomain =
  process.env.NEXT_PUBLIC_GATEWAY_BASE_DOMAIN ?? "locallink.zeeshanahmed.app";
type SlugStatus = "idle" | "checking" | "available" | "taken";

export function AddResourceSlideOver({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (created: CreatedResource) => void;
}) {
  const [type, setType] = useState<ResourceType>("web-app");
  const [name, setName] = useState("");
  const [localUrl, setLocalUrl] = useState("");
  const [connectionString, setConnectionString] = useState("");
  const [slugOverride, setSlugOverride] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
  const [showCustomSlug, setShowCustomSlug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const derivedSlug = useMemo(() => generateSlug(name), [name]);
  const activeSlug = slugOverride ?? derivedSlug;
  const isSlugBlocked = slugStatus === "checking" || slugStatus === "taken" || !activeSlug;

  const types: Array<{ id: ResourceType; name: string; desc: string }> = [
    { id: "web-app", name: "Web App", desc: "Connect a React, Vite, or Next.js app" },
    { id: "api", name: "API", desc: "Connect a Node.js, Express, or FastAPI backend" },
    { id: "database", name: "Database", desc: "Postgres query endpoint" },
  ];

  useEffect(() => {
    if (!open) {
      setName("");
      setLocalUrl("");
      setConnectionString("");
      setSlugOverride(null);
      setSlugStatus("idle");
      setSlugSuggestions([]);
      setShowCustomSlug(false);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!activeSlug) {
      setSlugStatus("idle");
      setSlugSuggestions([]);
      return;
    }

    let cancelled = false;
    setSlugStatus("checking");
    setSlugSuggestions([]);

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `${gatewayUrl}/resources/check-slug?slug=${encodeURIComponent(activeSlug)}`,
          { credentials: "include" },
        );
        const data = (await response.json().catch(() => ({}))) as {
          available?: boolean;
          suggestions?: string[];
        };
        if (cancelled) return;
        if (response.ok && data.available) {
          setSlugStatus("available");
          setSlugSuggestions([]);
          return;
        }
        setSlugStatus("taken");
        setSlugSuggestions(data.suggestions ?? []);
      } catch {
        if (!cancelled) {
          setSlugStatus("idle");
          setSlugSuggestions([]);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeSlug]);

  const closeAndReset = () => {
    onClose();
  };

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
            : {
                url: localUrl || "http://localhost:3000",
              };
        const response = await fetch(`${gatewayUrl}/resources`, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name,
            type,
            hostId: "pending",
            config,
            ...(slugOverride ? { slug: slugOverride } : {}),
          }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Gateway request failed: ${response.status}`);
        }
        const created = (await response.json()) as CreatedResource;
        closeAndReset();
        onCreated?.(created);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Could not create resource");
      }
    });
  };

  return (
    <>
      <div className={"scrim " + (open ? "open" : "")} onClick={closeAndReset} />
      <aside className={"slideover " + (open ? "open" : "")}>
        <div className="slideover-head">
          <div>
            <div className="slideover-title">Add resource</div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>
              Tunnel a local service through the gateway
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={closeAndReset} type="button">
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
            {activeSlug && (
              <div className="field-help">
                <span className="mono">
                  {activeSlug}.{gatewayBaseDomain}
                </span>
              </div>
            )}
            <SlugAvailability
              slug={activeSlug}
              status={slugStatus}
              suggestions={slugSuggestions}
              onSelect={(suggestion) => {
                setSlugOverride(suggestion);
                setShowCustomSlug(true);
              }}
            />
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={() => {
                setShowCustomSlug((showing) => {
                  setSlugOverride(showing ? null : activeSlug || null);
                  return !showing;
                });
              }}
              style={{ width: "fit-content", paddingLeft: 0, paddingRight: 0, gap: 4 }}
            >
              Customize URL
              <Icon
                name="chevronD"
                size={12}
                style={{ transform: showCustomSlug ? "rotate(180deg)" : undefined }}
              />
            </button>
          </div>
          {showCustomSlug && (
            <div className="field">
              <div className="field-label">
                Slug <span className="opt">optional</span>
              </div>
              <input
                className="input mono"
                placeholder="my-resource"
                value={activeSlug}
                onChange={(event) => setSlugOverride(generateSlug(event.target.value))}
              />
              <div className="field-help">
                Used in your gateway URL:{" "}
                <span className="mono">
                  {activeSlug || "my-resource"}.{gatewayBaseDomain}
                </span>
              </div>
            </div>
          )}
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
          <button className="btn btn-ghost" onClick={closeAndReset} type="button">
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={!name.trim() || isPending || isSlugBlocked}
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

function SlugAvailability({
  slug,
  status,
  suggestions,
  onSelect,
}: {
  slug: string;
  status: SlugStatus;
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}) {
  if (!slug || status === "idle") return null;

  const tone =
    status === "available" ? "var(--green)" : status === "taken" ? "var(--red)" : "var(--text-3)";

  return (
    <div className="field-help" style={{ color: tone, display: "grid", gap: 8 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {status === "checking" ? (
          <>
            <Icon name="refresh" size={13} />
            Checking availability...
          </>
        ) : status === "available" ? (
          <>
            <Icon name="check" size={13} />
            {slug} is available
          </>
        ) : (
          <>
            <Icon name="warn" size={13} />
            {slug} is taken
          </>
        )}
      </span>
      {status === "taken" && suggestions.length > 0 && (
        <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {suggestions.map((suggestion) => (
            <button
              className="chip"
              type="button"
              key={suggestion}
              onClick={() => onSelect(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </span>
      )}
    </div>
  );
}
