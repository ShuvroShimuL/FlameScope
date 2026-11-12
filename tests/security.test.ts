import { beforeEach, describe, expect, it } from "vitest";
import { POST as calcPOST } from "@/app/api/calc/route";
import { POST as vestaPOST } from "@/app/api/vesta/route";
import { crossSite, sameSecret } from "@/lib/api";
import { clearVestaCache } from "@/lib/vesta/router";
import nextConfig, { SECURITY_HEADERS } from "../next.config.mjs";

const request = (headers: Record<string, string>, url = "https://flamescope.example/api/vesta") => new Request(url, { method: "POST", headers });

beforeEach(() => clearVestaCache());

describe("cross-site requests", () => {
  it("lets this site's own pages and non-browser callers through", () => {
    expect(crossSite(request({ host: "flamescope.example", origin: "https://flamescope.example" }))).toBe(false);
    expect(crossSite(request({ host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" }, "http://127.0.0.1:3000/api/vesta"))).toBe(false);
    expect(crossSite(request({ host: "FlameScope.Example", origin: "https://flamescope.example" }))).toBe(false);
    // No Origin: curl, the eval runner, another server. Not a browser being tricked.
    expect(crossSite(request({ host: "flamescope.example" }))).toBe(false);
  });

  it("refuses another site, another port, a sandboxed frame and a malformed origin", () => {
    expect(crossSite(request({ host: "flamescope.example", origin: "https://evil.example" }))).toBe(true);
    expect(crossSite(request({ host: "127.0.0.1:3000", origin: "http://127.0.0.1:8080" }, "http://127.0.0.1:3000/api/vesta"))).toBe(true);
    expect(crossSite(request({ host: "flamescope.example", origin: "null" }))).toBe(true);
    expect(crossSite(request({ host: "flamescope.example", origin: "not a url" }))).toBe(true);
  });

  it("does not claim to stop DNS rebinding: a page that reaches the server under its own name is same-site to it", () => {
    // The original FlameScope server also kept a list of its own host names. A hosted Next.js app has no such
    // list, so this case passes the check. It is recorded here so the limit is visible, not assumed away.
    expect(crossSite(request({ host: "attacker.example", origin: "http://attacker.example" }, "http://attacker.example/api/vesta"))).toBe(false);
  });

  const body = JSON.stringify({ messages: [{ role: "user", content: "help" }], engine: "offline" });
  const vesta = (headers: Record<string, string>) =>
    vestaPOST(new Request("http://127.0.0.1:3000/api/vesta", { method: "POST", headers: { "content-type": "application/json", ...headers }, body }));

  it("/api/vesta refuses a cross-site POST before reading it, and still answers its own pages", async () => {
    const refused = await vesta({ host: "127.0.0.1:3000", origin: "https://evil.example", "x-forwarded-for": "7.7.7.1" });
    expect(refused.status).toBe(403);
    expect((await refused.json()).error).toBe("cross-site request refused");
    expect(refused.headers.get("cache-control")).toBe("no-store");

    // A text/plain body is how a cross-site form or fetch avoids a preflight. It is refused the same way.
    const plain = await vestaPOST(
      new Request("http://127.0.0.1:3000/api/vesta", { method: "POST", headers: { host: "127.0.0.1:3000", origin: "https://evil.example", "content-type": "text/plain" }, body }),
    );
    expect(plain.status).toBe(403);

    const own = await vesta({ host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", "x-forwarded-for": "7.7.7.2" });
    expect(own.status).toBe(200);
    expect(await own.text()).toContain("event: done");
    const tool = await vesta({ host: "127.0.0.1:3000", "x-forwarded-for": "7.7.7.3" });
    expect(tool.status).toBe(200);
    await tool.text();
  });

  it("/api/calc refuses a cross-site POST too", async () => {
    const res = await calcPOST(
      new Request("http://127.0.0.1:3000/api/calc", { method: "POST", headers: { host: "127.0.0.1:3000", origin: "https://evil.example" }, body: JSON.stringify({ o2_pct: 21, pressure_psi: 14.7 }) }),
    );
    expect(res.status).toBe(403);
  });
});

describe("secrets", () => {
  it("compares a presented token in constant time and never matches a missing or shorter one", () => {
    expect(sameSecret("a-long-eval-token-0001", "a-long-eval-token-0001")).toBe(true);
    expect(sameSecret("a-long-eval-token-0001", "a-long-eval-token-0002")).toBe(false);
    expect(sameSecret("a-long-eval-token-0001", "a-long-eval-token")).toBe(false);
    expect(sameSecret("a-long-eval-token-0001", "")).toBe(false);
    expect(sameSecret("a-long-eval-token-0001", null)).toBe(false);
  });
});

describe("response headers", () => {
  it("every path gets the headers that stop framing, sniffing and referrer leaks", async () => {
    const rules = await nextConfig.headers!();
    expect(rules).toEqual([{ source: "/:path*", headers: SECURITY_HEADERS }]);
    const h = Object.fromEntries(SECURITY_HEADERS.map((x) => [x.key, x.value]));
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("the policy leaves script and style sources alone, because the framework needs inline ones", () => {
    const csp = SECURITY_HEADERS.find((x) => x.key === "Content-Security-Policy")!.value;
    expect(csp).not.toMatch(/script-src|style-src|default-src/);
  });
});
