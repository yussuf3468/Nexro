/**
 * generate-icons.mjs — Run once with `node scripts/generate-icons.mjs` to
 * produce PNG icons from public/icons/icon.svg.
 *
 * Prerequisites:
 *   npm install -D sharp
 *
 * This script is only needed during initial project setup; the generated PNGs
 * are committed to version control so it does not need to run in CI.
 */

import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SVG_PATH = resolve(ROOT, "public/icons/icon.svg");
const svg = readFileSync(SVG_PATH);

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of SIZES) {
  const outPath = resolve(ROOT, `public/icons/icon-${size}.png`);
  await sharp(svg).resize(size, size).png().toFile(outPath);
  console.log(`✓  icon-${size}.png`);
}

console.log("\nAll icons generated.");
