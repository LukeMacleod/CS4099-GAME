# Gaelic Games – Sprint Table (Corrected)

> **Corrections applied (see audit at bottom):**
> 1. "Debounce click handlers" → replaced with actual `isProcessing` boolean lock
> 2. "Fisher-Yates shuffle" → replaced with actual sort-based shuffle used in code
> 3. "Timer consistency bug fix (timestamp-based)" → removed; code uses plain `setInterval` decrement
> 4. "Cookie-based tutorial skip" → removed; localStorage noted only in comments, never implemented
> 5. "Service worker for offline caching (PWA)" → removed; no `sw.js` file exists
> 6. Commits `6bb14ec` (Game 3 Redesign) and `3235e3d` (music) moved from Sprint 4 to Sprint 3 (actual git dates: 25 Jan and 30 Jan respectively)
> 7. British spelling applied throughout

---

## TABLE 1 — December 2025

| Sprint | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|--------|-----|-----|-----|-----|-----|-----|-----|
|        | 1   | 2   | 3   | 4   | 5   | 6   | 7   |
|        | 8   | 9   | 10  | 11  | 12  | 13  | 14  |
|        | 15  | 16  | 17  | 18  | 19  | 20  | 21  |

---

### Sprint 0 (Week 1)
**Goal:** Environment setup, backlog derivation, Firebase config
**Deliverable:** Deployed skeleton

| Mon 22 | Tue 23 | Wed 24 | Thu 25 | Fri 26 | Sat 27 | Sun 28 |
|--------|--------|--------|--------|--------|--------|--------|
| **Sprint Planning** | **Dev Environment** | **Foundation Coding** | **Christmas Day** | **Sprint Review & Retro** | — | — |
| – Review GDD requirements | – Firebase project init (hosting) | – CSS custom properties for theming | *No work* | – Demo: Deployed webpage | | |
| – Derive product backlog items | – Configure `firebase.json` rewrites | – `GameFlowController` state machine | | – Review: All Sprint 0 goals met | | |
| – Plan architecture & file structure | – Set up version control (Git) | – Basic routing between game states | | – Retro: Firebase setup smoother than expected! | | |
| – Wireframe 3 game concepts | – Deploy skeleton app | – Sprite asset collection begins | | | | |
| – Research hex coordinate systems | – Implement P-code login (P-XX format) | **Decision:** Marine/coastal theme for Gaelic maritime vocabulary | | **Sprint 1 Planning** | | |
| **Decision:** Offset coordinates for hex grid | – Welcome screen with Ruairidh character | | | – Select Sprint 1 backlog items | | |
| | **Commits:** `50dab03`, `3317a04`, `a5aa367` | | | – Define DoD for Game 1 | | |

---

### Sprint 1 (Week 2)
**Goal:** Game 1 core mechanics (hex board, BFS pathfinding, rock placement)
**Deliverable:** Playable Game 1 prototype

| Mon 29 | Tue 30 | Wed 31 | Thu | Fri | Sat | Sun |
|--------|--------|--------|-----|-----|-----|-----|
| **Daily Standup** | **Daily Standup** | **Daily Standup** | — | — | — | — |
| *Last day:* Sprint planning | *Yesterday:* Hex grid foundation | *Yesterday:* BFS working | | | | |
| *Today:* Hex grid rendering | *Today:* Core pathfinding algorithm | *Today:* Animation & game loop | | | | |
| *Blockers:* None | *Blockers:* Hex rendering inconsistent in Safari/Chrome | *Blockers:* None | | | | |
| | | | | | | |
| – `HexGridSquare` class implementation | – Implement BFS escape algorithm | – Lobster hop animation along path | | | | |
| – 11×10 grid coordinate system | – Experiment with path visualisation (green highlighted hexes) | – Puingean & rock count UI (cairn visualisation) | | | | |
| – Rock placement click handlers | | – Gaelic instructions integrated | | | | |
| – Lobster sprite integration | **Bug Fix:** Switch to inline SVG hexagons (CSS `clip-path` rendered circles in Chrome) | | | | | |
| **Bug Fix:** Even/odd row neighbour calculation — separate offset arrays for even and odd rows | | **Bug Fix:** BFS boundary check moved to dequeue phase (not enqueue) to guarantee shortest path | | | | |

---

## TABLE 2 — January–February 2026

| Sprint | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|--------|-----|-----|-----|-----|-----|-----|-----|

---

### Sprint 1 (cont.)
**Goal:** Game 1 UI polish & Game 2 foundation
**Deliverable:** Complete Game 1 + Game 2 card system

