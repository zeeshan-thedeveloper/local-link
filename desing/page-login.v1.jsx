/* global React, Icon */
const LoginPage = ({ onLogin }) => (
  <div className="login-page">
    <div className="login-card">
      <div className="login-brand">
        <span className="brand-mark"/>
        LocalLink
      </div>
      <h1 className="login-title">Sign in to your gateway</h1>
      <p className="login-sub">Single-user instance · dev@kestrel.io</p>

      <form onSubmit={(e) => { e.preventDefault(); onLogin && onLogin(); }}>
        <div className="field">
          <div className="field-label">Email</div>
          <input className="input" type="email" defaultValue="dev@kestrel.io" autoFocus/>
        </div>
        <div className="field">
          <div className="field-label">Password <a href="#" style={{ color: "var(--text-3)", textDecoration: "none", fontWeight: 400 }}>Forgot?</a></div>
          <input className="input" type="password" placeholder="••••••••••••"/>
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: "100%", height: 36, justifyContent: "center", marginTop: 6 }}>Sign in <Icon name="arrow" size={13}/></button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0", color: "var(--text-4)", fontSize: 11 }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
        OR
        <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
      </div>

      <button className="btn btn-secondary" style={{ width: "100%", height: 36, justifyContent: "center" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12c0 5.3 3.4 9.8 8.2 11.4.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.3-.6-1.6.1-3.2 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.9.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6C20.6 21.8 24 17.3 24 12c0-6.6-5.4-12-12-12z"/></svg>
        Continue with GitHub
      </button>

      <div className="login-foot">
        Single-user system · <a href="#">Need help?</a>
      </div>
    </div>
  </div>
);

window.LoginPage = LoginPage;
