/**
 * The one source of product identity: names, wording, links, export file names, browser storage keys and
 * the logo. Change any of them here and nowhere else. tests/brand.test.ts fails if the old product name
 * comes back anywhere in the app outside this file.
 *
 * Not here: the names of NASA investigations, documents and citations. Those are sources, not branding.
 */

const REPO = "https://github.com/ShuvroShimuL/FlameScope";

export const BRAND = {
  name: "FlameScope",
  /** Lower-case form for file names, storage keys and package names. */
  slug: "flamescope",
  tagline: "Fire-safety evidence for crewed habitats",
  description: "Fire-safety evidence for crewed habitats, built on NASA microgravity combustion data.",
  /** One sentence on what the product does, shown in the hero and on the About page. */
  summary:
    "summarises, ranks and interprets NASA microgravity combustion experiments to give fire-safety insights for crewed habitats",
  team: "Team Polaris",
  event: "NASA Space Apps Challenge 2026",
  challenge: "Flame in Freefall: AI-Powered Fire Safety Insights from Microgravity Combustion Data",
  disclaimer: "FlameScope is an independent student project for the NASA Space Apps Challenge 2026 and is not endorsed by NASA.",

  assistant: {
    name: "VESTA",
    expansion: "Virtual Engineer for Space-fire Threat Assessment",
  },

  urls: {
    repo: REPO,
    /** Prefix for links to a file in the repository. */
    repoBlob: `${REPO}/blob/main/`,
  },

  /** Prefix of every file the app lets you download. */
  exportPrefix: "flamescope-",

  /**
   * Browser storage keys. `legacy` are the keys the app used when it was called HEARTH: readStored() falls
   * back to them once, so a returning visitor keeps their mission, engine, level, tour and map choices.
   */
  storage: {
    prefs: "flamescope.prefs.v1",
    tour: "flamescope.tour.v1",
    mapView: "flamescope.map.view",
    questions: "flamescope.questions.v1",
    legacy: {
      "flamescope.prefs.v1": "hearth.prefs.v1",
      "flamescope.tour.v1": "hearth.tour.v1",
      "flamescope.map.view": "hearth.map.view",
    } as Record<string, string>,
  },

  /**
   * The FlameScope flame: the mark from the original FlameScope home page (web/index.html, commit c1bce11),
   * in the blue treatment of its themed workspace (web/workspace.css, commit 96eb2b7). The path is unchanged.
   * The app is dark, so these are that stylesheet's dark-theme values.
   */
  logo: {
    /** The glyph's own 24 × 24 box. The flame occupies x 8–16, y 4.4–17.8. */
    glyphBox: 24,
    path: "M12.4 4.4c.2 2-.8 3.3-1.9 4.5-1.2 1.3-2.5 2.6-2.5 4.9a4 4 0 0 0 8 0c0-1.6-.6-2.8-1.4-3.8-.1 1.1-.6 2-1.5 2.3.5-2.8-.2-5.9-.7-7.9Z",
    /** The tile the flame sits on: 32 wide, 36 tall, corner radius 3, with a 22-unit glyph centred in it. */
    tile: { width: 32, height: 36, radius: 3, glyph: 22 },
    colors: { flame: "#8cb6ff", tile: "#1b2943", line: "#435e88" },
  },
} as const;

/** Browser title for a page: "Dataset · FlameScope". */
export const pageTitle = (page: string) => `${page} · ${BRAND.name}`;

/** Download name for an exported file: "flamescope-tests.json". */
export const exportName = (file: string) => `${BRAND.exportPrefix}${file}`;

/**
 * Reads a stored value, falling back once to the key the app used under its old name and copying it across.
 * Storage can be blocked or throw; the app then simply starts from its defaults.
 */
export function readStored(key: string): string | null {
  try {
    const value = window.localStorage.getItem(key);
    if (value !== null) return value;
    const legacy = BRAND.storage.legacy[key];
    const old = legacy ? window.localStorage.getItem(legacy) : null;
    if (old !== null) window.localStorage.setItem(key, old);
    return old;
  } catch {
    return null;
  }
}

/** Writes a stored value. Returns false when storage is blocked or full. */
export function writeStored(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
