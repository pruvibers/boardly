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
        <OnboardingSessionProvider>{children}</OnboardingSessionProvider>
      </body>
    </html>
  );
}
