import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Schibsted_Grotesk } from "next/font/google";
import { ThemeScript } from "@/components/theme/theme-script";
import { ToastProvider } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { bs } from "@/lib/i18n/bs";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  display: "swap",
});

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: bs.site.name,
    template: `%s | ${bs.site.name}`,
  },
  description: bs.site.description,
};

export const viewport: Viewport = {
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="bs"
      suppressHydrationWarning
      className={cn(fraunces.variable, schibsted.variable, jetbrains.variable, "antialiased")}
    >
      <head>
        <ThemeScript />
      </head>
      <body suppressHydrationWarning className="flex min-h-dvh flex-col bg-papir font-sans text-body text-tinta">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
