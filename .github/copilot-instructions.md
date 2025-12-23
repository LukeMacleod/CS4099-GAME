<!-- .github/copilot-instructions.md: Guidance for AI coding agents working on this repo -->
# Copilot instructions — CS4099-GAME

Purpose
- Short: Make agent contributions quick and predictable for this small static game landing site.

Big picture
- This repository is a minimal static site: the landing page is `index.html` and styling is in `game.css`.
- The landing page links to `game.html` (not present). Expect the interactive game logic and assets to live alongside `index.html` (root) or in a `src/` or `public/` subfolder if added.

Key files and examples
- [index.html](index.html#L1-L40): simple HTML structure, title in `.title-wrapper` and a primary action link `.play-button` that navigates to `game.html`.
- [game.css](game.css#L1-L200): contains all styling and animations. Notable selectors: `.title-float`, `.title-color-pulse`, `.play-button`, `@keyframes title-float`, and `@keyframes water-glide`.

Project-specific conventions
- Single-file styling: styling is colocated in `game.css` rather than a build pipeline. Preserve selector names and exported animations when changing visual behaviour.
- Accessibility: the `.play-button` intentionally uses `:focus-visible` and large hit target sizes. Keep keyboard focus styles and `aria-label` on interactive links.
- Naming: CSS uses descriptive, BEM-adjacent names (e.g., `title-wrapper`, `title-float`) — follow that explicit, readable naming instead of single-letter utilities.

Build / run / debug
- There is no build tool. To preview locally run a static server from the repo root, e.g.:
  - `python -m http.server 8000` and open `http://localhost:8000`
  - or use the editor's Live Server extension.
- Use browser DevTools for DOM/CSS tweaks; edit `game.css` and reload to iterate. There are no tests or linters configured.

Integration points / missing pieces
- `index.html` links to `game.html` — if adding game logic, create `game.html` and place JS under `js/` or in `src/` and reference it from `game.html`.
- If adding images or fonts, add an `assets/` or `public/` folder and update paths in `index.html` and `game.css`.

Editing guidance for agents
- Keep changes minimal and focused: alter only files required by a change (preserve visual spacing and existing CSS ordering).
- When modifying animations or color tokens, update both the rule and any related `@keyframes` in `game.css` to avoid visual regressions.
- Preserve accessibility features: do not remove `:focus-visible` rules or `aria-` attributes on interactive elements.

If you need more context
- The repo is intentionally small. If `game.html`, JS, or assets are missing, ask the human: where should interactive game code and assets live (root, `src/`, or `public/`)?

Next steps for contributors
- Add `game.html` and a `js/` folder for game logic if implementing gameplay.
- Consider adding a short README with run/preview instructions if the project grows.

Request for reviewer
- Tell me if you'd like this file to include preferred directory layout (e.g., `src/`, `assets/`), or CI/build commands to scaffold for bundlers.
