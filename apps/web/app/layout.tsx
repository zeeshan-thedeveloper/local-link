import type { Metadata } from "next";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { getCurrentUser } from "@/lib/gateway";
import "./globals.css";

export const dynamic = "force-dynamic";

const googleAnalyticsMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-QESW32M7RG";

export const metadata: Metadata = {
  title: "LocalLink",
  description: "Personal API gateway for local resources",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <GoogleAnalytics measurementId={googleAnalyticsMeasurementId} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function() {
            try {
              var t = localStorage.getItem('ll-theme') || 'dark';
              document.documentElement.setAttribute('data-theme', t);
            } catch (e) {}
          })();
        `,
          }}
        />
        <ThemeProvider>
          <AppShell currentUser={currentUser}>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
