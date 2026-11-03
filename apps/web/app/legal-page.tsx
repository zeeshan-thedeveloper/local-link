import Link from "next/link";
import type { ReactNode } from "react";
import "./legal.css";

export const LEGAL_CONTACT_EMAIL = "zeeshanahmedd0010@gmail.com";
export const LEGAL_OPERATOR = "Zeeshan Ahmed";
export const LEGAL_LAST_UPDATED = "3 November 2026";

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="legal-section">
      <h2>{title}</h2>
      <div className="legal-body">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="legal-list">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export function ContactLink() {
  return (
    <a className="legal-link" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
      {LEGAL_CONTACT_EMAIL}
    </a>
  );
}

/** Shared frame for the Privacy Policy and Terms pages. */
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="legal-header-inner">
          <Link href="/" className="legal-brand" aria-label="LocalLink home">
            <span className="brand-mark" />
            <span>LocalLink</span>
          </Link>
          <nav className="legal-nav">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </div>
      </header>

      <article className="legal-article">
        <div className="legal-head">
          <p className="legal-updated">Last updated {LEGAL_LAST_UPDATED}</p>
          <h1>{title}</h1>
          <div className="legal-body">{intro}</div>
        </div>
        {children}
      </article>
    </div>
  );
}
