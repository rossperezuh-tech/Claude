import type { MetadataRoute } from "next";

const BASE = "https://deckroom.nyc";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/book/greenpoint`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/book/manhattan`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/learn-to-dj-nyc`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/dj-practice-space-brooklyn`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
