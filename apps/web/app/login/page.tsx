"use client";

import { login } from "./actions";
import { Icon } from "@/components/ui/Icon";

function oauthUrl(provider: "google"): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  return base ? `${base}/api/auth/${provider}` : "#";
}

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark"/>
          LocalLink
        </div>
        <h1 className="login-title">Sign in to your gateway</h1>
        <p className="login-sub">Single-user instance</p>

        <form action={login}>
          <div className="field">
            <div className="field-label">Email</div>
            <input className="input" type="email" name="email" autoFocus/>
          </div>
          <div className="field">
            <div className="field-label">Password <a href="#" style={{ color: "var(--text-3)", textDecoration: "none", fontWeight: 400 }}>Forgot?</a></div>
            <input className="input" type="password" name="password" placeholder="************"/>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", height: 36, justifyContent: "center", marginTop: 6 }}>Sign in <Icon name="arrow" size={13}/></button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0", color: "var(--text-4)", fontSize: 11 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
          OR
          <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
        </div>

        <a href={oauthUrl("google")} className="btn btn-secondary" style={{ width: "100%", height: 36, justifyContent: "center" }}>
          <GoogleIcon />
          Continue with Google
        </a>

        <div className="login-foot">
          Single-user system - <a href="#">Need help?</a>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