| Mon | Tue | Wed | Thu 1 | Fri 2 | Sat 3 | Sun 4 |
|-----|-----|-----|-------|-------|-------|-------|
| — | — | — | **Daily Standup** | **Daily Standup** | **Sprint Review** | — |
| | | | *Yesterday:* Core loop complete | *Yesterday:* Game 1 polish | – Demo: Complete Game 1 playthrough | |
| | | | *Today:* Timer & tutorial systems | *Today:* Game 2 kickoff | – Demo: Game 2 card system prototype | |
| | | | *Blockers:* None | *Blockers:* None | – Review: Sprint goal achieved | |
| | | | | | | |
| | | | – Game 1 timer (240 s) with warnings | – Game 2 card grid layout (4×5) | **Note:** Testing a timed Game 1 mid-development is difficult — add a DEV skip button between games for now | |
| | | | – Tutorial overlay system (5 pre-game steps) | – Select 10 marine creature sprites | | |
| | | | – Help `?` button | – Card flip animation (CSS 3D `rotateY(180deg)` transform) | **Sprint Retrospective** | |
| | | | – Interval transition screen | – Sort-based shuffle: `[...arr, ...arr].sort(() => Math.random() - 0.5)` | *What went well:* BFS implementation solid, hex grid stable | |
| | | | | – Matching logic (2-card selection state via `flipped` Set) | *What to improve:* Tutorial text too wordy — try separating into more steps | |
| | | | | | *Action items:* Reduce tutorial load in Sprint 3 | |

---

### Sprint 2 (Weeks 4–5)
**Goal:** Complete Game 2 mechanics & UI, internal testing
**Deliverable:** Fully functional Game 2 with scoring

| Mon 5 | Tue 6 | Wed 7 | Thu 8 | Fri 9 | Sat 10 | Sun 11 |
|-------|-------|-------|-------|-------|--------|--------|
| **Sprint Planning** | **Daily Standup** | **Daily Standup** | **Daily Standup** | **Daily Standup** | — | — |
| – Select Sprint 2 backlog items | *Yesterday:* Sprint planning | *Yesterday:* Core matching complete | *Yesterday:* Game 2 polish | *Yesterday:* Game 3 design complete | | |
| – Story point estimates | *Today:* Game 2 core logic | *Today:* Polish | *Today:* Transitions & testing | *Today:* Core Game 3 implementation | | |
| – Define DoD for Game 2 | *Blockers:* None | *Blockers:* Card flip performance on test device was very slow | *Blockers:* None | *Blockers:* None | | |
| | | | | | | |
| **Daily Standup** | – Game 2 tutorial (3 steps) | – Visual feedback (green glow on match) | – Build Interval 2 screen | – Canvas rendering system (60 FPS via `requestAnimationFrame`) | | |
| | – Match validation logic | – Lock matched cards (stay face-up) | – Progress indicator (Game 1 ✓, Game 2 ✓, Game 3 →) | – Falling object physics (constant velocity) | | |
| | – Score calculation system | – Preload SVGs (eliminate flip flicker) | – Audio narration for intervals | – AABB collision detection (hitbox padding for transparent SVG margins) | | |
| | – Completion detection (all 10 pairs matched) | – Prevent third-card selection via `isProcessing` boolean lock | – Internal testing session | – Points system (fish +1, garbage −2) | | |
| | | **Optimisation:** `will-change: transform` for card flip animations | | **Bug Fix:** Hitbox padding adjusted: `paddingSize = Math.max(5, Math.min(15, fishSize * 0.05))` to account for transparent SVG margins | | |
| | **Bug Fix:** Added `setTimeout` delay before cards flip back — also required blocking a third-card click during validation via `isProcessing` flag | | | **Decision:** Canvas over SVG for Game 3 — better performance with 20+ simultaneous falling objects | | |

---

### Sprint 2 (cont.)
**Goal:** Game 3 core loop & audio system
**Deliverable:** Playable Game 3 + centralised audio

| Mon 12 | Tue 13 | Wed 14 | Thu 15 | Fri 16 | Sat 17 | Sun 18 |
|--------|--------|--------|--------|--------|--------|--------|
| **Daily Standup** | **Daily Standup** | **Daily Standup** | **Daily Standup** | **Sprint Review** | — | — |
| *Yesterday:* Game 3 collision working | *Yesterday:* Touch controls implemented | *Yesterday:* Results screen complete | *Yesterday:* Audio system integrated | – Demo: Complete 3-game playthrough | | |
| *Today:* Tutorial & touch controls | *Today:* Timer & results | *Today:* Audio system overhaul | *Today:* Help & responsive design | – Demo: Audio system & help modals | | |
| *Blockers:* None | *Blockers:* None | *Blockers:* None | *Blockers:* Audio crossfade glitches in Firefox | – Review: Sprint goal exceeded | | |
| | | | | | | |
| – Game 3 tutorial overlays | – Game 3 timer (180 s) with warnings | – `AudioManager` class (centralised control) | – Context-sensitive help modals | **Sprint Retrospective** | | |
| – Touch controls for tablets (`touchmove` events) | – End sequence → Results transition | – State-based music playback (8 tracks) | – Vocabulary reference tables | *What went well:* Canvas performance excellent, audio system robust | | |
| – Difficulty ramping (spawn rate increases with `elapsedTime`) | – Results screen (total score + per-game breakdown) | – Sound effect library | – Help usage tracking (research data) | *What to improve:* Need pilot testing feedback | | |
| – Object variety system (20+ fish types) | **Optimisation:** Offscreen canvas for static background layer | – Audio preloading system | – Responsive design passes (iPad Mini/Pro) | *Action items:* Schedule pilot test early Sprint 3 | | |
| | | – Mute toggle button | **Fix:** Fallback to instant audio switch in Firefox (crossfade unreliable) | | | |
| | | **Bug Fix:** iOS audio context requires a user gesture to start — unlocked on first button click | | | | |

