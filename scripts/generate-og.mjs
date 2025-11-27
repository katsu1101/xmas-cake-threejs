import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const brand = JSON.parse(await fs.readFile("brand/brand.json", "utf8"));

const width = 1200;
const height = 630;

const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1020"/>
      <stop offset="100%" stop-color="${brand.themeColor}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <text x="80" y="320" font-size="72" font-weight="800" fill="#fff"
        font-family="system-ui, -apple-system, 'Segoe UI', sans-serif">${escapeXml(brand.appName)}</text>
  <text x="80" y="390" font-size="32" fill="rgba(255,255,255,0.9)"
        font-family="system-ui, -apple-system, 'Segoe UI', sans-serif">${escapeXml(brand.tagline)}</text>
</svg>`;

function escapeXml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

await fs.mkdir("docs", { recursive: true });

await sharp(Buffer.from(svg))
  // ロゴを左上に合成したいならここで composite を追加してもOK
  .png()
  .toFile(path.join("docs", "og.png"));
