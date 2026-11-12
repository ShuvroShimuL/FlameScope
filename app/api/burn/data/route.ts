import { json } from "@/lib/api";
import { burnData } from "@/lib/burn";

export const runtime = "nodejs";
export const dynamic = "force-static";

/**
 * The tables behind the Will it burn? page, loaded once: every acrylic row with its source location, the
 * ranked findings, NASA's quoted fire-response steps with the evidence for each, and the provenance records.
 * All of it is committed data, so the response is built once at build time.
 */
export function GET() {
  return json(burnData());
}
