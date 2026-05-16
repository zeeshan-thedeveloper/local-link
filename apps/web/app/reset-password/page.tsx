"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import "../login/login.css";

function apiUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  return `${base}${path}`;
}

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const password = (event.currentTarget.elements.namedItem("password") as HTMLInputElement).value;
    const response = await fetch(apiUrl("/api/auth/reset-password"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password })
    });
    if (!response.ok) {
      setError("This reset link is invalid or expired.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <>
        <h1 className="login-title">Password updated</h1>
        <p className="login-sub">You can now sign in with your new password.</p>
        <Link href="/login" className="btn btn-primary" style={{ width: "100%", height: 38, justifyContent: "center" }}>
          Sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="login-title">Set a new password</h1>
      <p className="login-sub">{token ? "Choose a new password for your LocalLink owner account." : "This reset link is missing its token."}</p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <div className="field-label">New password</div>
          <input className="input" type="password" name="password" minLength={8} required autoFocus disabled={!token} />
        </div>
        {error ? <p className="login-sub" style={{ color: "var(--red)", marginBottom: 0 }}>{error}</p> : null}
        <button type="submit" className="btn btn-primary" style={{ width: "100%", height: 38, justifyContent: "center", marginTop: 8 }} disabled={!token}>
          Set new password
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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
          <Suspense fallback={<p className="login-sub">Loading reset link...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
