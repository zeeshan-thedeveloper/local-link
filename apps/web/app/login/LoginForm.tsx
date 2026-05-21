"use client";

import { useActionState, useEffect } from "react";
import { notifyCurrentUserUpdated } from "@/components/layout/AppShell";
import { Icon } from "@/components/ui/Icon";
import { login, type LoginState } from "./actions";

const errorMessages: Record<NonNullable<Extract<LoginState, { ok: false }>>["error"], string> = {
  credentials: "Invalid email or password.",
  session: "Sign-in succeeded but the session could not be established. Try again.",
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null);

  useEffect(() => {
    if (!state?.ok) return;
    notifyCurrentUserUpdated(state.user);
    window.location.href = "/dashboard";
  }, [state]);

  return (
    <>
      {state && !state.ok ? (
        <p className="login-sub" style={{ color: "var(--red)", marginBottom: 12 }}>
          {errorMessages[state.error]}
        </p>
      ) : null}
      <form action={formAction}>
        <div className="field">
          <div className="field-label">Email</div>
          <input className="input" type="email" name="email" autoFocus required />
        </div>
        <div className="field">
          <div className="field-label">
            Password
            <a href="/forgot-password" className="forgot">
              Forgot?
            </a>
          </div>
          <input
            className="input"
            type="password"
            name="password"
            placeholder="••••••••••••"
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", height: 38, justifyContent: "center", marginTop: 8 }}
          disabled={pending}
        >
          Sign in <Icon name="arrow" size={13} />
        </button>
      </form>
    </>
  );
}
