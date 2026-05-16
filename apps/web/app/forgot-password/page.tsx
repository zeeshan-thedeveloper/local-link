"use client";

import Link from "next/link";
import { useState } from "react";
import "../login/login.css";

function apiUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  return `${base}${path}`;
}

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    await fetch(apiUrl("/api/auth/forget-password"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        redirectTo: `${window.location.origin}/reset-password`
      })
    });
    setSent(true);
  }

  return (
    <div className="login-page">
      <Link className="login-topbar" href="/">
        <span className="brand-mark" />
        <span>LocalLink</span>
        <span className="version">v0.4.2</span>
      </Link>
      <div className="login-window" style={{ maxWidth: 420 }}>
        <section className="login-form-pane">
          <p className="login-aside-label" style={{ margin: 0 }}>
            <span>// Account recovery</span>
          </p>
          <h1 className="login-title">Reset your password</h1>
          <p className="login-sub">
            {sent ? "Check your email for a reset link." : "Enter your owner account email and LocalLink will send a reset link."}
          </p>
          {sent ? (
            <Link href="/login" className="btn btn-primary" style={{ width: "100%", height: 38, justifyContent: "center" }}>
              Back to sign in
            </Link>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <div className="field-label">Email</div>
                <input className="input" type="email" name="email" autoFocus required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", height: 38, justifyContent: "center", marginTop: 8 }}>
                Send reset link
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
