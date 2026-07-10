// Documents and links store user-entered URLs; only allow schemes that can't
// execute script when rendered as an href (blocks javascript:/data: etc.).
const SAFE_SCHEMES = ["http:", "https:", "mailto:", "tel:"];

export function safeHref(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (SAFE_SCHEMES.includes(parsed.protocol)) return trimmed;
  } catch {
    // No scheme — treat as a bare domain like "drive.google.com/..."
    if (/^[\w.-]+\.[a-z]{2,}([/?#]|$)/i.test(trimmed)) return `https://${trimmed}`;
  }
  return "#";
}
