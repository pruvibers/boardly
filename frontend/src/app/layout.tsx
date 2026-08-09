import type { Metadata } from "next";
import { OnboardingSessionProvider } from "@/components/onboarding-session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boardly | Secure onboarding workspace",
  description: "Local-first AI onboarding copilot for secure employee setup.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-[var(--boardly-ink)] px-4 py-2.5 text-sm font-semibold text-white transition-transform focus:translate-y-0"
        >
          Skip to main content
        </a>
        <OnboardingSessionProvider>{children}</OnboardingSessionProvider>
      </body>
    </html>
  );
}
