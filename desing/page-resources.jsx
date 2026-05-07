/* global React, Icon, TypeBadge, StatusPill, ResIcon, RESOURCES */
const { useState: useStateR } = React;

const ResourcesPage = ({ populated, onOpen, onAddResource }) => {
  const [filter, setFilter] = useStateR("all");
  const types = [
    { id: "all", label: "All" },
    { id: "database", label: "Databases" },
    { id: "ai", label: "AI models" },
    { id: "http", label: "HTTP APIs" },
  ];
  const items = filter === "all" ? RESOURCES : RESOURCES.filter(r => r.type === filter);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Resources</h1>
          <p className="page-sub">Local services tunneled through the gateway. {populated ? "6 total." : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary"><Icon name="download" size={13}/>Export</button>
          <button className="btn btn-primary" onClick={onAddResource}><Icon name="plus" size={13}/>Add resource</button>
        </div>
      </div>

      <div className="section">
        <div className="filters">
          {types.map(t => (
            <button key={t.id} className={"chip " + (filter === t.id ? "active" : "")} onClick={() => setFilter(t.id)}>{t.label}</button>
          ))}
          <div style={{ flex: 1 }}/>
          <input className="filter-input filter-search" placeholder="Search resources…"/>
          <button className="chip"><Icon name="settings" size={12}/>Columns</button>
        </div>
        {populated && items.length > 0 ? (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: "26%" }}>Name</th>
                <th>Type</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Keys</th>
                <th>Last active</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => onOpen(r.id)}>
                  <td>
                    <div className="resource-name-cell">
                      <ResIcon type={r.type}/>
                      <div>
                        <div className="name">{r.name}</div>
                        <div className="sub">{r.subtype}</div>
                      </div>
                    </div>
                  </td>
                  <td><TypeBadge type={r.type}/></td>
                  <td><span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)" }}>{r.endpoint.replace("https://", "")}</span></td>
                  <td><StatusPill status={r.status}/></td>
                  <td className="num" style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{r.keys}</td>
                  <td style={{ color: "var(--text-2)", fontSize: 12.5 }}>{r.lastActive}</td>
                  <td>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => e.stopPropagation()}><Icon name="moreH" size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">
            <div className="icon-wrap"><Icon name="resources" size={18}/></div>
            <div className="title">No resources registered</div>
            <div className="sub">Add a local database, AI model, or HTTP service to start routing requests through the gateway.</div>
            <button className="btn btn-primary" onClick={onAddResource}><Icon name="plus" size={13}/>Add resource</button>
          </div>
        )}
      </div>
    </div>
  );
};

window.ResourcesPage = ResourcesPage;
