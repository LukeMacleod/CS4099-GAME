/* ===========================================================================
 * Scotling V2 — Art-direction Spike B ("Deep Harbour")
 * Role 12, visual-brand-designer. 16 October 2026.
 *
 * Canvas 2D, 2.5D. Depth layers + lighting + particles + a hub carousel.
 * No dependencies. No webfonts. No network. No raster assets. No trackers.
 *
 * >>> GAELIC PENDING NATIVE-SPEAKER REVIEW <<<
 * Every Gaelic string below is retrieved from an attested source and carries
 * its URL. Nothing here is model-written Gaelic and nothing here is certified.
 * Mirrored as PENDING rows in
 *   ~/scotling-studio/studio/content/pending/visual-brand-designer-site-rows.json
 * =========================================================================== */
'use strict';

/* ---------------------------------------------------------------- 1. DATA */

/* ---------------------------------------------------------------------------
 * NO GAELIC STRING LIVES IN THIS FILE.
 *
 * The product repo's CLAUDE.md is explicit: "No Gaelic string lives in code;
 * strings come from the studio's gaelic_strings.json through the content
 * pipeline, every one PENDING native-speaker review." The production pipeline
 * (scripts/build-content.mjs) correctly EXCLUDES PENDING rows, because nothing
 * unverified may reach a child (constitution 4.1, 7.7.4) - so a review spike
 * cannot be fed by it. This page therefore loads its Gaelic from
 * gaelic-pending.json, which is generated from the studio's PENDING rows and
 * is the only place the strings exist here.
 *
 * If that file fails to load, the page renders ENGLISH ONLY. It never falls
 * back to an unreviewed Gaelic string baked into the script, which is the
 * failure mode the rule exists to prevent.
 * ------------------------------------------------------------------------- */

var GAELIC = Object.create(null);        /* srcId -> {gaelic, english_gloss} */

function gdOf(srcId) {
  var r = srcId && GAELIC[srcId];
  return r && r.gaelic ? r.gaelic : null;
}
function glossOf(srcId) {
  var r = srcId && GAELIC[srcId];
  return r && r.english_gloss ? r.english_gloss : null;
}

/* Cards. `en` is the English game NAME and is English, so it lives here.
   `srcId` points at the PENDING row that carries the Gaelic title; a card
   whose srcId is null has no attested Gaelic title yet and keeps its English
   placeholder, per the directive. Do NOT invent one. */
var CARDS = [
  { id: 'g1', srcId: 'VBD-002', en: 'Trap the Lobster',
    src: 'Dissertation p.39 (GDD); shipped in v1',
    tint: '#1D6FA8', art: 'lobster', status: 'in v1' },

  { id: 'g2', srcId: 'VBD-003', en: 'As alike as two herring',
    src: 'LearnGaelic Dictionary; dissertation p.39, p.103',
    tint: '#2C7F8F', art: 'herring', status: 'in v1' },

  { id: 'g3', srcId: 'VBD-004', en: 'As fast as a salmon',
    src: 'Dissertation p.105; shipped in v1',
    tint: '#15567F', art: 'salmon', status: 'in v1' },

  { id: 'g4', srcId: null, en: 'Ferry Run',
    src: "Concept from Pilot 1 children (dissertation p.59, Theme 2)",
    tint: '#1A6A86', art: 'ferry', status: 'concept' },

  { id: 'g5', srcId: null, en: 'Peat Road',
    src: "Concept from Pilot 1 children (dissertation p.59, Theme 2)",
    tint: '#4C6B4A', art: 'peat', status: 'concept' },

  { id: 'g6', srcId: null, en: 'Pipe Rhythm',
    src: "Concept from Pilot 1 children (dissertation p.59, Theme 2)",
    tint: '#5B4A86', art: 'pipes', status: 'concept' },

  { id: 'g7', srcId: 'VBD-005',
    en: 'Cairn Builder \u2014 a big cairn is made from small stones',
    src: 'Nicolson & Macintosh 1882 p.334; dissertation p.47',
    tint: '#6B5B46', art: 'cairn', status: 'concept' },

  { id: 'g8', srcId: null, en: 'Tweed Weaver',
    src: 'Indexical element, dissertation p.38 (Harris Tweed Act)',
    tint: '#7A5B3C', art: 'tweed', status: 'concept' }
];

/* Rotating strapline. Gaelic by srcId; the English line below it is the
   gloss from the same PENDING row. */
var PROVERBS = [
  { srcId: 'VBD-001', en: 'Gaelic Games',
    src: 'Welcome screen, dissertation p.98 (GDD); shipped in v1' },
  { srcId: 'VBD-006', en: 'The lobster, herring and the seal: the three jewels of the sea',
    src: "Dissertation p.97, citing Faclair na G\u00e0idhlig / Am Faclair Beag" },
  { srcId: 'VBD-005', en: 'A big cairn is made from small stones',
    src: 'Nicolson & Macintosh 1882 p.334; dissertation p.47' },
  { srcId: 'VBD-020', en: 'In Spring, when the sheep are lean, the shell-fish will be fat',
    src: 'MacDonald, T. D. 1926, No. 510; dissertation p.97' }
];

/* Ruairidh's ambient pragmatic idioms. Short, no reading comprehension
   required - the dissertation's own rationale (p.48). Gaelic AND gloss both
   come from the PENDING rows; with no rows loaded, Ruairidh says nothing. */
var SEAL_SRC_IDS = ['VBD-013', 'VBD-016', 'VBD-014', 'VBD-015', 'VBD-017',
                    'VBD-012', 'VBD-018', 'VBD-011', 'VBD-010'];

function sealLines() {
  var out = [], i;
  for (i = 0; i < SEAL_SRC_IDS.length; i++) {
    var g = gdOf(SEAL_SRC_IDS[i]);
    if (g) out.push({ gd: g, en: glossOf(SEAL_SRC_IDS[i]) || '' });
  }
  return out;
}

var BRAND = {
  saltire:   '#185FA5',
  deep:      '#0E3C6B',
  night:     '#06243F',
  gold:      '#E8B33A',
  gold2:     '#F7D27A',
  foam:      '#EAF4FA',
  paper:     '#F4F7FA'
};

var FONT_DISPLAY = '"Avenir Next","Segoe UI Semibold","Noto Sans",Cantarell,' +
                   '-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif';
var FONT_UI = '-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",' +
              '"Liberation Sans",Roboto,Cantarell,"Helvetica Neue",Arial,sans-serif';

/* ------------------------------------------------------------- 2. CONTEXT */

var stage  = document.getElementById('stage');
var canvas = document.getElementById('scene');
var ctx = null;
try { ctx = canvas.getContext('2d', { alpha: false }); } catch (e) { ctx = null; }

if (!ctx) {
  document.body.classList.add('no-canvas');
}

var W = 0, H = 0, DPR = 1;

function resize() {
  if (!ctx) return;
  var r = stage.getBoundingClientRect();
  DPR = Math.min(window.devicePixelRatio || 1,
                 S.tier >= 3 ? 2 : (S.tier >= 2 ? 1.5 : 1));
  W = Math.max(320, Math.round(r.width));
  H = Math.max(240, Math.round(r.height));
  canvas.width  = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  buildStatics();
  S.dirty = true;
}

/* --------------------------------------------------------------- 3. STATE */

var reduceMotion = false;
try {
  reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
} catch (e) { reduceMotion = false; }

var S = {
  t: 0,                 // seconds
  pos: 0,               // carousel position, a float card index
  vel: 0,               // cards per second
  dragging: false,
  lastX: 0,
  pointer: { x: 0.5, y: 0.5 },  // 0..1, drives parallax
  tier: 3,              // 0 static .. 3 high
  tierMode: 'auto',
  fps: 0,
  lowStreak: 0,
  critStreak: 0,
  spray: true,
  midges: true,
  rain: false,
  rainAmount: 0,
  selected: 0,
  dirty: true,
  frozen: false,
  sealLine: 0,
  sealT: 0
};

/* Conservative device sniff. Used only to pick a STARTING tier — the real
   decision is the frame-rate watchdog below, which is what a school
   Chromebook will actually trip. */
function initialTier() {
  if (reduceMotion) return 0;
  var cores = navigator.hardwareConcurrency || 4;
  var mem = navigator.deviceMemory || 4;
  if (cores <= 2 || mem <= 2) return 1;
  if (cores <= 4 || mem <= 4) return 2;
  return 3;
}
S.tier = initialTier();

/* ----------------------------------------------------- 4. CACHED STATICS */

var horizonY = 0, seaTop = 0;
var ridgeFar = [], ridgeMid = [], skerries = [], grass = [];

/* Deterministic pseudo-random so the coastline is the same every reload —
   an art direction has to be reproducible for review. */
