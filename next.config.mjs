// Files read from disk at runtime are not seen by the bundler, so each route that needs them lists them here.
// A key matches every route whose path contains it.
const EVIDENCE_DATA = ["./data/evidence/*.csv", "./data/evidence/*.json"];

/**
 * Headers every response carries. They are the ones that cannot break the app: no script-src or style-src,
 * because the App Router ships inline scripts and the components use inline styles, and a nonce-based policy
 * would force every page to render on demand. What is here stops other sites from framing the app, stops
 * content-type sniffing, and keeps the full address out of cross-site referrers.
 */
export const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  experimental: {
    outputFileTracingIncludes: {
      // The VESTA system prompt, and the evidence rows behind VESTA's will_it_burn tool.
      "/api/vesta": ["./lib/vesta/system-prompt.md", ...EVIDENCE_DATA],
      // The evidence engine reads its committed source rows (lib/evidence/files.mjs). The Will it burn? routes use
      // it directly, and the safety audit quotes its counts, so every API route carries the files.
      "/api": EVIDENCE_DATA,
    },
  },
};

export default nextConfig;
