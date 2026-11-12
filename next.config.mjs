// Files read from disk at runtime are not seen by the bundler, so each route that needs them lists them here.
// A key matches every route whose path contains it.
const EVIDENCE_DATA = ["./data/evidence/*.csv", "./data/evidence/*.json"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      // The VESTA system prompt, and the evidence rows behind VESTA's will_it_burn tool.
      "/api/vesta": ["./lib/vesta/system-prompt.md", ...EVIDENCE_DATA],
      // The Will it burn? routes: the evidence engine reads its committed source rows (lib/evidence/files.mjs).
      "/api/burn": EVIDENCE_DATA,
    },
  },
};

export default nextConfig;
