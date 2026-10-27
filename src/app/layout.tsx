import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { isCurrentUserAdmin } from "@/lib/auth/admin";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Happy Feet Home | Program dashboard", template: "%s | Happy Feet Home" },
  description: "Happy Feet Home program dashboard for beneficiaries, daycare attendance, hospital sessions, and assessments.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const isAdmin = await isCurrentUserAdmin();

  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="sr-only z-50 rounded-lg bg-card px-4 py-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
        <Navbar isAdmin={isAdmin} />
        <main id="main-content" tabIndex={-1} className="mx-auto min-h-[70vh] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        <footer className="mx-auto max-w-7xl border-t border-border px-4 py-5 text-xs text-muted-foreground sm:px-6 lg:px-8">Happy Feet Home · Pre-KC2 practice dashboard</footer>
      </body>
    </html>
  );
}
