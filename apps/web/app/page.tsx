"use client";

import { useEffect } from "react";

import { useTheme } from "@/components/layout/ThemeProvider";

import "./landing.css";

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    document.body.classList.add("landing");

    return () => {
      document.body.classList.remove("landing");
    };
  }, []);

  useEffect(() => {
    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));

    const handleClick = (event: MouseEvent) => {
      const anchor = event.currentTarget as HTMLAnchorElement;
      const href = anchor.getAttribute("href");
      const id = href?.slice(1);
      if (!id) return;

      const el = document.getElementById(id);
      if (!el) return;

      event.preventDefault();
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 56,
        behavior: "smooth",
      });
    };

    anchors.forEach((anchor) => anchor.addEventListener("click", handleClick));

    return () => {
      anchors.forEach((anchor) => anchor.removeEventListener("click", handleClick));
    };
  }, []);

  useEffect(() => {
    const list = document.getElementById("l-live-list");
    if (!list) return;

    const samples = [
      { m: "POST", mc: "method-POST", p: "/r/pgmain/query", k: "ll_pk_8h2j", s: 200, sc: "sc-2xx" },
      { m: "GET", mc: "method-GET", p: "/r/redis/keys/user:1882", k: "ll_pk_8h2j", s: 200, sc: "sc-2xx" },
      { m: "POST", mc: "method-POST", p: "/r/llama/api/embeddings", k: "ll_sk_4xv9", s: 200, sc: "sc-2xx" },
      { m: "POST", mc: "method-POST", p: "/r/meili/indexes/docs/search", k: "ll_sk_4xv9", s: 200, sc: "sc-2xx" },
      { m: "POST", mc: "method-POST", p: "/r/pgmain/query", k: "ll_ci_n0vR", s: 200, sc: "sc-2xx" },
      { m: "DELETE", mc: "method-DELETE", p: "/r/redis/keys/cache:old", k: "ll_pk_8h2j", s: 200, sc: "sc-2xx" },
      { m: "POST", mc: "method-POST", p: "/r/llama/api/generate", k: "ll_pk_8h2j", s: 200, sc: "sc-2xx" },
      { m: "GET", mc: "method-GET", p: "/r/meili/indexes/docs/stats", k: "ll_sk_4xv9", s: 200, sc: "sc-2xx" },
      { m: "POST", mc: "method-POST", p: "/r/sdxl/prompt", k: "ll_sk_4xv9", s: 500, sc: "sc-5xx" },
      { m: "POST", mc: "method-POST", p: "/r/pgmain/query", k: "ll_pk_8h2j", s: 404, sc: "sc-4xx" },
    ];
    let i = 0;
    const pad = (n: number) => String(n).padStart(2, "0");
    const tick = () => {
      const sample = samples[i % samples.length]!;
      i++;
      const now = new Date();
      const time = pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
      const row = document.createElement("div");
      row.className = "l-live-row new";
      row.innerHTML =
        '<span class="t">' + time + '</span>' +
        '<span class="m ' + sample.mc + '">' + sample.m + '</span>' +
        '<span class="p">' + sample.p + '</span>' +
        '<span class="r">' + sample.k + '</span>' +
        '<span class="s ' + sample.sc + '">' + sample.s + '</span>';
      list.insertBefore(row, list.firstChild);
      window.setTimeout(() => row.classList.remove("new"), 320);
      while (list.children.length > 6) list.removeChild(list.lastChild as ChildNode);
    };

    const interval = window.setInterval(tick, 2400);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="landing" data-screen-label="01 Landing">
      {/* ============ NAV ============ */}
      <div className="l-nav-wrap">
        <nav className="l-nav">
          <a className="l-nav-brand" href="/">
            <span className="brand-mark"></span>
            <span>LocalLink</span>
            <span className="l-nav-version">v0.4.2</span>
          </a>
          <div className="l-nav-links">
            <a className="l-nav-link" href="#features">Features</a>
            <a className="l-nav-link" href="#quickstart">Quickstart</a>
            <a className="l-nav-link" href="https://github.com">Docs</a>
            <a className="l-nav-link" href="https://github.com">Changelog</a>
          </div>
          <div className="l-nav-cta">
            <button
              className="btn btn-ghost btn-sm l-theme-btn"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>
                </svg>
              )}
            </button>
            <a className="btn btn-ghost btn-sm" href="https://github.com" aria-label="View on GitHub">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12c0 5.3 3.4 9.8 8.2 11.4.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.3-.6-1.6.1-3.2 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.9.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6C20.6 21.8 24 17.3 24 12c0-6.6-5.4-12-12-12z"/></svg>
              <span>GitHub</span>
            </a>
            <a className="btn btn-primary btn-sm" href="/login">
              Open gateway
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </a>
          </div>
        </nav>
      </div>
      
      {/* ============ HERO ============ */}
      <div className="l-frame">
        <div className="l-container">
          <section className="l-hero">
            <div className="l-eyebrow">
              <span className="dot"></span>
              v0.4.2 <span className="sep">·</span> self-hosted <span className="sep">·</span> single-user <span className="sep">·</span> MIT
            </div>
      
            <h1 className="l-hero-title">
              Your local services,<br/>
              reachable on <span className="mono accent">https://</span>
            </h1>
      
            <p className="l-hero-sub">
              A self-hosted gateway that exposes the databases, AI models, and HTTP APIs running on your machine — through a secure tunnel, with scoped keys and per-request logs.
            </p>
      
            <div className="l-hero-cta">
              <a className="btn btn-primary" href="/login">
                Open gateway
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </a>
              <a className="btn btn-secondary" href="https://github.com">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12c0 5.3 3.4 9.8 8.2 11.4.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.3-.6-1.6.1-3.2 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.9.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6C20.6 21.8 24 17.3 24 12c0-6.6-5.4-12-12-12z"/></svg>
                View on GitHub
              </a>
            </div>
      
            <div className="l-hero-meta">
              <span>$ curl -fsSL get.locallink.dev | sh</span>
              <span className="sep">·</span>
              <span>no port forwarding</span>
              <span className="sep">·</span>
              <span>no cloud account</span>
            </div>
          </section>
      
          {/* ============ PRODUCT PREVIEW ============ */}
          <div className="l-preview">
            <div className="l-window">
              <div className="l-window-head">
                <div className="l-window-dots"><span></span><span></span><span></span></div>
                <div className="l-window-tab">
                  <span className="dot"></span>
                  gateway.kestrel.io
                </div>
                <div className="pull">tunnel · 14m 22s uptime</div>
              </div>
              <div className="l-preview-body">
                {/* LEFT: host agent terminal */}
                <div className="l-preview-left">
                  <p className="l-preview-label">
                    <span>Host agent</span>
                    <span className="badge">macbook-pro-m4</span>
                  </p>
                  <div className="l-term">
                    <div className="ln"><span className="prompt">$</span><span className="cmd">locallink up</span></div>
                    <div className="ln pad"><span className="arrow">→</span><span className="info">connecting to</span><span className="str">gateway.kestrel.io</span><span className="arrow">…</span></div>
                    <div className="ln pad"><span className="ok">✓</span><span className="info">tunnel established</span><span className="com">// WSS, AES-256-GCM</span></div>
                    <div className="ln"><span className="prompt">$</span><span className="cmd">locallink expose</span><span className="str">postgres-main</span><span className="flag">--port</span><span className="str">5432</span></div>
                    <div className="ln pad"><span className="ok">✓</span><span className="info">registered</span><span className="str">postgres-main</span><span className="com">// 2 keys</span></div>
                    <div className="ln"><span className="prompt">$</span><span className="cmd">locallink expose</span><span className="str">ollama-llama3</span><span className="flag">--port</span><span className="str">11434</span></div>
                    <div className="ln pad"><span className="ok">✓</span><span className="info">registered</span><span className="str">ollama-llama3</span><span className="com">// 1 key</span></div>
                    <div className="ln"><span className="prompt">$</span><span className="cmd">locallink status</span></div>
                    <div className="ln pad"><span className="info">3 resources</span><span className="arrow">·</span><span className="info">7 keys</span><span className="arrow">·</span><span className="ok">healthy</span></div>
                    <div className="ln"><span className="prompt">$</span><span className="caret"></span></div>
                  </div>
                </div>
      
                {/* RIGHT: live request stream */}
                <div className="l-preview-right">
                  <p className="l-preview-label">
                    <span>Live requests</span>
                    <span className="badge" id="l-live-count">last 6 · auto</span>
                  </p>
                  <div className="l-live-list" id="l-live-list">
                    <div className="l-live-row">
                      <span className="t">14:32:18</span>
                      <span className="m method-POST">POST</span>
                      <span className="p">/r/pgmain/query</span>
                      <span className="r">ll_pk_8h2j</span>
                      <span className="s sc-2xx">200</span>
                    </div>
                    <div className="l-live-row">
                      <span className="t">14:32:17</span>
                      <span className="m method-POST">POST</span>
                      <span className="p">/r/llama/api/generate</span>
                      <span className="r">ll_pk_8h2j</span>
                      <span className="s sc-2xx">200</span>
                    </div>
                    <div className="l-live-row">
                      <span className="t">14:32:15</span>
                      <span className="m method-GET">GET</span>
                      <span className="p">/r/redis/keys/session:9f2</span>
                      <span className="r">ll_pk_8h2j</span>
                      <span className="s sc-2xx">200</span>
                    </div>
                    <div className="l-live-row">
                      <span className="t">14:32:14</span>
                      <span className="m method-POST">POST</span>
                      <span className="p">/r/meili/indexes/docs/search</span>
                      <span className="r">ll_sk_4xv9</span>
                      <span className="s sc-2xx">200</span>
                    </div>
                    <div className="l-live-row">
                      <span className="t">14:32:13</span>
                      <span className="m method-POST">POST</span>
                      <span className="p">/r/pgmain/query</span>
                      <span className="r">ll_ci_n0vR</span>
                      <span className="s sc-4xx">401</span>
                    </div>
                    <div className="l-live-row">
                      <span className="t">14:32:12</span>
                      <span className="m method-POST">POST</span>
                      <span className="p">/r/pgmain/query</span>
                      <span className="r">ll_pk_8h2j</span>
                      <span className="s sc-2xx">200</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="l-preview-foot">
                <span className="stat"><span className="pulse"></span><span className="v">tunnel live</span></span>
                <span className="stat"><span className="k">requests/24h</span><span className="v">12,163</span></span>
                <span className="stat"><span className="k">p50 latency</span><span className="v">28ms</span></span>
                <span className="stat"><span className="k">resources</span><span className="v">6</span></span>
                <span className="stat" style={{ marginLeft: "auto" }}><span className="k">→</span><span className="v">gateway.kestrel.io</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ============ FEATURES ============ */}
      <section className="l-section" id="features">
        <div className="l-container">
          <div className="l-section-head">
            <p className="l-section-eyebrow">// What it does</p>
            <h2 className="l-section-title">A gateway, not a tunnel.</h2>
            <p className="l-section-sub">
              Ngrok gives you a URL. LocalLink gives you a URL plus the access control and observability you'd build around it anyway.
            </p>
          </div>
      
          <div className="l-feat-grid">
            {/* 1. Tunneling */}
            <div className="l-feat">
              <div className="l-feat-head">
                <div className="l-feat-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <h3>Secure tunneling</h3>
                <span className="l-feat-num">01</span>
              </div>
              <p>Host agent opens an outbound encrypted WebSocket to your gateway. No port forwarding, no firewall changes, no public IP needed.</p>
              <div className="l-feat-art">
                <div className="l-art-tunnel">
                  <div className="node">
                    <span className="glyph">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                    </span>
                    localhost
                  </div>
                  <div className="link">
                    <span className="lock">WSS · AES-256</span>
                  </div>
                  <div className="node" style={{ justifyContent: "flex-end" }}>
                    gateway
                    <span className="glyph">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>
      
            {/* 2. Resources */}
            <div className="l-feat">
              <div className="l-feat-head">
                <div className="l-feat-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/></svg>
                </div>
                <h3>Resource management</h3>
                <span className="l-feat-num">02</span>
              </div>
              <p>Register Postgres, Ollama, ComfyUI, or any HTTP service by name. Hot-reload on file save; URLs stay stable across restarts.</p>
              <div className="l-feat-art">
                <div className="l-art-resources">
                  <div className="l-art-res">
                    <span className="glyph db"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/></svg></span>
                    <span className="name">postgres-main</span>
                    <span className="type">database</span>
                    <span className="status"></span>
                  </div>
                  <div className="l-art-res">
                    <span className="glyph ai"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg></span>
                    <span className="name">ollama-llama3</span>
                    <span className="type">ai model</span>
                    <span className="status"></span>
                  </div>
                  <div className="l-art-res">
                    <span className="glyph http"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18"/></svg></span>
                    <span className="name">internal-api</span>
                    <span className="type">http</span>
                    <span className="status idle"></span>
                  </div>
                </div>
              </div>
            </div>
      
            {/* 3. Keys */}
            <div className="l-feat">
              <div className="l-feat-head">
                <div className="l-feat-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="3.5"/><path d="m10 13 8-8M16 3l4 4-2 2-4-4M14 7l3 3"/></svg>
                </div>
                <h3>Scoped API keys</h3>
                <span className="l-feat-num">03</span>
              </div>
              <p>Issue keys scoped to specific resources and methods. Revoke instantly — propagates to the host agent in &lt;100ms.</p>
              <div className="l-feat-art">
                <div className="l-art-key">
                  <span className="name">production</span>
                  <span className="tok">ll_pk_8h2jaQ7mB4nXc1vR••••</span>
                  <span className="scope">rw · pgmain</span>
                </div>
                <div className="l-art-key revoked">
                  <span className="name">ci-runner</span>
                  <span className="tok">ll_ci_n0vR8tKwL2sP3aZ••••</span>
                  <span className="revoke">revoked</span>
                </div>
              </div>
            </div>
      
            {/* 4. Logs */}
            <div className="l-feat">
              <div className="l-feat-head">
                <div className="l-feat-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <h3>Request observability</h3>
                <span className="l-feat-num">04</span>
              </div>
              <p>Every proxied request recorded: timestamp, method, path, status, latency, key. Filter, tail, export to your logging stack.</p>
              <div className="l-feat-art">
                <div className="l-art-logs">
                  <div className="l-art-log">
                    <span className="t">32:18</span><span className="m method-POST">POST</span><span className="p">/r/pgmain/query</span><span className="d sc-2xx">42ms</span>
                  </div>
                  <div className="l-art-log">
                    <span className="t">32:17</span><span className="m method-POST">POST</span><span className="p">/r/llama/api/generate</span><span className="d sc-2xx">1.84s</span>
                  </div>
                  <div className="l-art-log">
                    <span className="t">32:13</span><span className="m method-POST">POST</span><span className="p">/r/pgmain/query</span><span className="d sc-4xx">401</span>
                  </div>
                  <div className="l-art-log">
                    <span className="t">32:07</span><span className="m method-POST">POST</span><span className="p">/r/sdxl/prompt</span><span className="d sc-5xx">500</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============ QUICKSTART ============ */}
      <section className="l-section" id="quickstart" style={{ paddingTop: 0 }}>
        <div className="l-container">
          <div className="l-section-head">
            <p className="l-section-eyebrow">// 60 seconds</p>
            <h2 className="l-section-title">Get the agent running.</h2>
            <p className="l-section-sub">Three commands. The gateway runs on a $5 VPS (or your homelab); the agent runs on your laptop.</p>
          </div>
      
          <div className="l-quick-grid">
            <div className="l-quick">
              <div className="l-quick-step"><span className="num">01.</span>Install the agent</div>
              <h4>Single binary, Mac / Linux / WSL.</h4>
              <div className="l-quick-code">
                <span className="p">$</span>
                <span className="text">curl -fsSL get.locallink.dev | sh</span>
                <span className="cp" title="Copy"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>
              </div>
              <p className="l-quick-note">Installs <span className="mono">locallink</span> to <span className="mono">/usr/local/bin</span>.</p>
            </div>
      
            <div className="l-quick">
              <div className="l-quick-step"><span className="num">02.</span>Open the tunnel</div>
              <h4>Authenticate once, stays connected.</h4>
              <div className="l-quick-code">
                <span className="p">$</span>
                <span className="text">locallink login gateway.kestrel.io</span>
                <span className="cp" title="Copy"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>
              </div>
              <p className="l-quick-note">Opens an outbound WebSocket. No firewall rules to change.</p>
            </div>
      
            <div className="l-quick">
              <div className="l-quick-step"><span className="num">03.</span>Expose a resource</div>
              <h4>Name it, point at a port, you're live.</h4>
              <div className="l-quick-code">
                <span className="p">$</span>
                <span className="text">locallink expose postgres-dev --port 5432</span>
                <span className="cp" title="Copy"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>
              </div>
              <p className="l-quick-note">Reachable at <span className="mono">/r/postgres-dev</span> with an auto-generated key.</p>
            </div>
          </div>
      
          <div className="l-callout">
            <div className="l-callout-text">
              <h3>Already running an instance?</h3>
              <p>Open the gateway dashboard to manage resources, rotate keys, and tail the request log.</p>
            </div>
            <div className="l-callout-cta">
              <a className="btn btn-secondary" href="https://github.com">
                Read the docs
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/></svg>
              </a>
              <a className="btn btn-primary" href="/login">
                Open gateway
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============ FOOTER ============ */}
      <footer className="l-foot">
        <div className="l-foot-inner">
          <div className="l-foot-brand"><span className="brand-mark"></span>LocalLink</div>
          <span className="sep">·</span>
          <span>single-user instance</span>
          <span className="sep">·</span>
          <span>MIT licensed</span>
          <span className="sep">·</span>
          <a href="https://github.com">GitHub</a>
          <span className="sep">·</span>
          <a href="/login">Sign in</a>
          <div className="l-foot-meta">
            <span>build · 8h2j4a</span>
            <span>·</span>
            <span>v0.4.2 · 2026-05-12</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
