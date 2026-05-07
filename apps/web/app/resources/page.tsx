"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOverlays } from "@/components/overlays/OverlayContext";
import { Icon } from "@/components/ui/Icon";
import { ResIcon } from "@/components/ui/ResIcon";
import { StatusPill } from "@/components/ui/StatusPill";
import { TypeBadge } from "@/components/ui/TypeBadge";
import type { Resource, ResourceType } from "@/lib/types";

type Filter = "all" | ResourceType;

const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export default function ResourcesPage() {
  const router = useRouter();
  const { openAddResource } = useOverlays();
  const [filter, setFilter] = useState<Filter>("all");
  const [resources, setResources] = useState<Resource[]>([]);
  const populated = resources.length > 0;
  const types: Array<{ id: Filter; label: string }> = [
    { id: "all", label: "All" },
    { id: "database", label: "Databases" },
    { id: "ai-model", label: "AI models" },
    { id: "http-api", label: "HTTP APIs" }
  ];
  const items = useMemo(
    () => (filter === "all" ? resources : resources.filter((resource) => resource.type === filter)),
    [filter, resources]
  );

  useEffect(() => {
    void fetch(`${gatewayUrl}/resources`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then((items: Array<Resource & { type: ResourceType | "ai_model" | "http_api" }>) => {
        setResources(items.map(normalizeResource));
      });
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Resources</h1>
          <p className="page-sub">Local services tunneled through the gateway. {populated ? `${resources.length} total.` : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary"><Icon name="download" size={13} />Export</button>
          <button className="btn btn-primary" onClick={openAddResource}><Icon name="plus" size={13} />Add resource</button>
        </div>
      </div>

      <div className="section">
        <div className="filters">
          {types.map((item) => (
            <button key={item.id} className={"chip " + (filter === item.id ? "active" : "")} onClick={() => setFilter(item.id)}>
              {item.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <input className="filter-input filter-search" placeholder="Search resources..." />
          <button className="chip"><Icon name="settings" size={12} />Columns</button>
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
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((resource) => (
                <tr key={resource.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/resources/${resource.id}`)}>
                  <td>
                    <div className="resource-name-cell">
                      <ResIcon type={resource.type} />
                      <div><div className="name">{resource.name}</div><div className="sub">{resource.id}</div></div>
                    </div>
                  </td>
                  <td><TypeBadge type={resource.type} /></td>
                  <td><span className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>{`${gatewayUrl}/r/${resource.id}`}</span></td>
                  <td><StatusPill status={resource.active ? "active" : "inactive"} /></td>
                  <td><span className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>{resource.tokenPrefix ?? "hidden"}</span></td>
                  <td style={{ color: "var(--text-2)", fontSize: 12.5 }}>{formatDate(resource.createdAt)}</td>
                  <td><button className="btn btn-ghost btn-icon btn-sm" onClick={(event) => event.stopPropagation()}><Icon name="moreH" size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">
            <div className="icon-wrap"><Icon name="resources" size={18} /></div>
            <div className="title">No resources registered</div>
            <div className="sub">Add a local database, AI model, or HTTP service to start routing requests through the gateway.</div>
            <button className="btn btn-primary" onClick={openAddResource}><Icon name="plus" size={13} />Add resource</button>
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeResource(resource: Omit<Resource, "type"> & { type: string }): Resource {
  const type = resource.type === "ai_model" ? "ai-model" : resource.type === "http_api" ? "http-api" : resource.type;
  return {
    ...resource,
    type: type as ResourceType,
    subtype: resource.subtype ?? type,
    endpoint: resource.endpoint ?? `${gatewayUrl}/r/${resource.id}`,
    local: resource.local ?? "-",
    status: resource.active ? "active" : "inactive",
    keys: resource.keys ?? 0,
    lastActive: resource.lastActive ?? "Never",
    reqs24h: resource.reqs24h ?? 0
  };
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