function rng(seed) {
  var s = seed >>> 0;
  return function () {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}

function ridgeline(seed, n, amp, base) {
  var r = rng(seed), pts = [], i;
  for (i = 0; i <= n; i++) {
    var f = i / n;
    var h = (Math.sin(f * 7.3 + seed) * 0.35 + Math.sin(f * 2.1 + seed * 2) * 0.5 +
             r() * 0.5) * amp;
    pts.push({ x: f, y: base - h });
  }
  return pts;
}

function buildStatics() {
  horizonY = Math.round(H * 0.44);
  seaTop = horizonY;

  ridgeFar = ridgeline(1337, 26, H * 0.145, horizonY + 2);
  ridgeMid = ridgeline(90210, 20, H * 0.092, horizonY + 6);

  var r = rng(555), i;
  skerries = [];
  for (i = 0; i < 7; i++) {
    skerries.push({
      x: r(),
      d: 0.12 + r() * 0.72,          // depth 0 far .. 1 near
      w: 0.025 + r() * 0.055,
      phase: r() * Math.PI * 2
    });
  }

  var g = rng(4242);
  grass = [];
  for (i = 0; i < 90; i++) {
    grass.push({
      x: g(),
      h: 0.035 + g() * 0.085,
      lean: (g() - 0.5) * 0.5,
      phase: g() * Math.PI * 2,
      seedHead: g() > 0.72
    });
  }
}

/* --------------------------------------------------------- 5. SCENE PAINT */

function sunPos() {
  /* Low golden-hour sun, slightly right of centre. Parallax-free: it is at
     optical infinity, which is what sells the depth of everything else. */
  return { x: W * 0.68, y: horizonY - H * 0.035 };
}

function px(depth) {
  /* Parallax offset in px for a layer at `depth` (0 = infinity, 1 = nose). */
  return (S.pointer.x - 0.5) * depth * W * 0.055 +
         Math.sin(S.pos * 0.78) * depth * 12;
}
function py(depth) {
  return (S.pointer.y - 0.5) * depth * H * 0.022;
}

function paintSky() {
  var g = ctx.createLinearGradient(0, 0, 0, horizonY + H * 0.04);
  g.addColorStop(0.00, '#07234A');
  g.addColorStop(0.34, '#14538C');
  g.addColorStop(0.64, '#3E8BBD');
  g.addColorStop(0.86, '#9BCBE2');
  g.addColorStop(1.00, '#F4CE94');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, horizonY + H * 0.04);

  var s = sunPos();

  /* sun bloom */
  var r = Math.min(W, H) * 0.42;
  var bg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
  bg.addColorStop(0.00, 'rgba(255,233,186,0.82)');
  bg.addColorStop(0.22, 'rgba(246,196,120,0.34)');
  bg.addColorStop(0.62, 'rgba(240,170,96,0.10)');
  bg.addColorStop(1.00, 'rgba(240,170,96,0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, horizonY + H * 0.06);

  /* disc */
  ctx.beginPath();
  ctx.arc(s.x, s.y, Math.max(9, H * 0.021), 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,245,218,0.95)';
  ctx.fill();

  /* volumetric shafts — tier 3 only, they are the most expensive thing here */
  if (S.tier >= 3) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(s.x, s.y);
    for (var i = 0; i < 5; i++) {
      var a = -1.9 + i * 0.42 + Math.sin(S.t * 0.07 + i) * 0.035;
      var wdt = (0.022 + i * 0.009);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a - wdt) * H * 1.5, Math.sin(a - wdt) * H * 1.5);
      ctx.lineTo(Math.cos(a + wdt) * H * 1.5, Math.sin(a + wdt) * H * 1.5);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,226,170,0.021)';
      ctx.fill();
    }
    ctx.restore();
  }

  /* a few gulls, far — cheap, and they read as scale */
  if (S.tier >= 2) {
    ctx.strokeStyle = 'rgba(12,38,62,0.35)';
    ctx.lineWidth = 1.4;
    for (var k = 0; k < 5; k++) {
      var gx = ((S.t * (5 + k * 2) + k * 400) % (W + 160)) - 80 + px(0.1);
      var gy = horizonY - H * (0.16 + k * 0.035) + Math.sin(S.t * 0.9 + k) * 4 + py(0.1);
      var sw = 5 + k;
      ctx.beginPath();
      ctx.moveTo(gx - sw, gy);
      ctx.quadraticCurveTo(gx - sw * 0.4, gy - sw * 0.6, gx, gy - sw * 0.1);
      ctx.quadraticCurveTo(gx + sw * 0.4, gy - sw * 0.6, gx + sw, gy);
      ctx.stroke();
    }
  }
}

function paintRidge(pts, depth, fill, hazeAlpha) {
  var ox = px(depth), oy = py(depth);
  ctx.beginPath();
  ctx.moveTo(-40 + ox, horizonY + 20);
  for (var i = 0; i < pts.length; i++) {
    ctx.lineTo(pts[i].x * (W + 80) - 40 + ox, pts[i].y + oy);
  }
  ctx.lineTo(W + 40 + ox, horizonY + 20);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  /* atmospheric haze at the foot of the ridge */
  var hg = ctx.createLinearGradient(0, horizonY - H * 0.10, 0, horizonY + 4);
  hg.addColorStop(0, 'rgba(216,234,245,0)');
  hg.addColorStop(1, 'rgba(216,234,245,' + hazeAlpha + ')');
  ctx.fillStyle = hg;
  ctx.fill();
}

