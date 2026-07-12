import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/confirmed"],
    },
    sitemap: "https://deckroom.nyc/sitemap.xml",
  };
}
