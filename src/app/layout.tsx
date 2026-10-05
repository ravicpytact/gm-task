import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { APP_NAME, APP_TAGLINE } from "@/config/constants";
import { Providers } from "@/lib/query/providers";
import { accentIconHref } from "@/lib/stores/appearance";
import { readAccent } from "@/lib/stores/appearance.server";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });

// Icons come from `pnpm icons` (public/). The tab icon follows this device's accent theme; the
// .ico (old browsers) and the home-screen icon are saved once by the device, so they stay brand.
export async function generateMetadata(): Promise<Metadata> {
  const accent = await readAccent();
  return {
    title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
    description: APP_TAGLINE,
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: accentIconHref(accent), type: "image/svg+xml" },
      ],
      apple: { url: "/icons/apple-icon.png", sizes: "180x180" },
    },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const accent = await readAccent();
  return (
    // The accent theme comes from a cookie; next-themes adds the mode class before paint
    // (hence suppressHydrationWarning on <html> only).
    <html
      lang="en"
      data-accent={accent}
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <Providers initialAccent={accent}>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
