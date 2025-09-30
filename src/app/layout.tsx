import "~/styles/globals.css";

import { type Metadata } from "next";
// import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/components/theme-provider";
import { OnboardingProvider } from "~/contexts/onboarding-context";

export const metadata: Metadata = {
  title: "Versailles App",
  description: "Une application pour Versailles",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

// const geist = Geist({
//   subsets: ["latin"],
//   variable: "--font-geist-sans",
// });

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr"
      suppressHydrationWarning
    // className={`${geist.variable}`}
    >
      <body className="bg-background">
        <TRPCReactProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <OnboardingProvider>
              {children}
            </OnboardingProvider>
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
