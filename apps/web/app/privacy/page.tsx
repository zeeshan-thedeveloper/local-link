import type { Metadata } from "next";
import { ContactLink, LEGAL_OPERATOR, LegalList, LegalPage, LegalSection } from "../legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy · LocalLink",
  description: "What data LocalLink collects, why, and the choices you have.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          LocalLink is a beta service run by {LEGAL_OPERATOR}, an individual developer (not a
          registered company). This policy explains what data LocalLink handles when you use the
          dashboard, run the <code>locallink</code> host daemon, and when clients call your
          resources through the gateway. Questions or requests: <ContactLink />.
        </p>
      }
    >
      <LegalSection title="Data we collect about you">
        <LegalList
          items={[
            <>
              <strong>Account details</strong> from Google or GitHub when you sign in: your name,
              email address and profile picture URL.
            </>,
            <>
              <strong>Session data</strong>: a session token, and the IP address and browser user
              agent of the session, used to keep you signed in and to spot misuse.
            </>,
            <>
              <strong>Resource settings</strong> you enter in the dashboard: resource names, types
              and slugs, and the local address of each resource, such as an HTTP URL or a database
              connection string. Use a dedicated, least-privilege database user for any connection
              string you add.
            </>,
            <>
              <strong>Host tokens and API keys</strong>. Only a hash and a short prefix of each are
              stored; the full value is shown to you once and can&apos;t be recovered.
            </>,
            <>
              <strong>Request logs</strong> for every request proxied through the gateway: time,
              method, path, status code, latency and which API key was used.
            </>,
            <>
              <strong>Analytics</strong>: the LocalLink website uses Google Analytics to understand
              which pages are used. It sets Google Analytics cookies in your browser.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Traffic through the tunnel">
        <p>
          When a client calls one of your resources, the request and the response pass through the
          gateway and the tunnel to your host daemon. The gateway handles this traffic in memory to
          deliver it and does not store request or response bodies, such as query results or page
          content. Only the log fields listed above are saved.
        </p>
        <p>
          You decide what you expose and who gets a key, so you are responsible for the data your
          resources return and for telling anyone whose data is involved. LocalLink processes this
          traffic on your behalf.
        </p>
      </LegalSection>

      <LegalSection title="How the data is used">
        <LegalList
          items={[
            "To sign you in and keep your session active.",
            "To connect your host daemon, check API keys and route requests to your resources.",
            "To show you resources, connected hosts and request logs in the dashboard.",
            "To keep the service secure, investigate abuse and fix problems.",
          ]}
        />
        <p>LocalLink does not sell your data or use it for advertising.</p>
      </LegalSection>

      <LegalSection title="Who else handles it">
        <p>
          LocalLink runs on third-party infrastructure: web hosting for the dashboard (Vercel), a
          server for the gateway (DigitalOcean) and a managed database. Sign-in goes through Google
          or GitHub. Google provides analytics. Each of these only receives what it needs to do its
          job.
        </p>
      </LegalSection>

      <LegalSection title="How long it is kept">
        <p>
          Your account, resources and keys are kept while you use LocalLink. Deleting a resource
          deletes its keys and request logs. Ask for deletion at any time and your account,
          resources, keys and logs will be deleted, except where the law requires keeping something.
        </p>
      </LegalSection>

      <LegalSection title="Your choices and rights">
        <p>
          You can ask for a copy of your data, ask for it to be corrected or deleted, or object to
          how it is used, by emailing <ContactLink />. You can block analytics cookies in your
          browser settings. If you are in the EU or UK, you can also complain to your local data
          protection authority.
        </p>
      </LegalSection>

      <LegalSection title="Self-hosted instances">
        <p>
          LocalLink is open source. If you run your own gateway, this policy doesn&apos;t apply to
          it: you control that instance and its data.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          LocalLink is not meant for anyone under 16, and we don&apos;t knowingly collect their
          data.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          LocalLink is in beta and this policy may change as the product does. The date at the top
          shows the latest version; significant changes will be announced in the dashboard or by
          email.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
