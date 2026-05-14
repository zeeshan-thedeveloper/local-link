import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="login-brand" style={{ borderBottom: "none", padding: 0 }}>
            <span className="brand-mark" />
            LocalLink
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/login" className="btn btn-secondary" style={{ height: 34, padding: "0 16px" }}>
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-badge">Personal API Gateway</div>
        <h1 className="landing-headline">
          Connect your local resources<br />
          <span className="landing-headline-accent">to the world, securely.</span>
        </h1>
        <p className="landing-sub">
          LocalLink gives you a private gateway to expose databases, AI models, and HTTP APIs
          through a single authenticated endpoint — with built-in tunneling, access control, and observability.
        </p>
        <div className="landing-cta">
          <Link href="/login" className="btn btn-primary" style={{ height: 40, padding: "0 24px", fontSize: 14 }}>
            Open gateway →
          </Link>
          <a
            href="https://github.com/zeewingstudy/locallink"
            className="btn btn-secondary"
            style={{ height: 40, padding: "0 24px", fontSize: 14 }}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </div>
      </section>

      <section className="landing-features">
        <FeatureCard
          icon="tunnel"
          title="Secure Tunneling"
          description="Host agents connect your local services through an encrypted WebSocket tunnel. No port forwarding or VPN required."
        />
        <FeatureCard
          icon="resources"
          title="Resource Management"
          description="Register databases, AI models, and HTTP APIs as named resources. Route requests by name, not by IP or port."
        />
        <FeatureCard
          icon="keys"
          title="API Key Access Control"
          description="Generate scoped API keys for clients. Revoke access instantly without touching your local services."
        />
        <FeatureCard
          icon="logs"
          title="Request Observability"
          description="Every request is logged with timing, status, and payload details. Understand usage patterns at a glance."
        />
      </section>

      <footer className="landing-footer">
        <span style={{ color: "var(--text-4)" }}>LocalLink — single-user instance</span>
        <Link href="/login" style={{ color: "var(--text-3)", textDecoration: "none", fontSize: 13 }}>
          Sign in →
        </Link>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="landing-feature-card">
      <div className="landing-feature-icon">
        <FeatureIcon name={icon} />
      </div>
      <div className="landing-feature-title">{title}</div>
      <div className="landing-feature-desc">{description}</div>
    </div>
  );
}

function FeatureIcon({ name }: { name: string }) {
  if (name === "tunnel") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    );
  }
  if (name === "resources") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
      </svg>
    );
  }
  if (name === "keys") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7.5" cy="15.5" r="5.5"/>
        <path d="M21 2l-9.6 9.6M15.5 7.5l3 3"/>
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}