function paintLighthouse() {
  var depth = 0.3;
  var x = W * 0.885 + px(depth);
  var baseY = horizonY + 2 + py(depth);
  var h = H * 0.125, w = Math.max(10, H * 0.024);

  ctx.save();
  /* the skerry it stands on, plus its foam collar — without this it reads
     as a pole floating at the horizon */
  ctx.fillStyle = '#102C44';
  ctx.beginPath();
  ctx.moveTo(x - w * 3.4, baseY + h * 0.07);
  ctx.quadraticCurveTo(x - w * 1.6, baseY - h * 0.17, x, baseY - h * 0.12);
  ctx.quadraticCurveTo(x + w * 1.8, baseY - h * 0.16, x + w * 3.4, baseY + h * 0.07);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(234,244,250,0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, baseY + h * 0.07, w * 3.6, h * 0.05, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#E9F1F6';
  ctx.beginPath();
  ctx.moveTo(x - w * 0.62, baseY);
  ctx.lineTo(x - w * 0.42, baseY - h);
  ctx.lineTo(x + w * 0.42, baseY - h);
  ctx.lineTo(x + w * 0.62, baseY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#C6473E';
  ctx.fillRect(x - w * 0.56, baseY - h * 0.34, w * 1.12, h * 0.1);
  ctx.fillRect(x - w * 0.5,  baseY - h * 0.66, w * 1.0,  h * 0.1);

  /* lamp room + a slow sweep */
  ctx.fillStyle = BRAND.gold;
  ctx.fillRect(x - w * 0.5, baseY - h - h * 0.14, w * 1.0, h * 0.14);

  var beam = (Math.sin(S.t * 0.6) + 1) / 2;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.10 + beam * 0.16;
  var lg = ctx.createRadialGradient(x, baseY - h, 0, x, baseY - h, H * 0.3);
  lg.addColorStop(0, 'rgba(255,236,185,0.8)');
  lg.addColorStop(1, 'rgba(255,236,185,0)');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.arc(x, baseY - h, H * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function paintSea() {
  var g = ctx.createLinearGradient(0, seaTop, 0, H);
  g.addColorStop(0.00, '#3A86AD');
  g.addColorStop(0.16, '#1D5E8E');
  g.addColorStop(0.55, '#10426C');
  g.addColorStop(1.00, BRAND.night);
  ctx.fillStyle = g;
  ctx.fillRect(0, seaTop, W, H - seaTop);

  var s = sunPos();
  var depthPx = H - seaTop;

  /* sun glitter path: brightest near the horizon, spreading as it nears us */
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  var bands = S.tier >= 3 ? 46 : (S.tier >= 2 ? 28 : 16);
  for (var i = 0; i < bands; i++) {
    var f = i / bands;                       // 0 horizon .. 1 near
    var y = seaTop + Math.pow(f, 1.7) * depthPx;
    var spread = W * (0.015 + f * 0.26);
    var dashes = S.tier >= 3 ? 7 : 4;
    for (var d = 0; d < dashes; d++) {
      var jitter = Math.sin(i * 12.9898 + d * 78.233) * 43758.5453;
      jitter = jitter - Math.floor(jitter);
      var gx = s.x + (jitter - 0.5) * spread * 2;
      var sway = Math.sin(S.t * (0.7 + f) + i * 0.6 + d) * (2 + f * 9);
      var len = (3 + f * 26) * (0.5 + jitter);
      var a = (0.30 - f * 0.2) * (0.45 + jitter * 0.55);
      if (a <= 0.01) continue;
      ctx.strokeStyle = 'rgba(255,224,170,' + a.toFixed(3) + ')';
      ctx.lineWidth = 1 + f * 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(gx + sway - len / 2, y);
      ctx.lineTo(gx + sway + len / 2, y);
      ctx.stroke();
    }
  }
  ctx.restore();

  /* swell lines: cool rim light, the counterpoint to the warm glitter */
  var lines = S.tier >= 3 ? 34 : (S.tier >= 2 ? 22 : 12);
  for (var j = 0; j < lines; j++) {
    var ff = j / lines;
    var yy = seaTop + Math.pow(ff, 1.8) * depthPx + 2;
    var amp = 1 + ff * 7;
    var alpha = 0.05 + ff * 0.17;
    ctx.strokeStyle = 'rgba(176,222,243,' + alpha.toFixed(3) + ')';
    ctx.lineWidth = 0.8 + ff * 2.2;
    ctx.beginPath();
    var step = S.tier >= 3 ? 26 : 52;
    for (var x = -20; x <= W + 20; x += step) {
      var yv = yy + Math.sin((x / (90 + ff * 220)) + S.t * (0.5 + ff * 0.9) + j) * amp;
      if (x === -20) ctx.moveTo(x, yv); else ctx.lineTo(x, yv);
    }
    ctx.stroke();
  }
}

function paintSkerries() {
  for (var i = 0; i < skerries.length; i++) {
    var sk = skerries[i];
    var depth = 0.25 + sk.d * 0.5;
    var y = seaTop + Math.pow(sk.d, 1.8) * (H - seaTop) * 0.72;
    var x = sk.x * W + px(depth);
    var w = sk.w * W * (0.5 + sk.d);
    var h = w * 0.42;

    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(x - w * 0.45, y - h * 1.5, x - w * 0.05, y - h * 0.8);
    ctx.quadraticCurveTo(x + w * 0.4, y - h * 1.7, x + w, y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(14,46,72,' + (0.55 + sk.d * 0.4).toFixed(2) + ')';
    ctx.fill();

    /* foam collar */
    var fo = 0.22 + 0.2 * (Math.sin(S.t * 1.3 + sk.phase) + 1) / 2;
    ctx.strokeStyle = 'rgba(234,244,250,' + fo.toFixed(3) + ')';
    ctx.lineWidth = 1 + sk.d * 2.5;
    ctx.beginPath();
    ctx.ellipse(x, y + 1, w * 1.25, h * 0.26, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function paintForeground() {
  var depth = 0.95;
  var ox = px(depth), oy = py(depth);
  var baseY = H + 6 + oy;

  /* dark machair bank */
  ctx.beginPath();
  ctx.moveTo(-40, H + 10);
  ctx.lineTo(-40, H * 0.955 + oy);
  for (var x = -40; x <= W + 40; x += 36) {
    ctx.lineTo(x + ox * 0.2, H * (0.955 + Math.sin(x * 0.012) * 0.012) + oy);
  }
  ctx.lineTo(W + 40, H + 10);
  ctx.closePath();
  ctx.fillStyle = '#071B2D';
  ctx.fill();

  /* grass tufts, silhouetted */
  ctx.strokeStyle = 'rgba(8,26,42,0.95)';
  var step = S.tier >= 3 ? 1 : 2;
  for (var i = 0; i < grass.length; i += step) {
    var gr = grass[i];
    var gx = gr.x * (W + 80) - 40 + ox * 0.35;
    var gh = gr.h * H;
    var sway = Math.sin(S.t * 1.1 + gr.phase) * (6 + gr.h * 40) * 0.35;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(gx, baseY - H * 0.045);
    ctx.quadraticCurveTo(gx + gr.lean * 20, baseY - H * 0.045 - gh * 0.6,
                         gx + gr.lean * 34 + sway, baseY - H * 0.045 - gh);
    ctx.stroke();
    if (gr.seedHead && S.tier >= 2) {
      ctx.fillStyle = 'rgba(10,30,48,0.95)';
      ctx.beginPath();
      ctx.ellipse(gx + gr.lean * 34 + sway, baseY - H * 0.045 - gh, 2.1, 4.4,
                  gr.lean, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function paintVignetteAndGrade() {
  /* warm-to-cool grade: the single cheapest thing that makes a 2D canvas
     stop looking like a 2D canvas */
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  var vg = ctx.createRadialGradient(W * 0.5, H * 0.46, Math.min(W, H) * 0.22,
                                    W * 0.5, H * 0.52, Math.max(W, H) * 0.78);
  vg.addColorStop(0, 'rgba(255,255,255,1)');
  vg.addColorStop(1, 'rgba(138,166,194,0.74)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  if (S.tier >= 2) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var s = sunPos();
    var bl = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, Math.max(W, H) * 0.55);
    bl.addColorStop(0, 'rgba(255,214,150,0.11)');
    bl.addColorStop(1, 'rgba(255,214,150,0)');
    ctx.fillStyle = bl;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

/* ------------------------------------------------------------ 6. PARTICLES
 * Three systems, all pooled and allocated once. Counts are tier-scaled, and
 * each can be switched off from the HUD so the founder can see the cost. */

function Pool(n, init) {
  var a = new Array(n), i;
  for (i = 0; i < n; i++) a[i] = init();
  return a;
}

var MAXSPRAY = 180, MAXMIDGE = 150, MAXRAIN = 320;
var rSpray = rng(7), rMidge = rng(8), rRain = rng(9);

var sprayP = Pool(MAXSPRAY, function () {
  return { x: rSpray(), y: rSpray(), vx: 0, vy: 0, life: rSpray(), max: 1, r: 1 };
});
var midgeP = Pool(MAXMIDGE, function () {
  return { x: rMidge(), y: rMidge(), p: rMidge() * 6.28, sp: 0.4 + rMidge(), amp: rMidge() };
});
var rainP = Pool(MAXRAIN, function () {
  return { x: rRain(), y: rRain(), len: 0.01 + rRain() * 0.03, sp: 0.55 + rRain() * 0.7 };
});

function sprayCount() { return S.tier >= 3 ? MAXSPRAY : (S.tier >= 2 ? 90 : 36); }
function midgeCount() { return S.tier >= 3 ? MAXMIDGE : (S.tier >= 2 ? 70 : 0); }
function rainCount()  { return S.tier >= 3 ? MAXRAIN  : (S.tier >= 2 ? 150 : 60); }

function stepSpray(dt) {
  var n = sprayCount(), i;
  var half = n >> 1;
  for (i = 0; i < n; i++) {
    var p = sprayP[i];
    p.fg = i >= half;
    p.life -= dt;
    if (p.life <= 0) {
      if (p.fg) {
        /* shore break: a wave folding over the near rocks, right in front
           of the camera. This is the spray the founder will actually see. */
        var burst = (Math.sin(S.t * 0.9) + 1) / 2;
        p.x = rSpray() * W;
        p.y = H * (0.885 + rSpray() * 0.02);
        p.vx = (rSpray() - 0.5) * 110;
        p.vy = -(70 + rSpray() * 170) * (0.5 + burst * 0.6);
        p.max = 0.55 + rSpray() * 0.75;
        p.r = 1.0 + rSpray() * 2.6;
      } else {
        /* skerry spray, out in the bay */
        var sk = skerries[i % skerries.length];
        var depth = 0.25 + sk.d * 0.5;
        p.x = sk.x * W + px(depth) + (rSpray() - 0.5) * sk.w * W;
        p.y = seaTop + Math.pow(sk.d, 1.8) * (H - seaTop) * 0.72;
        p.vx = (rSpray() - 0.5) * 48;
        p.vy = -(44 + rSpray() * 120) * (0.5 + sk.d);
        p.max = 0.7 + rSpray() * 1.0;
        p.r = (0.5 + rSpray() * 1.3) * (0.5 + sk.d);
      }
      p.life = p.max;
    }
    p.vy += (p.fg ? 520 : 150) * dt;    /* gravity */
    p.vx *= (1 - 0.6 * dt);             /* drag */
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

function drawSpray(fg) {
  var n = sprayCount(), i;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (i = 0; i < n; i++) {
    var p = sprayP[i];
    if (p.life <= 0 || !!p.fg !== !!fg) continue;
    var a = Math.min(1, p.life / p.max) * (fg ? 0.8 : 0.4);
    /* a short streak along the velocity reads as spray; a dot reads as snow */
    ctx.strokeStyle = 'rgba(238,248,253,' + a.toFixed(3) + ')';
    ctx.lineWidth = p.r * (fg ? 1.1 : 0.8);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x - p.vx * 0.022, p.y - p.vy * 0.022);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMidges() {
  var n = midgeCount(), i;
  if (!n) return;
  /* Midges cluster low and near — they are a foreground depth cue as much
     as a joke. Drawn after the cards so they pass in front of them. */
  for (i = 0; i < n; i++) {
    var m = midgeP[i];
    var cx = m.x * W;
    var cy = H * (0.58 + m.y * 0.4);
    var x = cx + Math.sin(S.t * m.sp * 2.3 + m.p) * (10 + m.amp * 26);
    var y = cy + Math.cos(S.t * m.sp * 3.1 + m.p * 2) * (7 + m.amp * 18);
    var a = 0.22 + m.amp * 0.3;
    ctx.fillStyle = 'rgba(12,28,42,' + a.toFixed(3) + ')';
    ctx.fillRect(x, y, 1.6, 1.6);
  }
}

function drawRain(amount) {
  if (amount <= 0.01) return;
  var n = Math.round(rainCount() * amount), i;
  ctx.save();
  ctx.strokeStyle = 'rgba(206,232,246,' + (0.18 * amount).toFixed(3) + ')';
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (i = 0; i < n; i++) {
    var p = rainP[i];
    var y = ((p.y + S.t * p.sp) % 1) * (H + 60) - 30;
    var x = ((p.x + y * 0.00035) % 1) * (W + 60) - 30;
    var l = p.len * H;
    ctx.moveTo(x, y);
    ctx.lineTo(x - l * 0.22, y + l);
  }
  ctx.stroke();
  ctx.restore();
}

/* --------------------------------------------------------- 7. CARD ARTWORK
 * Procedural, drawn into a unit box (0,0)-(1,1) scaled by the caller.
 * Every shape here is authored for this spike. No traced stock art. */

function artLobster(c, w, h, t) {
  var bob = Math.sin(t * 1.6) * h * 0.012;
  c.save();
  c.translate(w * 0.5, h * 0.56 + bob);
  var s = Math.min(w, h) * 0.46;
  /* claws */
  c.fillStyle = '#C94B2E';
  [-1, 1].forEach(function (d) {
    var swing = Math.sin(t * 2.2 + (d > 0 ? 0 : 1)) * 0.12;
    c.save();
    c.rotate(d * (0.5 + swing));
    c.beginPath();
    c.ellipse(0, -s * 0.95, s * 0.3, s * 0.42, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#A83A22';
    c.beginPath();
    c.moveTo(-s * 0.26, -s * 1.22);
    c.quadraticCurveTo(0, -s * 1.52, s * 0.24, -s * 1.18);
    c.quadraticCurveTo(0, -s * 1.08, -s * 0.26, -s * 1.22);
    c.fill();
    c.fillStyle = '#C94B2E';
    c.restore();
  });
  /* body */
  c.fillStyle = '#D4542F';
  c.beginPath();
  c.ellipse(0, 0, s * 0.42, s * 0.52, 0, 0, Math.PI * 2);
  c.fill();
  /* tail segments */
  c.fillStyle = '#B8401F';
  for (var i = 0; i < 4; i++) {
    c.beginPath();
    c.ellipse(Math.sin(t * 2 + i * 0.5) * s * 0.05, s * (0.5 + i * 0.22),
              s * (0.36 - i * 0.055), s * 0.14, 0, 0, Math.PI * 2);
    c.fill();
  }
  /* eyes */
  c.fillStyle = '#10212F';
  c.beginPath(); c.arc(-s * 0.15, -s * 0.26, s * 0.075, 0, 6.3); c.fill();
  c.beginPath(); c.arc(s * 0.15, -s * 0.26, s * 0.075, 0, 6.3); c.fill();
  c.fillStyle = '#FFFFFF';
  c.beginPath(); c.arc(-s * 0.13, -s * 0.29, s * 0.027, 0, 6.3); c.fill();
  c.beginPath(); c.arc(s * 0.17, -s * 0.29, s * 0.027, 0, 6.3); c.fill();
  /* antennae */
  c.strokeStyle = '#A83A22'; c.lineWidth = Math.max(1, s * 0.045);
  c.beginPath();
  c.moveTo(-s * 0.1, -s * 0.42);
  c.quadraticCurveTo(-s * 0.45, -s * 0.8, -s * 0.62, -s * 0.62 + Math.sin(t * 3) * s * 0.05);
  c.moveTo(s * 0.1, -s * 0.42);
  c.quadraticCurveTo(s * 0.45, -s * 0.8, s * 0.62, -s * 0.62 + Math.cos(t * 3) * s * 0.05);
  c.stroke();
  c.restore();
}

function fishBody(c, s, bodyCol, bellyCol, finCol) {
  c.fillStyle = bodyCol;
  c.beginPath();
  c.moveTo(s * 0.95, 0);
  c.quadraticCurveTo(s * 0.2, -s * 0.46, -s * 0.6, -s * 0.2);
  c.quadraticCurveTo(-s * 0.85, 0, -s * 0.6, s * 0.2);
  c.quadraticCurveTo(s * 0.2, s * 0.46, s * 0.95, 0);
  c.fill();
  c.fillStyle = bellyCol;
  c.beginPath();
  c.moveTo(s * 0.8, s * 0.06);
  c.quadraticCurveTo(s * 0.1, s * 0.4, -s * 0.55, s * 0.17);
  c.quadraticCurveTo(s * 0.1, s * 0.2, s * 0.8, s * 0.06);
  c.fill();
  c.fillStyle = finCol;
  c.beginPath();                 /* tail */
  c.moveTo(-s * 0.58, 0);
  c.lineTo(-s * 1.05, -s * 0.34);
  c.lineTo(-s * 0.9, 0);
  c.lineTo(-s * 1.05, s * 0.34);
  c.closePath();
  c.fill();
  c.beginPath();                 /* dorsal */
  c.moveTo(s * 0.05, -s * 0.33);
  c.lineTo(s * 0.2, -s * 0.6);
  c.lineTo(s * 0.34, -s * 0.28);
  c.closePath();
  c.fill();
  c.fillStyle = '#10212F';
  c.beginPath(); c.arc(s * 0.62, -s * 0.08, s * 0.07, 0, 6.3); c.fill();
  c.fillStyle = '#FFFFFF';
  c.beginPath(); c.arc(s * 0.645, -s * 0.1, s * 0.025, 0, 6.3); c.fill();
}

function artHerring(c, w, h, t) {
  var s = Math.min(w, h) * 0.3;
  c.save();
  c.translate(w * 0.5, h * 0.54);
  [[-1, -0.9], [1, 0.9]].forEach(function (d, i) {
    c.save();
    c.translate(d[1] * w * 0.17, Math.sin(t * 1.5 + i * 3.14) * h * 0.035 + (i ? h * 0.07 : -h * 0.07));
    c.rotate(Math.sin(t * 1.2 + i) * 0.1 + (i ? 0.1 : -0.1));
    fishBody(c, s, '#9DC4D8', '#E6F1F7', '#7FA9C2');
    c.restore();
  });
  c.restore();
}

function artSalmon(c, w, h, t) {
  var s = Math.min(w, h) * 0.42;
  c.save();
  c.translate(w * 0.5, h * 0.56 + Math.sin(t * 1.9) * h * 0.03);
  c.rotate(-0.38 + Math.sin(t * 1.9) * 0.1);
  fishBody(c, s, '#5E7F96', '#F0D7C4', '#45627A');
  c.fillStyle = 'rgba(32,52,70,0.6)';
  for (var i = 0; i < 6; i++) {
    c.beginPath();
    c.arc(s * (0.1 + (i % 3) * 0.2), -s * (0.08 + Math.floor(i / 3) * 0.16), s * 0.045, 0, 6.3);
    c.fill();
  }
  c.restore();
  /* splash arc */
  c.save();
  c.strokeStyle = 'rgba(236,247,252,0.5)';
  c.lineWidth = Math.max(1.2, h * 0.012);
  c.beginPath();
  c.ellipse(w * 0.5, h * 0.84, w * 0.3, h * 0.09, 0, Math.PI * 1.08, Math.PI * 1.92);
  c.stroke();
  c.restore();
}

function artFerry(c, w, h, t) {
  var cx = w * 0.5, cy = h * 0.6 + Math.sin(t * 1.1) * h * 0.016;
  var s = Math.min(w, h);
  c.save();
  c.translate(cx, cy);
  c.rotate(Math.sin(t * 0.9) * 0.025);
  c.fillStyle = '#0E2C45';               /* hull */
  c.beginPath();
  c.moveTo(-s * 0.4, 0);
  c.lineTo(s * 0.42, 0);
  c.lineTo(s * 0.33, s * 0.14);
  c.lineTo(-s * 0.32, s * 0.14);
  c.closePath();
  c.fill();
  c.fillStyle = '#E7EFF4';               /* superstructure */
  c.fillRect(-s * 0.28, -s * 0.16, s * 0.56, s * 0.16);
  c.fillRect(-s * 0.14, -s * 0.28, s * 0.3, s * 0.12);
  c.fillStyle = '#C94B2E';               /* funnel */
  c.fillRect(s * 0.04, -s * 0.42, s * 0.1, s * 0.15);
  c.fillStyle = BRAND.gold;              /* lit windows */
  for (var i = 0; i < 7; i++) c.fillRect(-s * 0.25 + i * s * 0.075, -s * 0.12, s * 0.04, s * 0.05);
  c.restore();
  /* wake */
  c.strokeStyle = 'rgba(236,247,252,0.42)';
  c.lineWidth = Math.max(1.2, h * 0.011);
  for (var k = 0; k < 3; k++) {
    c.beginPath();
    c.ellipse(cx, cy + h * (0.1 + k * 0.045), w * (0.22 + k * 0.1), h * 0.03, 0, 0, Math.PI * 2);
    c.stroke();
  }
}

function artPeat(c, w, h, t) {
  var s = Math.min(w, h);
  c.save();
  c.translate(w * 0.5, h * 0.74);
  /* peat bank cut */
  c.fillStyle = '#3A2A20';
  c.fillRect(-w * 0.42, 0, w * 0.84, h * 0.16);
  /* stacked peats (a cruach) */
  var rows = 4;
  for (var r = 0; r < rows; r++) {
    var n = rows - r;
    for (var i = 0; i < n; i++) {
      var bw = s * 0.15, bh = s * 0.075;
      var x = (i - (n - 1) / 2) * bw * 1.08;
      var y = -r * bh * 1.12;
      c.fillStyle = r % 2 ? '#4A362A' : '#5A4232';
      c.fillRect(x - bw / 2, y - bh, bw, bh);
      c.strokeStyle = 'rgba(16,10,6,0.45)';
      c.lineWidth = 1;
      c.strokeRect(x - bw / 2, y - bh, bw, bh);
    }
  }
  /* tairsgeir (peat iron) leaning in */
  c.strokeStyle = '#8A6A46';
  c.lineWidth = Math.max(2, s * 0.022);
  c.beginPath();
  c.moveTo(w * 0.3, h * 0.08);
  c.lineTo(w * 0.22, -h * 0.3);
  c.stroke();
  c.fillStyle = '#B9C4CC';
  c.beginPath();
  c.moveTo(w * 0.3, h * 0.08);
  c.lineTo(w * 0.35, h * 0.14);
  c.lineTo(w * 0.27, h * 0.16);
  c.closePath();
  c.fill();
  c.restore();
  /* drifting peat smoke */
  c.save();
  c.globalAlpha = 0.16;
  c.fillStyle = '#D9E4EC';
  for (var k = 0; k < 4; k++) {
    var ph = (t * 0.25 + k * 0.25) % 1;
    c.beginPath();
    c.arc(w * 0.5 + Math.sin(ph * 6.2 + k) * w * 0.1,
          h * 0.5 - ph * h * 0.4, s * 0.05 * (0.4 + ph), 0, 6.3);
    c.fill();
  }
  c.restore();
}

function artPipes(c, w, h, t) {
  var s = Math.min(w, h);
  var puff = 1 + Math.sin(t * 2.4) * 0.035;
  c.save();
  c.translate(w * 0.5, h * 0.62);
  /* three drones */
  c.strokeStyle = '#6B4A2E';
  c.lineCap = 'round';
  [[-0.2, 1.0], [-0.04, 1.18], [0.12, 0.88]].forEach(function (d, i) {
    c.lineWidth = Math.max(2.5, s * (0.028 - i * 0.003));
    c.beginPath();
    c.moveTo(d[0] * s, -s * 0.02);
    c.lineTo(d[0] * s - s * 0.13, -s * 0.52 * d[1]);
    c.stroke();
    c.fillStyle = '#E7DCCB';
    c.beginPath();
    c.arc(d[0] * s - s * 0.13, -s * 0.52 * d[1], s * 0.032, 0, 6.3);
    c.fill();
  });
  /* bag (tartan-free: a plain thistle-purple velvet, no clan pattern) */
  c.save();
  c.scale(puff, 1 / puff);
  c.fillStyle = '#5B4A86';
  c.beginPath();
  c.ellipse(0, s * 0.1, s * 0.27, s * 0.21, -0.25, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.12)';
  c.beginPath();
  c.ellipse(-s * 0.07, s * 0.03, s * 0.1, s * 0.06, -0.3, 0, Math.PI * 2);
  c.fill();
  c.restore();
  /* chanter */
  c.strokeStyle = '#6B4A2E';
  c.lineWidth = Math.max(2, s * 0.022);
  c.beginPath();
  c.moveTo(s * 0.12, s * 0.18);
  c.lineTo(s * 0.26, s * 0.44);
  c.stroke();
  /* notes rising, as the beat of the game */
  c.fillStyle = BRAND.gold2;
  for (var k = 0; k < 3; k++) {
    var ph = (t * 0.5 + k * 0.33) % 1;
    c.globalAlpha = 0.9 * (1 - ph);
    var nx = s * 0.34 + Math.sin(ph * 5 + k) * s * 0.07;
    var ny = -s * 0.1 - ph * s * 0.5;
    c.beginPath(); c.ellipse(nx, ny, s * 0.035, s * 0.026, -0.4, 0, 6.3); c.fill();
    c.fillRect(nx + s * 0.03, ny - s * 0.11, s * 0.012, s * 0.11);
  }
  c.globalAlpha = 1;
  c.restore();
}

function artCairn(c, w, h, t) {
  var s = Math.min(w, h);
  c.save();
  c.translate(w * 0.5, h * 0.82);
  var stones = [
    [0.00, 0.00, 0.21, 0.085, '#6E6A63'],
    [0.01, -0.15, 0.17, 0.072, '#7C7870'],
    [-0.02, -0.28, 0.135, 0.062, '#6A665F'],
    [0.015, -0.39, 0.10, 0.052, '#837F77'],
    [0.00, -0.48, 0.07, 0.042, '#908C83']
  ];
  stones.forEach(function (st, i) {
    var lift = i === stones.length - 1 ? Math.sin(t * 1.3) * s * 0.012 : 0;
    c.fillStyle = st[4];
    c.beginPath();
    c.ellipse(st[0] * s, st[1] * s + lift, st[2] * s, st[3] * s, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,230,180,0.17)';   /* sun side */
    c.beginPath();
    c.ellipse(st[0] * s + st[2] * s * 0.2, st[1] * s + lift - st[3] * s * 0.25,
              st[2] * s * 0.6, st[3] * s * 0.45, 0, 0, Math.PI * 2);
    c.fill();
  });
  c.restore();
}

function artTweed(c, w, h, t) {
  /* Harris Tweed herringbone, drawn as geometry, not an image.
     Indexical element per dissertation p.38. */
  var s = Math.min(w, h);
  var size = s * 0.09;
  c.save();
  c.beginPath();
  c.rect(w * 0.18, h * 0.22, w * 0.64, h * 0.56);
  c.clip();
  c.fillStyle = '#6E5134';
  c.fillRect(w * 0.18, h * 0.22, w * 0.64, h * 0.56);
  c.strokeStyle = '#A98B5F';
  c.lineWidth = Math.max(1.4, size * 0.2);
  c.lineCap = 'butt';
  var drift = (t * 6) % (size * 2);
  for (var y = h * 0.2 - size * 2; y < h * 0.8 + size * 2; y += size) {
    var flip = Math.round(y / size) % 2 === 0;
    for (var x = w * 0.16 - size * 2; x < w * 0.84 + size * 2; x += size) {
      c.beginPath();
      if (flip) { c.moveTo(x, y + drift); c.lineTo(x + size, y + size + drift); }
      else      { c.moveTo(x, y + size + drift); c.lineTo(x + size, y + drift); }
      c.stroke();
    }
  }
  /* an overcheck in thistle gold */
  c.strokeStyle = 'rgba(232,179,58,0.55)';
  c.lineWidth = Math.max(1.2, s * 0.012);
  for (var gx = w * 0.18; gx < w * 0.82; gx += s * 0.22) {
    c.beginPath(); c.moveTo(gx, h * 0.22); c.lineTo(gx, h * 0.78); c.stroke();
  }
  for (var gy = h * 0.22; gy < h * 0.78; gy += s * 0.22) {
    c.beginPath(); c.moveTo(w * 0.18, gy); c.lineTo(w * 0.82, gy); c.stroke();
  }
  c.restore();
  c.strokeStyle = 'rgba(16,33,47,0.5)';
  c.lineWidth = 2;
  c.strokeRect(w * 0.18, h * 0.22, w * 0.64, h * 0.56);
}

var ART = {
  lobster: artLobster, herring: artHerring, salmon: artSalmon, ferry: artFerry,
  peat: artPeat, pipes: artPipes, cairn: artCairn, tweed: artTweed
};

/* ---------------------------------------------------------- 8. CAROUSEL */

var TAU = Math.PI * 2;

function roundRect(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.arcTo(x + w, y, x + w, y + r, r);
  c.lineTo(x + w, y + h - r);
  c.arcTo(x + w, y + h, x + w - r, y + h, r);
  c.lineTo(x + r, y + h);
  c.arcTo(x, y + h, x, y + h - r, r);
  c.lineTo(x, y + r);
  c.arcTo(x, y, x + r, y, r);
  c.closePath();
}

/* Wrap to at most `maxLines`, shrinking the size until it fits. Gaelic
   titles are long ("Nithear càirn mòr bho chlachan beaga"), so the card has
   to be built around the language rather than the language cropped to fit. */
function fitLines(c, text, maxW, maxLines, startPx, minPx, font) {
  var size = startPx;
  while (size >= minPx) {
    c.font = '600 ' + size.toFixed(1) + 'px ' + font;
    var words = text.split(' ');
    var lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var trial = cur ? cur + ' ' + words[i] : words[i];
      if (c.measureText(trial).width <= maxW || !cur) cur = trial;
      else { lines.push(cur); cur = words[i]; }
    }
    if (cur) lines.push(cur);
    if (lines.length <= maxLines) return { lines: lines, size: size };
    size -= 1;
  }
  /* Last resort: at minPx the title still needs more than maxLines. Never
     let it spill out of the card and paint over the neighbour — hard-wrap at
     minPx and ellipsise the final line. Truncation is a design failure for a
     Gaelic title, so it is recorded, not hidden: the overflow set is logged
     once for the design system (see README, 'what it needs'). */
  c.font = '600 ' + minPx + 'px ' + font;
  var w2 = text.split(' '), out = [], line = '';
  for (var k = 0; k < w2.length; k++) {
    var t2 = line ? line + ' ' + w2[k] : w2[k];
    if (c.measureText(t2).width <= maxW || !line) line = t2;
    else { out.push(line); line = w2[k]; }
    if (out.length === maxLines) break;
  }
  if (out.length < maxLines && line) out.push(line);
  if (out.length === maxLines) {
    var joined = out.join(' ').split(' ').length;
    if (joined < w2.length) {
      var last = out[maxLines - 1];
      while (last.length > 1 && c.measureText(last + '\u2026').width > maxW) {
        last = last.slice(0, -1);
      }
      out[maxLines - 1] = last.replace(/[\s\u2013-]+$/, '') + '\u2026';
      noteOverflow(text);
    }
  }
  return { lines: out.length ? out : [text], size: minPx };
}

/* Titles that could not be laid out at the minimum size, for the README's
   'what it needs from the design system' list. Dev-only; never shown. */
var OVERFLOWED = Object.create(null);
function noteOverflow(t) {
  if (OVERFLOWED[t]) return;
  OVERFLOWED[t] = true;
  if (window.console && console.info) {
    console.info('[spike-B] title truncated at min size, needs a design-system rule: ' + t);
  }
}

/* Cover-flow layout.
 * A true circle projected from a near camera funnels the far cards back
 * towards the centre, which looks like a pile, not a hub. So the depth is
 * real (scale, baseline, fog, shear) but the lateral spacing is authored.
 * `rel` is fractional, so a drag interpolates instead of snapping. */

function relIndex(i) {
  var n = CARDS.length;
  var r = i - S.pos;
  while (r > n / 2) r -= n;
  while (r < -n / 2) r += n;
  return r;
}

function narrow() { return W < 700; }

/* On a phone the same ring would give eight thumbnails nobody can read, so
   the hub shows three cards instead of seven and makes each one bigger. */
function maxRel() { return narrow() ? 1.55 : 3.3; }

function cardGeometry() {
  var list = [], i;
  var nar = narrow();
  var baseW = nar ? Math.min(W * 0.46, 260) : Math.min(W * 0.21, 300);
  var near = nar ? 0.345 : 0.19;
  var far  = nar ? 0.16  : 0.095;
  var lim = maxRel();
  for (i = 0; i < CARDS.length; i++) {
    var rel = relIndex(i);
    var a = Math.abs(rel);
    if (a > lim) continue;
    var sgn = rel < 0 ? -1 : 1;

    var sc = 1 / (1 + (nar ? 0.5 : 0.42) * a);          /* perspective scale */
    var offX = sgn * W * (a < 1 ? near * a : near + far * (a - 1));
    var cw = baseW * sc;
    var ch = cw * 1.28;
    var bottom = H * (nar ? 0.74 : 0.80) - a * H * 0.030 + py(0.4);
    var fadeFrom = lim - 0.7;
    var fade = a > fadeFrom ? Math.max(0, (lim - a) / 0.7) : 1;

    list.push({
      i: i, rel: rel, a: a, sc: sc, fade: fade,
      w: cw, h: ch,
      x: W * 0.5 + offX + px(0.15) - cw / 2,
      y: bottom - ch,
      front: a < 0.5,
      shear: -sgn * Math.min(a, 2) * 0.055,             /* turning away */
      squash: 1 - Math.min(a, 3) * 0.055
    });
  }
  list.sort(function (p, q) { return q.a - p.a; });     /* far first */
  return list;
}

/* How many lines the Gaelic title will take at this card width. Measured
 * with the same routine that draws it, and memoised on (card, rounded width)
 * so the extra measure pass costs nothing per frame. */
var TITLE_LINES = Object.create(null);
function measureTitleLines(c, d, maxW, w) {
  var title = gdOf(d.srcId);
  if (!title) return 0;
  var key = d.id + '@' + Math.round(maxW);
  if (TITLE_LINES[key] !== undefined) return TITLE_LINES[key];
  c.save();
  /* same start/min sizes the draw pass uses, or the two disagree */
  var n = fitLines(c, title, maxW, 3, w * 0.105, w * 0.058, FONT_DISPLAY).lines.length;
  c.restore();
  TITLE_LINES[key] = n;
  return n;
}

function drawCard(g) {
  var d = CARDS[g.i];
  var x = g.x, y = g.y, w = g.w, h = g.h;
  var isFront = g.front;
  var depth01 = Math.min(1, g.a / 2.6);
  var bob = Math.sin(S.t * 1.1 + g.i) * h * (isFront ? 0.012 : 0.006);
  y += bob;

  ctx.save();
  ctx.globalAlpha = g.fade;
  /* fake the y-axis turn: squash horizontally about the card centre and
     shear vertically, which is what sells a flat rect as a facing plane */
  var pivotX = x + w / 2, pivotY = y + h / 2;
  ctx.translate(pivotX, pivotY);
  ctx.transform(g.squash, g.shear * 0.6, 0, 1, 0, 0);
  ctx.translate(-pivotX, -pivotY);

  /* --- contact shadow on the water --- */
  ctx.save();
  ctx.fillStyle = 'rgba(4,18,32,' + (0.34 * (1 - depth01 * 0.6)).toFixed(3) + ')';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h + h * 0.035, w * 0.46, h * 0.038, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  /* --- reflection --- */
  if (S.tier >= 2) {
    ctx.save();
    ctx.globalAlpha = 0.17 * (1 - depth01 * 0.7);
    ctx.translate(x + w / 2, y + h * 2 + h * 0.06);
    ctx.scale(1, -1);
    var rg = ctx.createLinearGradient(0, 0, 0, h * 0.5);
    rg.addColorStop(0, d.tint);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    roundRect(ctx, -w / 2, 0, w, h * 0.5, w * 0.07);
    ctx.fill();
    ctx.restore();
  }

  /* --- card body --- */
  ctx.save();
  if (isFront && S.tier >= 2) {
    ctx.shadowColor = 'rgba(232,179,58,0.55)';
    ctx.shadowBlur = 26;
  } else {
    ctx.shadowColor = 'rgba(3,14,26,0.5)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
  }
  var bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, d.tint);
  bg.addColorStop(1, BRAND.deep);
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, w * 0.075);
  ctx.fill();
  ctx.restore();

  /* --- art window ---
   * The window is sized AROUND the title, not the other way round. A long
   * seanfhacal title ('Nithear cairn mor bho chlachan beaga') needs three
   * lines plus its English gloss, so the picture gives way. Gaelic is the
   * content here; cropping it to protect a thumbnail would be the wrong
   * trade (constitution 4.1, 4.5). */
  var pad = w * 0.055;
  var cardGd = gdOf(d.srcId);
  var titleLines = cardGd ? measureTitleLines(ctx, d, w - pad * 2, w) : 0;
  var ah = h * (titleLines >= 3 ? 0.40 : (titleLines === 2 ? 0.47 : 0.52));
  var aw = w - pad * 2;
  ctx.save();
  roundRect(ctx, x + pad, y + pad, aw, ah, w * 0.05);
  ctx.clip();
  var sg = ctx.createLinearGradient(0, y + pad, 0, y + pad + ah);
  sg.addColorStop(0, '#6FB2D6');
  sg.addColorStop(0.62, '#BFE0EE');
  sg.addColorStop(1, '#F2D7A6');
  ctx.fillStyle = sg;
  ctx.fillRect(x + pad, y + pad, aw, ah);
  ctx.save();
  ctx.translate(x + pad, y + pad);
  var fn = ART[d.art];
  if (fn) fn(ctx, aw, ah, S.t + g.i * 1.7);
  ctx.restore();
  /* window inner shade */
  var ig = ctx.createLinearGradient(0, y + pad, 0, y + pad + ah);
  ig.addColorStop(0, 'rgba(6,36,63,0.22)');
  ig.addColorStop(0.4, 'rgba(6,36,63,0)');
  ctx.fillStyle = ig;
  ctx.fillRect(x + pad, y + pad, aw, ah);
  ctx.restore();
  ctx.strokeStyle = 'rgba(247,210,122,0.55)';
  ctx.lineWidth = Math.max(1, w * 0.007);
  roundRect(ctx, x + pad, y + pad, aw, ah, w * 0.05);
  ctx.stroke();

  /* --- text block --- */
  var tx = x + pad, ty = y + pad + ah + h * 0.055;
  var tw = aw;
  ctx.save();
  /* Belt and braces: even a mis-measured line cannot paint over the card
     next door. Clip to the card's own rounded rect. */
  roundRect(ctx, x, y, w, h, w * 0.075);
  ctx.clip();
  ctx.textBaseline = 'top';

  if (cardGd) {
    /* Gaelic first. Attested only. Rendered in the display stack so the
       graves are proved at card size as well as in the footer. */
    /* Three lines, not two: 'Nithear cairn mor bho chlachan beaga' is a real
       title and the card is built around the language, not the reverse. */
    var gdFit = fitLines(ctx, cardGd, tw, 3, w * 0.105, w * 0.058, FONT_DISPLAY);
    titleLines = gdFit.lines.length;
    ctx.fillStyle = BRAND.gold2;
    for (var li = 0; li < gdFit.lines.length; li++) {
      ctx.fillText(gdFit.lines[li], tx, ty + li * gdFit.size * 1.18);
    }
    ty += gdFit.lines.length * gdFit.size * 1.18 + h * 0.022;
  }

  /* English alongside, always (constitution 4.1). */
  /* Three gloss lines when the title is short, two when it is not: the
     English must always be present, never truncated into nonsense. */
  var enFit = fitLines(ctx, d.en, tw, titleLines >= 3 ? 2 : 3,
                       w * (cardGd ? 0.072 : 0.105), w * 0.046, FONT_UI);
  ctx.fillStyle = cardGd ? 'rgba(236,243,249,0.84)' : BRAND.paper;
  ctx.font = (cardGd ? '400 ' : '600 ') + enFit.size.toFixed(1) + 'px ' + FONT_UI;
  for (var lj = 0; lj < enFit.lines.length; lj++) {
    ctx.fillText(enFit.lines[lj], tx, ty + lj * enFit.size * 1.16);
  }
  ctx.restore();

  /* --- status pip (English, informational, no urgency, no dark pattern) --- */
  var tag = d.status === 'in v1' ? 'In v1' : 'Concept';
  ctx.save();
  ctx.font = '600 ' + Math.max(8, w * 0.05).toFixed(1) + 'px ' + FONT_UI;
  var twd = ctx.measureText(tag).width + w * 0.07;
  var thg = w * 0.085;
  roundRect(ctx, x + w - pad - twd, y + pad + w * 0.035, twd, thg, thg / 2);
  ctx.fillStyle = d.status === 'in v1'
    ? 'rgba(10,40,66,0.82)' : 'rgba(232,179,58,0.88)';
  ctx.fill();
  ctx.fillStyle = d.status === 'in v1' ? BRAND.gold2 : '#10212F';
  ctx.textBaseline = 'middle';
  ctx.fillText(tag, x + w - pad - twd + w * 0.035, y + pad + w * 0.035 + thg / 2);
  ctx.restore();

  /* --- border + rim light from the sun --- */
  ctx.save();
  ctx.lineWidth = Math.max(1.5, w * (isFront ? 0.016 : 0.009));
  ctx.strokeStyle = isFront ? BRAND.gold2 : 'rgba(232,179,58,0.42)';
  roundRect(ctx, x, y, w, h, w * 0.075);
  ctx.stroke();
  var s = sunPos();
  var rim = ctx.createLinearGradient(x, y, x + w, y + h);
  var warm = s.x > x + w / 2;
  rim.addColorStop(warm ? 1 : 0, 'rgba(255,226,170,0.5)');
  rim.addColorStop(warm ? 0 : 1, 'rgba(255,226,170,0)');
  ctx.strokeStyle = rim;
  ctx.lineWidth = Math.max(1, w * 0.008);
  roundRect(ctx, x, y, w, h, w * 0.075);
  ctx.stroke();
  ctx.restore();

  /* --- depth fog on the far cards: the 2.5D cue that does the most work --- */
  if (depth01 > 0.02) {
    ctx.save();
    ctx.fillStyle = 'rgba(28,78,122,' + (depth01 * 0.46).toFixed(3) + ')';
    roundRect(ctx, x, y, w, h, w * 0.075);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();

  /* hit box in screen space (the squash is about the centre, so the
     untransformed rect is within a few px of the painted one) */
  g.hit = { x: x + w * (1 - g.squash) / 2, y: y, w: w * g.squash, h: h };
}

/* ------------------------------------------------------------- 9. RUAIRIDH
 * The seal guide from v1 (dissertation p.38). Ambient pragmatic idioms only,
 * short enough to need no reading comprehension (dissertation p.48). */

function drawRuairidh() {
  var s = Math.min(W, H) * (narrow() ? 0.135 : 0.11);
  var cx = W * (narrow() ? 0.17 : 0.115) + px(0.75);
  var cy = H * 0.915 + py(0.75) + Math.sin(S.t * 1.4) * s * 0.035;

  ctx.save();
  ctx.translate(cx, cy);
  /* water ring */
  ctx.strokeStyle = 'rgba(236,247,252,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, s * 0.52, s * 0.78, s * 0.14, 0, 0, TAU);
  ctx.stroke();
  /* body */
  var bg = ctx.createLinearGradient(0, -s * 0.8, 0, s * 0.6);
  bg.addColorStop(0, '#6B7A86');
  bg.addColorStop(1, '#3E4C58');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.5, s * 0.62, 0, 0, TAU);
  ctx.fill();
  /* head */
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.5, s * 0.36, s * 0.32, 0, 0, TAU);
  ctx.fill();
  /* muzzle */
  ctx.fillStyle = '#8A98A3';
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.38, s * 0.19, s * 0.14, 0, 0, TAU);
  ctx.fill();
  /* eyes */
  var blink = (Math.sin(S.t * 0.9) > 0.985) ? 0.12 : 1;
  ctx.fillStyle = '#0B1A26';
  ctx.beginPath(); ctx.ellipse(-s * 0.14, -s * 0.57, s * 0.065, s * 0.07 * blink, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(s * 0.14, -s * 0.57, s * 0.065, s * 0.07 * blink, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.arc(-s * 0.12, -s * 0.595, s * 0.02, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(s * 0.16, -s * 0.595, s * 0.02, 0, TAU); ctx.fill();
  /* nose + whiskers */
  ctx.fillStyle = '#17242E';
  ctx.beginPath(); ctx.ellipse(0, -s * 0.42, s * 0.045, s * 0.032, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(224,234,241,0.6)';
  ctx.lineWidth = 1;
  for (var k = -1; k <= 1; k += 2) {
    for (var j = 0; j < 3; j++) {
      ctx.beginPath();
      ctx.moveTo(k * s * 0.07, -s * 0.4 + j * s * 0.03);
      ctx.lineTo(k * s * 0.34, -s * 0.46 + j * s * 0.055);
      ctx.stroke();
    }
  }
  /* flippers */
  ctx.fillStyle = '#48565F';
  ctx.beginPath();
  ctx.ellipse(-s * 0.48, s * 0.12, s * 0.2, s * 0.1,
              -0.5 + Math.sin(S.t * 2) * 0.12, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(s * 0.48, s * 0.12, s * 0.2, s * 0.1,
              0.5 - Math.sin(S.t * 2) * 0.12, 0, TAU);
  ctx.fill();
  ctx.restore();

  /* --- speech bubble: Gaelic + English gloss, always both ---
     With no PENDING rows loaded there is no attested Gaelic to say, so
     Ruairidh says nothing rather than speaking a string from this file. */
  var lines = sealLines();
  if (!lines.length) return;
  var line = lines[S.sealLine % lines.length];
  var phase = (S.sealT % 5) / 5;
  var vis = phase < 0.1 ? phase / 0.1 : (phase > 0.86 ? (1 - phase) / 0.14 : 1);
  if (vis <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, vis));
  var fs = Math.max(13, s * 0.3);
  ctx.font = '600 ' + fs.toFixed(1) + 'px ' + FONT_DISPLAY;
  var wGd = ctx.measureText(line.gd).width;
  ctx.font = '400 ' + (fs * 0.68).toFixed(1) + 'px ' + FONT_UI;
  var wEn = ctx.measureText(line.en).width;
  var bw = Math.max(wGd, wEn) + fs * 1.4;
  var bh = fs * 2.5;
  var bx = cx + s * 0.5;
  var by = cy - s * 1.18;

  ctx.fillStyle = 'rgba(244,247,250,0.96)';
  ctx.strokeStyle = BRAND.saltire;
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, bw, bh, 10);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx + bw * 0.1, by + bh);
  ctx.lineTo(bx + bw * 0.04, by + bh + fs * 0.7);
  ctx.lineTo(bx + bw * 0.26, by + bh);
  ctx.closePath();
  ctx.fillStyle = 'rgba(244,247,250,0.96)';
  ctx.fill();

  ctx.textBaseline = 'top';
  ctx.fillStyle = '#0E3C6B';
  ctx.font = '600 ' + fs.toFixed(1) + 'px ' + FONT_DISPLAY;
  ctx.fillText(line.gd, bx + fs * 0.7, by + fs * 0.35);
  ctx.fillStyle = 'rgba(14,60,107,0.7)';
  ctx.font = '400 ' + (fs * 0.68).toFixed(1) + 'px ' + FONT_UI;
  ctx.fillText(line.en, bx + fs * 0.7, by + fs * 1.5);
  ctx.restore();
}

/* ------------------------------------------------------- 10. FRAME + LOOP */

var lastGeom = [];

function frame(dt) {
  if (!ctx) return;

  /* carousel physics: critically-damped snap to the nearest card index */
  var n = CARDS.length;
  if (!S.dragging && dt > 0) {
    var snap = Math.round(S.pos);
    S.vel += (snap - S.pos) * 46 * dt;
    S.vel *= Math.pow(0.0012, dt);
    S.pos += S.vel * dt;
    if (Math.abs(snap - S.pos) < 0.0006 && Math.abs(S.vel) < 0.01) {
      S.pos = snap; S.vel = 0;
    }
  }
  S.selected = ((Math.round(S.pos) % n) + n) % n;

  paintSky();
  paintRidge(ridgeFar, 0.1, '#2A5C85', 0.34);
  paintRidge(ridgeMid, 0.2, '#15405F', 0.20);
  paintLighthouse();
  paintSea();
  paintSkerries();
  if (S.spray) { stepSpray(dt); drawSpray(false); }

  lastGeom = cardGeometry();
  for (var i = 0; i < lastGeom.length; i++) drawCard(lastGeom[i]);

  drawRuairidh();
  paintForeground();
  if (S.spray) drawSpray(true);
  if (S.rain || S.rainAmount > 0) drawRain(S.rainAmount);
  if (S.midges) drawMidges();
  paintVignetteAndGrade();
}

/* --- frame-rate watchdog: the real degradation decision --------------------
 * A school Chromebook will not report itself as weak. It will simply miss
 * frames. Two seconds under 45fps drops a tier; under 20fps falls all the
 * way to a single static frame and the loop stops. */
var lastT = 0, rafId = 0, accum = 0, frames = 0;

function tick(now) {
  rafId = requestAnimationFrame(tick);
  if (!lastT) { lastT = now; return; }

  /* rawDt is wall-clock; dt is clamped so one long stall cannot teleport the
     animation. The fps measurement MUST use rawDt — measuring the clamped
     value makes the reported rate a constant (1/0.05 = 20) under load, which
     is exactly the case the watchdog exists to catch. */
  var rawDt = (now - lastT) / 1000;
  var dt = Math.min(0.05, rawDt);
  lastT = now;
  S.t += dt;
  S.sealT += dt;
  if (S.sealT > 5) { S.sealT = 0; S.sealLine = S.sealLine + 1; }

  /* rain fades rather than snapping on */
  var want = S.rain ? 1 : 0;
  S.rainAmount += (want - S.rainAmount) * Math.min(1, dt * 1.6);

  frames++; accum += rawDt;
  if (accum >= 0.5) {
    S.fps = frames / accum;
    frames = 0; accum = 0;
    updateReadout();
    if (S.tierMode === 'auto') {
      if (S.fps < 22) {
        S.critStreak++;
        S.lowStreak = 0;
        /* three bad half-seconds, not one: a single stall (tab restored,
           another app grabbing the CPU) must not strand the page on a
           still image. */
        if (S.critStreak >= 3) { setTier(0); return; }
      } else if (S.fps < 45) {
        S.critStreak = 0;
        S.lowStreak++;
        if (S.lowStreak >= 4 && S.tier > 1) {
          setTier(S.tier - 1);
          S.lowStreak = 0;
          frames = 0; accum = 0;
          return;
        }
      } else {
        S.lowStreak = 0; S.critStreak = 0;
        /* a healthy half-second forgives the freeze backoff */
        if (recoveryWait !== 20000) recoveryWait = 20000;
      }
    }
  }

  if (S.frozen) return;
  frame(dt);
}

function setTier(t) {
  if (S.tier === t) return;
  S.tier = t;
  if (t === 0) freeze();
  else if (S.frozen) thaw();
  else resize();
  updateReadout();
}

function freeze() {
  S.frozen = true;
  if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  /* paint one complete, good-looking frame and leave it there */
  var keep = S.tier;
  S.tier = 2;
  frame(0);
  S.tier = keep;
  updateReadout();
  scheduleRecovery();
}

/* Dropping to a still image must be reversible.
 * The thing that trips the watchdog on a school machine is very often
 * temporary — another tab waking, a sync, a cold start, a teacher switching
 * displays. If the hub froze itself permanently on the first bad three
 * seconds, a child would be left with a dead picture for the rest of the
 * lesson, and nothing on the page would tell them why. So while the quality
 * control is on Auto, the page retries: it thaws at the LOWEST animated tier,
 * lets the same watchdog judge it again, and backs off (20s, 40s, 80s ...
 * capped at 5 minutes) each time the machine really is too slow. A machine
 * that is genuinely weak therefore settles on the still image after a few
 * attempts and stops burning battery; a machine that had a hiccup comes
 * back. Choosing 'Static frame' by hand is respected and never retried. */
var recoveryTimer = 0;
var recoveryWait = 20000;
var RECOVERY_MAX = 300000;

function scheduleRecovery() {
  if (recoveryTimer) { clearTimeout(recoveryTimer); recoveryTimer = 0; }
  if (S.tierMode !== 'auto' || !S.frozen) return;
  recoveryTimer = setTimeout(function () {
    recoveryTimer = 0;
    if (!S.frozen || S.tierMode !== 'auto' || document.hidden) {
      scheduleRecovery();
      return;
    }
    recoveryWait = Math.min(recoveryWait * 2, RECOVERY_MAX);
    S.critStreak = 0;
    S.lowStreak = 0;
    S.tier = 1;
    thaw();
    resize();
    updateReadout();
  }, recoveryWait);
}

function thaw() {
  S.frozen = false;
  if (recoveryTimer) { clearTimeout(recoveryTimer); recoveryTimer = 0; }
  lastT = 0;
  frames = 0; accum = 0;
  if (!rafId) rafId = requestAnimationFrame(tick);
}

function updateReadout() {
  var el = document.getElementById('readout');
  if (!el) return;
  var names = ['static frame', 'low', 'medium', 'high'];
  var cls = S.fps >= 50 ? 'ok' : (S.fps >= 30 ? '' : 'warn');
  if (S.frozen) {
    el.innerHTML = '<span>static frame — ' +
      (S.tierMode === 'auto' ? 'retrying in ' + Math.round(recoveryWait / 1000) + 's'
                             : 'loop stopped') + '</span>';
  } else {
    el.innerHTML = '<span class="' + cls + '">' + S.fps.toFixed(0) + ' fps</span>' +
      ' · tier ' + S.tier + ' (' + names[S.tier] + ')' +
      ' · ' + (window.devicePixelRatio || 1).toFixed(1) + '× dpr';
  }
}

/* -------------------------------------------------------------- 11. INPUT */

function rotateTo(i) {
  var n = CARDS.length;
  var want = i;
  while (want - S.pos > n / 2) want -= n;
  while (S.pos - want > n / 2) want += n;
  S.pos = want;
  S.vel = 0;
  if (S.frozen) freeze();
}

function step(dir) {
  rotateTo(((S.selected + dir) % CARDS.length + CARDS.length) % CARDS.length);
  announce();
}

function announce() {
  var d = CARDS[S.selected];
  var btn = document.querySelector('#cards-a11y button[data-i="' + S.selected + '"]');
  if (btn && document.activeElement !== btn &&
      document.activeElement && document.activeElement.closest &&
      document.activeElement.closest('#cards-a11y')) {
    btn.focus();
  }
  void d;
}

if (ctx) {
  window.addEventListener('resize', resize);

  stage.addEventListener('pointerdown', function (e) {
    S.dragging = true;
    S.lastX = e.clientX;
    stage.classList.add('dragging');
    try { stage.setPointerCapture(e.pointerId); } catch (err) { void err; }
  });

  stage.addEventListener('pointermove', function (e) {
    var r = stage.getBoundingClientRect();
    S.pointer.x = (e.clientX - r.left) / Math.max(1, r.width);
    S.pointer.y = (e.clientY - r.top) / Math.max(1, r.height);
    if (S.dragging) {
      var dx = e.clientX - S.lastX;
      S.lastX = e.clientX;
      var k = 1 / Math.max(120, W * 0.14);     /* px per card step */
      S.pos -= dx * k;
      S.vel = -dx * k * 14;
    }
    if (S.frozen) freeze();
  });

  function endDrag(e) {
    if (!S.dragging) return;
    S.dragging = false;
    stage.classList.remove('dragging');
    try { stage.releasePointerCapture(e.pointerId); } catch (err) { void err; }
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('pointerleave', endDrag);

  stage.addEventListener('click', function (e) {
    if (Math.abs(S.vel) > 1.2) return;
    var r = stage.getBoundingClientRect();
    var mx = e.clientX - r.left, my = e.clientY - r.top;
    /* nearest card first */
    for (var i = lastGeom.length - 1; i >= 0; i--) {
      var g = lastGeom[i];
      if (!g.hit) continue;
      if (mx >= g.hit.x && mx <= g.hit.x + g.hit.w &&
          my >= g.hit.y && my <= g.hit.y + g.hit.h) {
        rotateTo(g.i);
        return;
      }
    }
  });

  stage.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      S.pos -= e.deltaX / Math.max(120, W * 0.14);
      e.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
  });
}

/* ----------------------------------------------- 12. ACCESSIBLE CARD LIST */

/* Rebuilt, not patched, when the PENDING Gaelic lands: the label, the lang
   attribute and the aria-label all change together or not at all. */
function buildCardList() {
  var ul = document.getElementById('cards-a11y');
  if (!ul) return;
  var hadFocus = document.activeElement &&
                 document.activeElement.parentNode &&
                 document.activeElement.parentNode.parentNode === ul
                 ? document.activeElement.dataset.i : null;
  ul.textContent = '';
  CARDS.forEach(function (d, i) {
    var li = document.createElement('li');
    var b = document.createElement('button');
    b.type = 'button';
    b.dataset.i = String(i);
    var lg = gdOf(d.srcId);
    var label = (lg ? lg + ' \u2014 ' : '') + d.en;
    b.textContent = label;
    b.setAttribute('lang', lg ? 'gd' : 'en');
    b.setAttribute('aria-label', label + '. ' +
      (d.status === 'in v1' ? 'Already in version one.' : 'Concept.'));
    b.addEventListener('focus', function () { rotateTo(i); });
    b.addEventListener('click', function () { rotateTo(i); });
    li.appendChild(b);
    ul.appendChild(li);
  });
  if (hadFocus !== null) {
    var again = ul.querySelector('button[data-i="' + hadFocus + '"]');
    if (again) again.focus();
  }
}
buildCardList();

/* ------------------------------------------------------- 13. HUD BINDINGS */

(function bindHud() {
  function on(id, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', fn);
  }
  on('t-spray', function (e) { S.spray = e.target.checked; if (S.frozen) freeze(); });
  on('t-midge', function (e) { S.midges = e.target.checked; if (S.frozen) freeze(); });
  on('t-rain',  function (e) {
    S.rain = e.target.checked;
    S.rainAmount = S.rain ? 1 : 0;
    if (S.frozen) freeze();
  });
  on('q', function (e) {
    var v = e.target.value;
    if (v === 'auto') {
      S.tierMode = 'auto';
      S.lowStreak = 0; S.critStreak = 0;
      recoveryWait = 20000;
      setTier(initialTier() || 1);
      if (S.frozen) thaw();
    }
    else { S.tierMode = 'fixed'; setTier(parseInt(v, 10)); }
  });
})();

/* ---------------------------------------- 14. GAELIC GRAVE-ACCENT PROOF
 * Rendering à è ì ò ù is not optional for this brand. A missing glyph in a
 * canvas falls back to notdef, whose advance width differs from the base
 * letter in every system face we target. Measure, do not assume. */

(function glyphProof() {
  var out = document.getElementById('glyph-verdict');
  if (!out) return;
  var pairs = [['a', '\u00e0'], ['e', '\u00e8'], ['i', '\u00ec'],
               ['o', '\u00f2'], ['u', '\u00f9'],
               ['A', '\u00c0'], ['E', '\u00c8'], ['I', '\u00cc'],
               ['O', '\u00d2'], ['U', '\u00d9']];
  var SIZES = [12, 20, 34];
  var bad = [];

  /* --- surface 1: canvas. A missing glyph falls back to notdef, which still
     PAINTS, so nothing looks wrong - the only tell is the advance width. --- */
  var probe = null;
  try { probe = document.createElement('canvas').getContext('2d'); }
  catch (e) { probe = null; }
  if (probe) {
    for (var si = 0; si < SIZES.length; si++) {
      probe.font = '600 ' + SIZES[si] + 'px ' + FONT_DISPLAY;
      for (var i = 0; i < pairs.length; i++) {
        var base = probe.measureText(pairs[i][0]).width;
        var acc = probe.measureText(pairs[i][1]).width;
        /* a real accented glyph shares the base advance (+/-12%); a notdef
           box does not, and a zero width means nothing was drawn at all */
        if (acc === 0 || Math.abs(acc - base) > base * 0.12) {
          bad.push(pairs[i][1] + '@' + SIZES[si] + 'px canvas');
        }
      }
    }
  }

  /* --- surface 2: the DOM, measured, not assumed. Same test, laid out by
     the text engine rather than the canvas rasteriser; the two can disagree
     and on a school device it is the DOM a child reads most of. --- */
  var box = document.createElement('div');
  box.setAttribute('aria-hidden', 'true');
  box.style.cssText = 'position:absolute;left:-9999px;top:0;white-space:pre;' +
                      'visibility:hidden;font-family:' + FONT_DISPLAY;
  document.body.appendChild(box);
  function domWidth(t, px) {
    box.style.fontSize = px + 'px';
    box.textContent = t;
    return box.getBoundingClientRect().width;
  }
  for (var sj = 0; sj < SIZES.length; sj++) {
    for (var j = 0; j < pairs.length; j++) {
      var b2 = domWidth(pairs[j][0], SIZES[sj]);
      var a2 = domWidth(pairs[j][1], SIZES[sj]);
      if (a2 === 0 || Math.abs(a2 - b2) > b2 * 0.12) {
        bad.push(pairs[j][1] + '@' + SIZES[sj] + 'px DOM');
      }
    }
  }
  document.body.removeChild(box);

  var surfaces = probe ? 'canvas and DOM' : 'DOM only (no canvas on this device)';
  var checks = pairs.length * SIZES.length * (probe ? 2 : 1);
  if (bad.length === 0) {
    out.className = 'verdict pass';
    out.textContent = 'PASS \u2014 ' + checks + ' checks: 10 grave forms \u00d7 '
      + SIZES.join('/') + 'px \u00d7 ' + surfaces
      + ', in the system display stack';
  } else {
    out.className = 'verdict fail';
    out.textContent = 'FAIL \u2014 ' + bad.length + ' of ' + checks
      + ' checks failed on this device: ' + bad.slice(0, 8).join(', ')
      + (bad.length > 8 ? ' \u2026' : '');
  }
})();

/* ------------------------------------------------------------- 15. START */

if (ctx) {
  resize();
  if (reduceMotion) {
    /* Honour the OS setting: paint the scene once, never animate. */
    S.tierMode = 'fixed';
    S.tier = 2;
    buildStatics();
    freeze();
    var q = document.getElementById('q');
    if (q) q.value = '0';
  } else {
    rafId = requestAnimationFrame(tick);
  }
  /* Stop burning frames when the tab is hidden — a laptop battery in a
     classroom is a real constraint. */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    } else if (!S.frozen && !rafId) {
      lastT = 0;
      frames = 0; accum = 0;
      rafId = requestAnimationFrame(tick);
    } else if (S.frozen && S.tierMode === 'auto') {
      /* A backgrounded tab starves rAF, which looks exactly like a weak
         machine. Coming back to the foreground is the one moment we know
         the earlier measurement was probably wrong, so forgive the backoff
         and try again promptly. */
      recoveryWait = 20000;
      scheduleRecovery();
    }
  });
}

/* ------------------------------------------------- 16. STRAPLINE ROTATION
 * Gaelic first, English alongside, source credited. All attested, all
 * PENDING, all loaded from gaelic-pending.json. With no rows loaded the
 * strapline shows the English alone and says why. */

var showStrap = (function strapline() {
  var gd = document.getElementById('strap-gd');
  var en = document.getElementById('strap-en');
  var sc = document.getElementById('strap-src');
  if (!gd || !en || !sc) return function () {};
  var i = 0;
  function show(advance) {
    var p = PROVERBS[i % PROVERBS.length];
    var g = gdOf(p.srcId);
    gd.textContent = g || '';
    gd.hidden = !g;
    en.textContent = p.en;
    sc.textContent = g ? 'Source: ' + p.src
                       : 'Gaelic not loaded \u2014 English only (gaelic-pending.json)';
    if (advance !== false) i++;
  }
  show();
  if (!reduceMotion) setInterval(show, 9000);
  return function () { show(false); };
})();

/* --------------------------------------------- 17. LOAD THE PENDING GAELIC
 * Same-origin, no network beyond this one file, no third party. The page is
 * already running and already correct in English before this resolves; the
 * Gaelic simply appears when it lands. A failure is reported in the console
 * for a developer and leaves the page in English - never in unreviewed
 * Gaelic, which is the whole point of keeping it out of this file. */

(function loadGaelic() {
  if (typeof fetch !== 'function') return;
  fetch('gaelic-pending.json', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      var rows = data && data.strings;
      if (!rows) throw new Error('no strings object');
      var n = 0, k;
      for (k in rows) {
        if (Object.prototype.hasOwnProperty.call(rows, k) && rows[k] &&
            rows[k].verified_by === 'PENDING' && rows[k].gaelic) {
          GAELIC[k] = rows[k];
          n++;
        }
      }
      TITLE_LINES = Object.create(null);   /* titles changed; re-measure */
      buildCardList();
      showStrap();
      /* the one real word in the footer type proof (VBD-021) */
      var gw = document.getElementById('glyph-word');
      if (gw) gw.textContent = gdOf('VBD-021') || '';
      if (S.frozen) freeze();              /* repaint the still image */
      if (window.console && console.info) {
        console.info('[spike-B] ' + n + ' PENDING Gaelic rows loaded. ' +
          'None of them is certified: native-speaker review outstanding.');
      }
    })
    .catch(function (e) {
      if (window.console && console.warn) {
        console.warn('[spike-B] gaelic-pending.json did not load (' + e.message +
          '). Rendering English only, by design.');
      }
    });
})();
