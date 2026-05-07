/* global React, Icon, ResIcon, CopyBtn */
const { useState: useStateM } = React;

const AddResourceSlideOver = ({ open, onClose, onCreate }) => {
  const [type, setType] = useStateM("database");
  const [name, setName] = useStateM("");

  const types = [
    { id: "database", name: "Database", desc: "Postgres, MySQL, Redis, MongoDB" },
    { id: "ai", name: "AI Model", desc: "Ollama, ComfyUI, llama.cpp" },
    { id: "http", name: "HTTP API", desc: "Any local web service" },
  ];

  return (
    <>
      <div className={"scrim " + (open ? "open" : "")} onClick={onClose}/>
      <aside className={"slideover " + (open ? "open" : "")}>
        <div className="slideover-head">
          <div>
            <div className="slideover-title">Add resource</div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>Tunnel a local service through the gateway</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="close" size={14}/></button>
        </div>
        <div className="slideover-body">
          <div className="field">
            <div className="field-label">Resource type</div>
            <div className="type-select">
              {types.map(t => (
                <button key={t.id} className={"type-select-card " + (type === t.id ? "active" : "")} onClick={() => setType(t.id)}>
                  <div className="top"><ResIcon type={t.id}/><span className="name">{t.name}</span></div>
                  <div className="desc">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <div className="field-label">Name</div>
            <input className="input" placeholder="e.g. postgres-main" value={name} onChange={e => setName(e.target.value)}/>
            <div className="field-help">Used in the gateway URL slug. Lowercase, alphanumeric, dashes only.</div>
          </div>

          <div className="field">
            <div className="field-label">Local URL <span className="opt">on host machine</span></div>
            <input className="input mono" placeholder={type === "database" ? "postgresql://localhost:5432/app" : type === "ai" ? "http://localhost:11434" : "http://localhost:3000"}/>
            <div className="field-help">Where the host CLI should forward incoming requests.</div>
          </div>

          {type === "database" && (
            <div className="field">
              <div className="field-label">Connection string <span className="opt">optional</span></div>
              <textarea className="textarea" rows={3} placeholder="postgresql://user:password@localhost:5432/db?sslmode=disable"/>
              <div className="field-help">Stored encrypted on the host. Never sent to the gateway.</div>
            </div>
          )}

          <div className="field">
            <div className="field-label">Region</div>
            <select className="select">
              <option>us-east-1 (Virginia) · default</option>
              <option>eu-west-1 (Dublin)</option>
              <option>ap-southeast-1 (Singapore)</option>
            </select>
          </div>

          <div className="callout">
            <Icon name="info" size={14}/>
            <div>An API key will be generated automatically with the resource. You can revoke it or add more anytime.</div>
          </div>
        </div>
        <div className="slideover-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onCreate}><Icon name="plus" size={13}/>Create resource</button>
        </div>
      </aside>
    </>
  );
};

const GenerateKeyModal = ({ open, onClose }) => {
  const [name, setName] = useStateM("");
  const [created, setCreated] = useStateM(false);
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
                <input className="input" placeholder="e.g. production, ci-runner" value={name} onChange={e => setName(e.target.value)} autoFocus/>
                <div className="field-help">A label so you can recognize this key later</div>
              </div>
              <div className="field">
                <div className="field-label">Authorized resource</div>
                <select className="select"><option>postgres-main</option><option>ollama-llama3</option><option>All resources</option></select>
              </div>
              <div className="field">
                <div className="field-label">Expires</div>
                <select className="select"><option>Never</option><option>30 days</option><option>90 days</option><option>1 year</option></select>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setCreated(true)} disabled={!name}><Icon name="key" size={13}/>Generate key</button>
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
};

window.AddResourceSlideOver = AddResourceSlideOver;
window.GenerateKeyModal = GenerateKeyModal;
