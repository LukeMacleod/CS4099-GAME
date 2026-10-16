/**
 * Gaelic Strings Loader
 *
 * Fetches the generated public/content/gaelic_strings.json bundle (built by
 * scripts/build-content.mjs from the studio's governed content store) and
 * serves Gaelic text to the rest of game.js by id.
 *
 * This follows the same preload-into-a-Map-on-construct pattern already used
 * by GiomachVoice and RuairidhVoice elsewhere in this codebase, so it sits
 * alongside AudioManager as one more thing GameFlowController owns.
 *
 * Deliberately NOT using an English fallback when a string is missing: FR1
 * (CLAUDE.md / dissertation) requires no English fallback in gameplay. A
 * missing id instead returns a visibly-broken placeholder and logs loudly,
 * so a missing wire-up fails a playtest instead of silently shipping English.
 *
 * Known constraint carried over from the existing audio system (see
 * Game Design Document, "Technical Implementation"): fetch() cannot read a
 * local file over the file:// protocol (CORS). This loader therefore only
 * works when the page is served over http(s) - exactly how it is already
 * deployed (Firebase Hosting) and how it should be run locally for testing,
 * e.g. `npx serve public` or `python3 -m http.server`, not by double-clicking
 * index.html.
 */

class GaelicStrings {
  constructor(url = './content/gaelic_strings.json') {
    this.url = url;
    this.strings = new Map();
    this.loaded = false;
    this.loadFailed = false;
    this.loadPromise = this.load();
  }

  async load() {
    try {
      const response = await fetch(this.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const bundle = await response.json();
      for (const [id, entry] of Object.entries(bundle.strings || {})) {
        this.strings.set(id, entry);
      }
      this.loaded = true;
      console.log(`[GaelicStrings] loaded ${this.strings.size} string(s) from ${this.url}`);
    } catch (err) {
      this.loadFailed = true;
      console.error(
        `[GaelicStrings] failed to load ${this.url}: ${err.message}. ` +
        `If you opened index.html directly (file://), serve it over http instead ` +
        `(e.g. "npx serve public"), or run scripts/build-content.mjs if the file is missing.`
      );
    }
    return this.loaded;
  }

  /**
   * Returns the Gaelic text for an id, or a visibly-broken placeholder if the
   * id is unknown or the bundle has not finished loading yet. Never falls
   * back to English (FR1).
   */
  get(id) {
    const entry = this.strings.get(id);
    if (entry) return entry.gaelic;

    console.warn(
      `[GaelicStrings] missing id "${id}"` +
      (this.loaded ? ' (not in public/content/gaelic_strings.json)' : ' (bundle not loaded yet)')
    );
    return `⟦${id}⟧`;
  }

  /** Returns the full row (gaelic, english_gloss, usage_context, ...) or null. */
  getEntry(id) {
    return this.strings.get(id) ?? null;
  }
}