---

### Sprint 3 (Weeks 6–7)
**Goal:** Gaelic integration, cultural authenticity, testing & refinement
**Deliverable:** Evaluation-ready artefact

| Mon 19 | Tue 20 | Wed 21 | Thu 22 | Fri 23 | Sat 24 | Sun 25 |
|--------|--------|--------|--------|--------|--------|--------|
| **Sprint Planning** | **Daily Standup** | **Daily Standup** | **Pilot Testing** | **Daily Standup** | — | *(Weekend commit)* |
| – Select Sprint 3 backlog items | *Yesterday:* Testing identified issues | *Yesterday:* Deployed to production | | *Yesterday:* Pilot test complete | | `6bb14ec` — Game 3 Complete Redesign (committed Sun 25 Jan) |
| – Story point estimates | *Today:* Asset organisation & deployment | *Today:* Bug fixes & error handling | | *Today:* Implement feedback | | |
| – Define evaluation-readiness criteria | *Blockers:* Some 404s on asset paths | *Blockers:* None | | *Blockers:* None | | |
| | | | | | | |
| **Daily Standup** | – Organise SVGs into `public/svgs/*` structure | – Final bug fixes (BFS edge cases) | – User testing with 5 participants | – Simplify tutorial text (5 → 3 steps) | | |
| – Cross-browser testing (Chrome, Safari, Firefox) | – Update all file paths in `game.js` | – Audio loading error handling | – Observe gameplay sessions | – Visual-only tutorial option | | |
| – Device testing (physical iPads, MacBook) | – Deploy to Firebase hosting | – Firebase auth fallback logic | – Collect usability feedback | – Tutorial skip button (in-session only, not persisted) | | |
| – Performance profiling | – Verify live site with P-codes | – Loading screen with progress indicator | – Identify confusion points | – Animated cues in tutorials | | |
| **Fix:** Safari `clip-path` → inline SVG hexagons | **Commit:** `35d6a5f` — Deploy complete game with SVG assets | – Session timeout handling (30 min idle) | | – Re-test with 2 users (positive results) | | |
| | **Commit:** `b12c4b4` — Fix cache headers | **Commit:** `f798f4d` — Update game.js | **Feedback Summary:** | | | |
| | | | ✅ Games engaging, audio helpful | | | |
| | | | ⚠️ Tutorial too wordy | | | |
| | | | ⚠️ Basket too sensitive on touch | | | |
| | | | ⚠️ No visual feedback for garbage | | | |
| | | | ⚠️ Users want replay option | | | |

---

### Sprint 3 (cont.)
**Goal:** Final polish based on pilot feedback
**Deliverable:** Refined evaluation-ready build

| Mon 26 | Tue 27 | Wed 28 | Thu 29 | Fri 30 | Sat 31 | |
|--------|--------|--------|--------|--------|--------|--|
| **Daily Standup** | **Daily Standup** | **Daily Standup** | **Daily Standup** | **Sprint Review** | — | |
| *Yesterday:* Tutorial improvements + Game 3 redesign (weekend commit `6bb14ec`) | *Yesterday:* UX improvements complete | *Yesterday:* Session features complete | *Yesterday:* Optimisation complete | | | |
| *Today:* Touch sensitivity & visual feedback | *Today:* Replay & session management | *Today:* Performance optimisation | *Today:* Documentation & release prep | | | |
| *Blockers:* None | *Blockers:* None | *Blockers:* None | *Blockers:* None | | | |
| | | | | | | |
| – Integrate `6bb14ec` changes (larger basket, bigger falling objects, parallax background, improved garbage visuals, algae/seaweed SVGs) | – "Play Again" button on Results screen | – Code cleanup (remove dead code) | – JSDoc comments for all major functions | – Demo: Complete refined playthrough | | |
| – Settings modal (gear icon) | – Game reset logic (preserves P-code) | – SVG file size optimisation | – Code section headers in `game.js` | – Demo: Settings, replay | | |
| – Touch sensitivity slider (low/med/high) | – Session management (play count, total time) | – Lazy-load audio files | – Version number system (v1.0.0) | – Review: Evaluation-ready achieved | | |
| – Visual feedback for garbage catches (red flash + screen shake) | – Logout functionality | | – README with deployment instructions | | | |
| – Points change animations (fly up/down) | – P-code persistence for current session | | | **Sprint Retrospective** | | |
| | | | | *What went well:* Pilot testing caught critical UX issues, performance gains significant | | |
| | | | | *What to improve:* Earlier user testing in future projects | | |
| | | | | *Action items:* Sprint 4 — final Gaelic audio recordings | | |
| | | | | **Commit:** `3235e3d` — Update game files, reorganise assets, and add music | | |

