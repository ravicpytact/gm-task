import type { MetadataRoute } from "next";
import { APP_NAME, APP_TAGLINE } from "@/config/constants";

// The web app manifest: name and icons when TaskDesk is added to a phone's home screen.
// Icons are rendered from src/app/icon.svg by `pnpm icons`.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_TAGLINE,
    start_url: "/todos",
    display: "standalone",
    // waiver FE-UI-001: the manifest is read by the browser and OS, not CSS; tokens can't reach it (expires 2027-10-05)
    background_color: "#F8FAFC",
    // waiver FE-UI-001: same: the brand indigo of the default theme, as hex (expires 2027-10-05)
    theme_color: "#4F46E5",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
