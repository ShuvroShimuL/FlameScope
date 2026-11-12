import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { BRAND, exportName, pageTitle, readStored, writeStored } from "@/lib/brand";
import { LIBRARY_KEY } from "@/lib/evidence/client";

const ROOT = process.cwd();
const read = (f: string) => fs.readFileSync(path.join(ROOT, f), "utf8");

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/**
 * The only places the earlier product name may still appear in shipped code:
 * the brand module itself (it documents the legacy storage keys), and the dataset citation, which says the
 * dataset was first released under that name so older references still resolve.
 */
const ALLOWED_FILE = "lib/brand.ts";
const ALLOWED_PHRASE = /first released as Project HEARTH/g;

describe("one product identity", () => {
  it("names the product, its assistant and its team", () => {
    expect(BRAND.name).toBe("FlameScope");
    expect(BRAND.assistant.name).toBe("VESTA");
    expect(BRAND.team).toBe("Team Polaris");
    expect(JSON.parse(read("package.json")).name).toBe(BRAND.slug);
  });

  it("the earlier product name appears nowhere in the app outside the brand module", () => {
    const files = [...walk("app"), ...walk("components"), ...walk("lib"), ...walk("scripts/blueprint")].filter(
      (f) => /\.(ts|tsx|js|mjs|md|css|html|svg)$/.test(f) && f !== ALLOWED_FILE,
    );
    expect(files.length).toBeGreaterThan(100);
    const offenders = files.filter((f) => /hearth/i.test(read(f).replace(ALLOWED_PHRASE, "")));
    expect(offenders, "Use BRAND from lib/brand.ts instead of writing the name").toEqual([]);
  });

  it("no shipped file links to the earlier repository or deployment", () => {
    const files = [...walk("app"), ...walk("components"), ...walk("lib"), ...walk("scripts/blueprint")].filter((f) => /\.(ts|tsx|js|mjs|md|html)$/.test(f));
    const offenders = files.filter((f) => /mail6heatler|project-hearth-five\.vercel\.app/i.test(read(f)));
    expect(offenders).toEqual([]);
    expect(BRAND.urls.repoBlob.startsWith(BRAND.urls.repo)).toBe(true);
  });

  it("the browser title and download names come from the brand module", () => {
    expect(pageTitle("Dataset")).toBe("Dataset · FlameScope");
    expect(exportName("tests.json")).toBe("flamescope-tests.json");
    expect(read("app/api/dataset/[file]/route.ts")).toContain("exportName(params.file)");
  });
});

describe("the FlameScope flame", () => {
  const { path: flame, colors } = BRAND.logo;

  it("is one path, used by the header logo, the favicon and the Blueprint", () => {
    expect(read("components/ui/Logo.tsx")).toContain("BRAND.logo");
    for (const file of ["app/icon.svg", "scripts/blueprint/template.html"]) {
      const text = read(file);
      expect(text, file).toContain(flame);
      // Both the plain and the URL-encoded form of each colour count: the Blueprint favicon is a data URI.
      for (const c of [colors.flame, colors.tile, colors.line]) expect(text.includes(c) || text.includes(c.replace("#", "%23")), `${file} ${c}`).toBe(true);
    }
  });

  it("is the blue flame, not the earlier orange ring", () => {
    for (const file of ["app/icon.svg", "components/ui/Logo.tsx"]) {
      expect(read(file), file).not.toMatch(/FF7A2F|FFB98A|<circle/i);
    }
    // The flame keeps the proportions of the original mark: a 22-unit glyph centred on a 32 × 36 tile.
    expect(BRAND.logo.tile).toEqual({ width: 32, height: 36, radius: 3, glyph: 22 });
  });
});

describe("browser storage keys", () => {
  const g = globalThis as unknown as { window?: unknown };
  afterEach(() => {
    delete g.window;
  });

  function fakeStorage(seed: Record<string, string> = {}) {
    const data = new Map(Object.entries(seed));
    g.window = { localStorage: { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) } };
    return data;
  }

  it("uses the product's own prefix, and shares the saved-question key with the evidence engine", () => {
    for (const key of [BRAND.storage.prefs, BRAND.storage.tour, BRAND.storage.mapView, BRAND.storage.questions]) expect(key.startsWith(`${BRAND.slug}.`)).toBe(true);
    expect(BRAND.storage.questions).toBe(LIBRARY_KEY);
  });

  it("a visitor's choices saved under the earlier name carry over once", () => {
    const data = fakeStorage({ "hearth.prefs.v1": '{"level":"engineer"}' });
    expect(readStored(BRAND.storage.prefs)).toBe('{"level":"engineer"}');
    expect(data.get(BRAND.storage.prefs)).toBe('{"level":"engineer"}');
    // After that the new key wins, even if the old one changes.
    data.set("hearth.prefs.v1", '{"level":"student"}');
    expect(writeStored(BRAND.storage.prefs, '{"level":"researcher"}')).toBe(true);
    expect(readStored(BRAND.storage.prefs)).toBe('{"level":"researcher"}');
  });

  it("returns null, and never throws, when there is nothing stored or storage is blocked", () => {
    fakeStorage();
    expect(readStored(BRAND.storage.mapView)).toBeNull();
    g.window = { localStorage: { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } } };
    expect(readStored(BRAND.storage.prefs)).toBeNull();
    expect(writeStored(BRAND.storage.prefs, "x")).toBe(false);
  });
});
