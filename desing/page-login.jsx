/* global React, Icon */
const LoginPage = ({ onLogin }) => (
  <div className="login-page">
    <a className="login-topbar" href="Landing.html">
      <span className="brand-mark"/>
      <span>LocalLink</span>
      <span className="version">v0.4.2</span>
    </a>
    <a className="login-back" href="Landing.html">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      back to site
    </a>

    <div className="login-window">
      <div className="login-window-head">
        <div className="login-window-dots"><span/><span/><span/></div>
        <div className="login-window-tab">
          <span className="dot"/>
          gateway.kestrel.io/login
        </div>
        <div className="login-window-pull">single-user · v0.4.2</div>
      </div>

      <div className="login-window-body">
        {/* LEFT — host agent status */}
        <aside className="login-aside">
          <p className="login-aside-label">
            <span>Host agent</span>
            <span className="badge">macbook-pro-m4</span>
          </p>

          <span className="login-eyebrow">
            <span className="pulse"/>
            tunnel ready <span className="sep">·</span> awaiting sign-in
          </span>

          <div className="login-term">
            <div className="ln"><span className="prompt">$</span><span className="cmd">locallink status</span></div>
            <div className="ln pad"><span className="ok">✓</span><span className="info">agent online</span><span className="com">// v0.4.2</span></div>
            <div className="ln pad"><span className="ok">✓</span><span className="info">tunnel reachable</span><span className="com">// WSS, AES-256-GCM</span></div>
            <div className="ln pad"><span className="info">→</span><span className="str">gateway.kestrel.io</span></div>
            <div className="ln"><span className="prompt">$</span><span className="cmd">locallink whoami</span></div>
            <div className="ln pad"><span className="arrow">→</span><span className="info">authenticate to continue</span></div>
            <div className="ln"><span className="prompt">$</span><span className="caret"/></div>
          </div>

          <div className="login-stats">
            <div className="login-stat"><span className="k">// instance</span><span className="v">single-user</span></div>
            <div className="login-stat"><span className="k">// region</span><span className="v">self-hosted</span></div>
            <div className="login-stat"><span className="k">// build</span><span className="v">8h2j4a</span></div>
            <div className="login-stat"><span className="k">// license</span><span className="v">MIT</span></div>
          </div>
        </aside>

        {/* RIGHT — auth form */}
        <section className="login-form-pane">
          <p className="login-aside-label" style={{ margin: 0 }}>
            <span>// Sign in</span>
          </p>
          <h1 className="login-title">Sign in to your gateway</h1>
          <p className="login-sub">
            Continue to your single-user instance at <span className="mono">gateway.kestrel.io</span>.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); onLogin && onLogin(); }}>
            <div className="field">
              <div className="field-label">Email</div>
              <input className="input" type="email" defaultValue="dev@kestrel.io" autoFocus/>
            </div>
            <div className="field">
              <div className="field-label">
                Password
                <a href="#" className="forgot">Forgot?</a>
              </div>
              <input className="input" type="password" placeholder="••••••••••••"/>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", height: 38, justifyContent: "center", marginTop: 8 }}>
              Sign in <Icon name="arrow" size={13}/>
            </button>
          </form>

          <div className="login-divider">OR</div>

          <button className="btn btn-secondary" style={{ width: "100%", height: 38, justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12c0 5.3 3.4 9.8 8.2 11.4.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.3-.6-1.6.1-3.2 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.9.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6C20.6 21.8 24 17.3 24 12c0-6.6-5.4-12-12-12z"/></svg>
            Continue with GitHub
          </button>

          <div className="login-foot">
            Single-user system
            <span className="sep">·</span>
            <a href="https://github.com">Need help?</a>
          </div>
        </section>
      </div>

      <div className="login-window-foot">
        <span className="stat"><span className="pulse"/><span className="v">tunnel live</span></span>
        <span className="stat"><span className="k">// p50</span><span className="v">28ms</span></span>
        <span className="stat"><span className="k">// uptime</span><span className="v">14m 22s</span></span>
        <span className="stat" style={{ marginLeft: "auto" }}><span className="k">→</span><span className="v">gateway.kestrel.io</span></span>
      </div>
    </div>
  </div>
);

window.LoginPage = LoginPage;
