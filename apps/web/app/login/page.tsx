"use client";

import Link from "next/link";
import { login } from "./actions";
import { Icon } from "@/components/ui/Icon";
import "./login.css";

function oauthUrl(provider: "google" | "github"): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  return base ? `${base}/api/auth/${provider}` : "#";
}

export default function LoginPage() {
  return (
    <div className="login-page">
      <Link className="login-topbar" href="/">
        <span className="brand-mark" />
        <span>LocalLink</span>
        <span className="version">v0.4.2</span>
      </Link>

      <Link className="login-back" href="/">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        back to site
      </Link>

      <div className="login-window">
        <div className="login-window-head">
          <div className="login-window-dots"><span /><span /><span /></div>
          <div className="login-window-tab">
            <span className="dot" />
            gateway.kestrel.io/login
          </div>
          <div className="login-window-pull">single-user · v0.4.2</div>
        </div>

        <div className="login-window-body">
          <aside className="login-aside">
            <p className="login-aside-label">
              <span>Host agent</span>
              <span className="badge">macbook-pro-m4</span>
            </p>

            <span className="login-eyebrow">
              <span className="pulse" />
              tunnel ready <span className="sep">·</span> awaiting sign-in
            </span>

            <div className="login-term">
              <div className="ln"><span className="prompt">$</span><span className="cmd">locallink status</span></div>
              <div className="ln pad"><span className="ok">✓</span><span className="info">agent online</span><span className="com">// v0.4.2</span></div>
              <div className="ln pad"><span className="ok">✓</span><span className="info">tunnel reachable</span><span className="com">// WSS, AES-256-GCM</span></div>
              <div className="ln pad"><span className="info">→</span><span className="str">gateway.kestrel.io</span></div>
              <div className="ln"><span className="prompt">$</span><span className="cmd">locallink whoami</span></div>
              <div className="ln pad"><span className="arrow">→</span><span className="info">authenticate to continue</span></div>
              <div className="ln"><span className="prompt">$</span><span className="caret" /></div>
            </div>

            <div className="login-stats">
              <div className="login-stat"><span className="k">// instance</span><span className="v">single-user</span></div>
              <div className="login-stat"><span className="k">// region</span><span className="v">self-hosted</span></div>
              <div className="login-stat"><span className="k">// build</span><span className="v">8h2j4a</span></div>
              <div className="login-stat"><span className="k">// license</span><span className="v">MIT</span></div>
            </div>
          </aside>

          <section className="login-form-pane">
            <p className="login-aside-label" style={{ margin: 0 }}>
              <span>// Sign in</span>
            </p>
            <h1 className="login-title">Sign in to your gateway</h1>
            <p className="login-sub">
              Continue to your single-user instance at{" "}
              <span className="mono">gateway.kestrel.io</span>.
            </p>

            <form action={login}>
              <div className="field">
                <div className="field-label">Email</div>
                <input className="input" type="email" name="email" autoFocus />
              </div>
              <div className="field">
                <div className="field-label">
                  Password
                  <a href="/forgot-password" className="forgot">Forgot?</a>
                </div>
                <input className="input" type="password" name="password" placeholder="••••••••••••" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", height: 38, justifyContent: "center", marginTop: 8 }}>
                Sign in <Icon name="arrow" size={13} />
              </button>
            </form>

            <div className="login-divider">OR</div>

            <a href={oauthUrl("google")} className="btn btn-secondary" style={{ width: "100%", height: 38, justifyContent: "center" }}>
              <svg aria-hidden width="14" height="14" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </a>
            <a href={oauthUrl("github")} className="btn btn-secondary login-oauth-secondary" style={{ width: "100%", height: 38, justifyContent: "center" }}>
              <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </a>

            <div className="login-foot">
              Single-user system
              <span className="sep">·</span>
              <a href="https://github.com">Need help?</a>
            </div>
          </section>
        </div>

        <div className="login-window-foot">
          <span className="stat"><span className="pulse" /><span className="v">tunnel live</span></span>
          <span className="stat"><span className="k">// p50</span><span className="v">28ms</span></span>
          <span className="stat"><span className="k">// uptime</span><span className="v">14m 22s</span></span>
          <span className="stat" style={{ marginLeft: "auto" }}>
            <span className="k">⌁</span><span className="v">gateway.kestrel.io</span>
          </span>
        </div>
      </div>
    </div>
  );
}
