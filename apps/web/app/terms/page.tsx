import type { Metadata } from "next";
import Link from "next/link";
import { ContactLink, LEGAL_OPERATOR, LegalList, LegalPage, LegalSection } from "../legal-page";

export const metadata: Metadata = {
  title: "Terms of Service · LocalLink",
  description: "The terms for using the LocalLink beta.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={
        <p>
          These terms cover your use of LocalLink, a beta service run by {LEGAL_OPERATOR}, an
          individual developer (not a registered company). By signing in you agree to them.
          Questions: <ContactLink />.
        </p>
      }
    >
      <LegalSection title="Beta service">
        <p>
          LocalLink is in beta. Features may change or be removed, there may be bugs or downtime,
          and data could be lost. It is provided &quot;as is&quot;, without warranties of any kind.
          Don&apos;t rely on it for anything critical, and don&apos;t use it to expose production
          systems or sensitive data.
        </p>
      </LegalSection>

      <LegalSection title="Your account">
        <LegalList
          items={[
            "You sign in with Google or GitHub and are responsible for activity in your account.",
            "You must be at least 16, and old enough to agree to these terms where you live.",
            "If you use LocalLink for an organisation, you confirm you can accept these terms for it.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Your resources and keys">
        <p>
          You choose which local resources to expose and who receives an API key. Anyone holding a
          key can reach the resource it is scoped to, so keep keys and host tokens secret, give
          database resources a read-only or least-privilege user, and revoke keys you no longer
          need. The gateway forwards database queries as sent; it does not check or limit them. You
          are responsible for what your resources allow and return.
        </p>
      </LegalSection>

      <LegalSection title="Your content">
        <p>
          You keep ownership of your resources and the data they serve. You give LocalLink
          permission to store your settings and carry your traffic only to run the service for you.
          You confirm you have the right to expose the systems and data you connect. See the{" "}
          <Link href="/privacy" className="legal-link">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>Don&apos;t use LocalLink to:</p>
        <LegalList
          items={[
            "break the law or infringe anyone’s rights;",
            "expose systems or data you are not authorised to share, or get around an employer’s or network’s security policies;",
            "host or distribute malware, phishing pages, spam or other harmful content;",
            "run open proxies, or relay traffic to attack or scan other systems;",
            "attack, overload or try to get around LocalLink’s security or limits.",
          ]}
        />
        <p>Accounts or resources that break these rules may be suspended without notice.</p>
      </LegalSection>

      <LegalSection title="Liability">
        <p>
          To the extent the law allows, LocalLink and its operator are not liable for indirect or
          consequential losses, lost profits or lost data, or for any harm resulting from resources
          you expose or keys you share. While LocalLink is free, total liability for any claim is
          limited to the amount you paid for the service in the 12 months before it (currently
          nothing).
        </p>
      </LegalSection>

      <LegalSection title="Open source">
        <p>
          The LocalLink source code is available under the MIT License, which governs your use of
          the code itself. These terms apply to the hosted service.
        </p>
      </LegalSection>

      <LegalSection title="Ending your use">
        <p>
          You can stop using LocalLink at any time and ask for your data to be deleted. LocalLink
          may suspend or close accounts that break these terms, or end the beta, with reasonable
          notice where possible.
        </p>
      </LegalSection>

      <LegalSection title="Changes and governing law">
        <p>
          These terms may be updated during the beta; the date at the top shows the latest version,
          and continuing to use LocalLink means you accept it. These terms are governed by the laws
          of Pakistan.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
