import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2];
const outDir = process.argv[3] ?? join(__dirname, "..", "public");

const html = readFileSync(htmlPath, "utf8");

const matches = [...html.matchAll(/src="(data:image\/(\w+);base64,([^"]+))"/g)];
const seen = new Map();

for (const [, , ext, b64] of matches) {
  const size = b64.length;
  if (!seen.has(size)) {
    seen.set(size, { ext, b64 });
  }
}

let i = 0;
mkdirSync(outDir, { recursive: true });
for (const { ext, b64 } of seen.values()) {
  i++;
  const name = `image-${i}.${ext === "jpeg" ? "jpg" : ext}`;
  writeFileSync(join(outDir, name), Buffer.from(b64, "base64"));
  console.log("wrote", name);
}
