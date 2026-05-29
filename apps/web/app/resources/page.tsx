"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOverlays } from "@/components/overlays/OverlayContext";
import { Icon } from "@/components/ui/Icon";
import { ResIcon } from "@/components/ui/ResIcon";
import { StatusPill } from "@/components/ui/StatusPill";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { resourceEndpoint } from "@/lib/resource-url";
import type { Resource, ResourceType } from "@/lib/types";

type Filter = "all" | ResourceType;
type HostStatus = { id: string; socketId: string; lastSeen: string | null };

const gatewayUrl =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export default function ResourcesPage() {
  const router = useRouter();
  const { openAddResource } = useOverlays();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [connectedHostIds, setConnectedHostIds] = useState<Set<string>>(new Set());
  const populated = resources.length > 0;
  const types: Array<{ id: Filter; label: string }> = [
    { id: "all", label: "All" },
    { id: "web-app", label: "Web apps" },
    { id: "api", label: "APIs" },
    { id: "database", label: "Databases" },
  ];
  const items = useMemo(() => {
    const filteredByType =
      filter === "all" ? resources : resources.filter((resource) => resource.type === filter);
    const needle = query.trim().toLowerCase();
    if (!needle) return filteredByType;
    return filteredByType.filter((resource) =>
      [resource.name, resource.id, resource.endpoint, resource.local]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [filter, query, resources]);

  useEffect(() => {
    void loadResources();
  }, []);

  const loadResources = async () => {
    const [resourceItems, status] = await Promise.all([
      fetch(`${gatewayUrl}/resources`, { credentials: "include" }).then((response) =>
        response.ok ? response.json() : [],
      ) as Promise<Array<Resource & { type: ResourceType | "ai_model" | "http_api" | "web_app" }>>,
      fetch(`${gatewayUrl}/tunnel/status`, { credentials: "include" }).then((response) =>
        response.ok ? response.json() : { hosts: [] },
      ) as Promise<{ hosts: HostStatus[] }>,
    ]);
    setResources(resourceItems.map(normalizeResource));
    setConnectedHostIds(new Set(status.hosts.map((host) => host.id)));
  };

  const deleteResource = async (resource: Resource) => {
    if (!window.confirm(`Delete ${resource.name}? This removes the resource and its host token.`))
      return;
    const response = await fetch(`${gatewayUrl}/resources/${resource.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      window.alert(`Could not delete ${resource.name}`);
      return;
    }
    setResources((items) => items.filter((item) => item.id !== resource.id));
    setConnectedHostIds((ids) => {
      const next = new Set(ids);
      next.delete(resource.id);
      return next;
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Resources</h1>
          <p className="page-sub">
            Local services tunneled through the gateway.{" "}
            {populated ? `${resources.length} total.` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={openAddResource}>
            <Icon name="plus" size={13} />
            Add resource
          </button>
        </div>
      </div>

      <div className="section">
        <div className="filters">
          {types.map((item) => (
            <button
              key={item.id}
              className={"chip " + (filter === item.id ? "active" : "")}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <input
            className="filter-input filter-search"
            placeholder="Search resources..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {populated && items.length > 0 ? (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: "30%" }}>Name</th>
                <th>Type</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th>Host token</th>
                <th>Created</th>
                <th style={{ width: 140 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((resource) => (
                <tr
                  key={resource.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/resources/${resource.id}`)}
                >
                  <td>
                    <div className="resource-name-cell">
                      <ResIcon type={resource.type} />
                      <div>
                        <div className="name">{resource.name}</div>
                        <div className="sub">{resource.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <TypeBadge type={resource.type} />
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>
                      {resource.endpoint}
                    </span>
                  </td>
                  <td>
                    <StatusPill
                      status={connectedHostIds.has(resource.id) ? "connected" : "disconnected"}
                      label={connectedHostIds.has(resource.id) ? "Online" : "Offline"}
                    />
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>
                      {resource.tokenPrefix ?? "hidden"}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-2)", fontSize: 12.5 }}>
                    {formatDate(resource.createdAt)}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          router.push(`/resources/${resource.id}`);
                        }}
                        type="button"
                      >
                        Manage
                      </button>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          void deleteResource(resource);
                        }}
                        style={{ color: "var(--red)" }}
                        title="Delete resource"
                        type="button"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">
            <div className="icon-wrap">
              <Icon name="resources" size={18} />
            </div>
            <div className="title">
              {populated ? "No matching resources" : "No resources registered"}
            </div>
            <div className="sub">
              {populated
                ? "Try a different filter or search term."
                : "Add a web app or database to start routing through the gateway."}
            </div>
            {!populated && (
              <button className="btn btn-primary" onClick={openAddResource}>
                <Icon name="plus" size={13} />
                Add resource
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeResource(resource: Omit<Resource, "type"> & { type: string }): Resource {
  const type =
    resource.type === "ai_model"
      ? "ai-model"
      : resource.type === "http_api"
        ? "http-api"
        : resource.type === "web_app"
          ? "web-app"
          : resource.type;
  const normalized: Resource = {
    ...resource,
    type: type as ResourceType,
    subtype: resource.subtype ?? type,
    endpoint: resource.endpoint ?? "",
    local: resource.local ?? "-",
    status: resource.active ? "active" : "inactive",
    keys: resource.keys ?? 0,
    lastActive: resource.lastActive ?? "Never",
    reqs24h: resource.reqs24h ?? 0,
  };
  return { ...normalized, endpoint: resource.endpoint ?? resourceEndpoint(normalized, gatewayUrl) };
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}
