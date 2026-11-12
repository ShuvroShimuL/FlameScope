import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export function json(data: unknown, init: { status?: number; cache?: boolean } = {}) {
  return NextResponse.json(data, {
    status: init.status ?? 200,
    headers:
      init.cache === false
        ? { "Cache-Control": "no-store" }
        : { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
  });
}

export function apiError(message: string, status = 400) {
  return json({ error: message }, { status, cache: false });
}

/**
 * True when a browser on another site sent this request. A browser always sends Origin with a cross-origin
 * POST, so an Origin that names another host means the request did not come from this site's own pages.
 * A request with no Origin (curl, the eval runner, another server) is not a browser being tricked, and passes.
 * This is the check the original FlameScope server made on its one POST route.
 */
export function crossSite(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (origin === null) return false;
  try {
    const host = req.headers.get("host") ?? new URL(req.url).host;
    return new URL(origin).host.toLowerCase() !== host.toLowerCase();
  } catch {
    // "null" (a sandboxed frame or a local file) and anything unparseable is not this site.
    return true;
  }
}

/** Compares a secret with a presented value without leaking, through timing, how much of it matched. */
export function sameSecret(expected: string, presented: string | null): boolean {
  if (presented === null) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(presented);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function numParam(sp: URLSearchParams, key: string): number | undefined {
  const v = sp.get(key);
  if (v == null || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
