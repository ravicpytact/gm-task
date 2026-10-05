// Renders every app icon from the TaskDesk mark (the check-list icon on a rounded square, as in the
// sidebar and sign-in screen). Run after changing the mark or an accent colour:
//   pnpm icons
// Writes, from the accent colours in src/app/globals.css:
//   public/icons/mark-<accent>.svg   the browser-tab icon, one per accent theme (follows the theme)
// and, in the brand colour (default accent), the icons that are saved once and never re-read:
//   public/favicon.ico (16/32/48), public/icons/apple-icon.png (180, full bleed),
//   public/icons/icon-192.png, icon-512.png, icon-maskable-512.png (web manifest),
//   ../backend/templates/email/logo.png (96, shown at 40): embedded in every email by the backend.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { chromium } from "@playwright/test";

const ACCENTS = ["indigo", "blue", "cyan", "teal", "khaki", "mocha", "violet", "fuchsia", "slate", "stone"];
const DEFAULT_ACCENT = "indigo";

// The lucide `list-checks` paths, as used by the app (24 × 24, placed on a 32 × 32 square).
const PATHS = ["M13 5h8", "M13 12h8", "M13 19h8", "m3 17 2 2 4-4", "m3 7 2 2 4-4"];
const glyph = `<g fill="none" stroke="#FFFFFF" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">${PATHS.map((d) => `<path d="${d}"/>`).join("")}</g>`;

/** The mark on a rounded square (tabs, manifest, email). */
const mark = (color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${color}"/><g transform="translate(4 4)">${glyph}</g></svg>\n`;

/** The mark full bleed, the glyph at `scale` of the side: iOS rounds it; Android masks it. */
const fullBleed = (color, scale) => {
  const side = 24 / scale;
  const o = (24 - side) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${o} ${o} ${side} ${side}"><rect x="${o}" y="${o}" width="${side}" height="${side}" fill="${color}"/>${glyph}</svg>`;
};

// --- accent colours: the light-mode --primary of each theme, as hex (SVG and PNG need sRGB) ---
const css = readFileSync("src/app/globals.css", "utf8");
function lightPrimary(accent) {
  const selector = accent === DEFAULT_ACCENT ? ":root" : `[data-accent="${accent}"]`;
  const start = css.indexOf(`\n${selector} {`);
  if (start < 0) throw new Error(`No ${selector} block in globals.css`);
  const block = css.slice(start, css.indexOf("}", start));
  const m = block.match(/--primary: oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/);
  if (!m) throw new Error(`No --primary in ${selector}`);
  return oklchToHex(...m.slice(1).map(Number));
}
function oklchToHex(l, c, h) {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
  return `#${linear
    .map((v) => {
      const x = Math.min(Math.max(v, 0), 1);
      const s = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
      return Math.round(s * 255).toString(16).padStart(2, "0");
    })
    .join("")
    .toUpperCase()}`;
}

// --- rendering --------------------------------------------------------------------------------
const browser = await chromium.launch();
const page = await browser.newPage();

async function png(svg, size) {
  await page.setViewportSize({ width: size, height: size });
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><img style="display:block;width:${size}px;height:${size}px" src="${src}"></body></html>`,
  );
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}

function write(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
  console.log("wrote", path);
}

/** An .ico holding PNG images (supported by every current browser). */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.data)]);
}

try {
  for (const accent of ACCENTS) write(`public/icons/mark-${accent}.svg`, mark(lightPrimary(accent)));

  const brand = lightPrimary(DEFAULT_ACCENT);
  const images = [];
  for (const size of [16, 32, 48]) images.push({ size, data: await png(mark(brand), size) });
  write("public/favicon.ico", ico(images));
  write("public/icons/apple-icon.png", await png(fullBleed(brand, 0.62), 180));
  write("public/icons/icon-192.png", await png(mark(brand), 192));
  write("public/icons/icon-512.png", await png(mark(brand), 512));
  write("public/icons/icon-maskable-512.png", await png(fullBleed(brand, 0.5), 512));
  write("../backend/templates/email/logo.png", await png(mark(brand), 96));
} finally {
  await browser.close();
}