---

### Sprint 4 (Week 8)
**Goal:** Gaelic audio recording integration & final deployment
**Deliverable:** Production v1.0.0

| Mon (Feb 2) | Tue (Feb 3) | Wed (Feb 4) | Thu (Feb 5) | Fri (Feb 6) | Sat | Sun |
|-------------|-------------|-------------|-------------|-------------|-----|-----|
| **Sprint Planning** | **Daily Standup** | **Daily Standup** | **Daily Standup** | **Final Deployment** | — | — |
| – Select Sprint 4 backlog items | *Yesterday:* Sprint planning | *Yesterday:* Audio recordings complete | *Yesterday:* Audio integrated | | | |
| – Story point estimates | *Today:* Record Gaelic narration | *Today:* Integrate recordings | *Today:* Final smoke test & deployment | | | |
| – Define v1.0.0 release criteria | *Blockers:* None | *Blockers:* None | *Blockers:* None | | | |
| | | | | | | |
| | – Record Gaelic narration (all tutorial tracks) | – Integrate new audio recordings into `public/music/` | – Full playthrough smoke test (login → 3 games → results) | – Final smoke test (complete playthrough) | | |
| | – Record vocabulary pronunciation (21 fish + creatures) | – Replace placeholder audio | – Volume balancing across all game states | – Deploy to production Firebase | | |
| | – Record game instructions | – Test audio timing with gameplay | – Verify audio on classroom speakers | – Git tag: `v1.0.0` | | |
| | | | | – Live URL verification | | |
| | | | | | | |
| | | | | **Sprint Review & Retrospective** | | |
| | | | | – Demo: Production-ready v1.0.0 | | |
| | | | | – Review: All sprint goals met | | |
| | | | | – Handover documentation complete | | |

---

## Corrections Audit Log

| # | Location | Original (Incorrect) | Corrected | Evidence |
|---|----------|----------------------|-----------|----------|
| 1 | Sprint 2, Tue 6 Jan | "Debounce click handlers" | "Prevent third-card selection via `isProcessing` boolean lock" | `game.js` line 1679, 1745 — no debounce function exists anywhere |
| 2 | Sprint 1 cont., Fri 2 Jan | "Fisher-Yates shuffle algorithm" | "Sort-based shuffle: `[...arr, ...arr].sort(() => Math.random() - 0.5)`" | `game.js` line 1699 — Fisher-Yates uses in-place index swapping; this code does not |
| 3 | Sprint 1 cont., Thu 1 Jan | "Bug Fix: Ensure timer consistency (I had to switch to timestamp-based)" | Removed | `game.js` lines 2092–2095 — both timers use plain `setInterval` with `this.timeRemaining--`; `Date.now()` is used only for spawn timing |
| 4 | Sprint 3, Fri 23 Jan | "Tutorial skip button (cookie-based)" | "Tutorial skip button (in-session only, not persisted)" | `game.js` lines 99, 459 — localStorage noted only in comments, never implemented |
| 5 | Sprint 3 cont., Wed 28 Jan | "Service worker for offline caching (PWA)" | Removed | No `sw.js` file exists; no `caches` API or service worker registration anywhere in project |
| 6 | Sprint 4, Wed 4 Feb | "Commit: `3235e3d` — Add music files" | Moved to Sprint 3, Fri 30 Jan | `git log` confirms `3235e3d` date: **30 Jan 2026 (Friday)** |
| 7 | Sprint 4, Thu 5 Feb | "Commit: `6bb14ec` — Game 3 Complete Redesign" + associated tasks | Moved to Sprint 3 (weekend Sun 25 Jan, integrated Mon 26 Jan) | `git log` confirms `6bb14ec` date: **25 Jan 2026 (Sunday)** |
| 8 | Throughout | American spellings (organize, centralized, optimization, etc.) | British spellings (organise, centralised, optimisation, etc.) | British English standard applied |
