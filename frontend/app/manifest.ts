import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const name = process.env.NEXT_PUBLIC_APP_NAME ?? "Portland Gas Operations";

  return {
    name,
    short_name: "Portland Gas",
    description: "Internal ERP platform for Portland Gas Limited",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F8F7FA",
    theme_color: "#1C043B",
    orientation: "any",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
