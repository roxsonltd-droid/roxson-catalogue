import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2];
if (!htmlPath) {
  console.error("Usage: node scripts/parse-html.mjs <path-to-index.html>");
  process.exit(1);
}
const html = readFileSync(htmlPath, "utf8");

const decode = (s) =>
  s
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");

const stripTags = (s) => decode(s.replace(/<[^>]+>/g, "").trim());

const i18n = (el) => {
  const en = el.match(/data-en="([^"]*)"/)?.[1];
  const bg = el.match(/data-bg="([^"]*)"/)?.[1];
  const plain = stripTags(el);
  return { en: decode(en ?? plain), bg: decode(bg ?? en ?? plain) };
};

const categories = [];
for (const sec of html.matchAll(/<section class="cat[^"]*" id="([^"]+)" data-cat-section="[^"]*">([\s\S]*?)<\/section>/g)) {
  const id = sec[1];
  const num = stripTags(sec[2].match(/<span class="cat-num">([\s\S]*?)<\/span>/)?.[1] ?? "");
  const titleEl = sec[2].match(/<h2>([\s\S]*?)<\/h2>/)?.[1];
  const blurbEl = sec[2].match(/<p class="cat-blurb">([\s\S]*?)<\/p>/)?.[1];
  const title = i18n(titleEl ?? "");
  const blurb = i18n(blurbEl ?? "");
  categories.push({ slug: id, num: parseInt(num, 10), titleEn: title.en, titleBg: title.bg, blurbEn: blurb.en, blurbBg: blurb.bg });
}

const products = [];
let order = 0;
for (const art of html.matchAll(/<article class="card" data-cat="([^"]+)" data-search="([^"]*)">([\s\S]*?)<\/article>/g)) {
  order++;
  const categorySlug = art[1];
  const searchText = decode(art[2]).toLowerCase();
  const body = art[3];

  const img = body.match(/<img src="([^"]+)" alt="([^"]*)"/);
  const imagePath = img?.[1] ?? "";
  const imageUrl = imagePath.startsWith("http") ? imagePath : imagePath.replace(/^assets/, "");

  const code = stripTags(body.match(/<p class="card-code[^"]*">([\s\S]*?)<\/p>/)?.[1] ?? "");
  const seriesEl = body.match(/<h3 class="card-series">([\s\S]*?)<\/h3>/)?.[1];
  const descEl = body.match(/<p class="card-desc">([\s\S]*?)<\/p>/)?.[1];
  const series = i18n(seriesEl ?? "");
  const desc = i18n(descEl ?? "");

  let layout = "ruler";
  let material = { en: "", bg: "" };
  let diameterMin = null;
  let diameterMax = null;
  let core = { en: "", bg: "" };
  let insulation = { en: "", bg: "" };
  let jacket = { en: "", bg: "" };
  let application = { en: "", bg: "" };
  let standard = { en: "", bg: "" };
  let standardHighlight = false;

  const parseRange = (txt) => {
    const m = txt.match(/([\d.]+)″\s*[–-]\s*([\d.]+)″/);
    if (!m) return null;
    return [parseFloat(m[1]), parseFloat(m[2])];
  };

  if (/class="layers"/.test(body)) {
    layout = "layers";
    for (const layer of body.matchAll(/<div class="layer">([\s\S]*?)<\/div>/g)) {
      const l = layer[1];
      const k = stripTags(l.match(/<span class="spec-k">([\s\S]*?)<\/span>/)?.[1] ?? "");
      const vEl = l.match(/<span class="spec-v">([\s\S]*?)<\/span>/)?.[1];
      const v = i18n(vEl ?? "");
      if (/Core/i.test(k)) core = v;
      else if (/Insulation/i.test(k)) insulation = v;
      else if (/Jacket/i.test(k)) jacket = v;
    }
  } else if (/spec-block--table/.test(body)) {
    layout = "table";
    const cells = [...body.matchAll(/<div class="spec-cell">([\s\S]*?)<\/div>/g)].map((c) => {
      const k = stripTags(c[1].match(/<span class="spec-k">([\s\S]*?)<\/span>/)?.[1] ?? "");
      const vEl = c[1].match(/<span class="spec-v[^"]*">([\s\S]*?)<\/span>/)?.[1];
      const hl = /spec-v--as/.test(c[1].match(/<span class="spec-v[^"]*">/)?.[0] ?? "");
      return { k, v: i18n(vEl ?? ""), hl };
    });
    for (const c of cells) {
      if (/Diameter/i.test(c.k)) {
        const r = parseRange(c.v.en);
        if (r) {
          diameterMin = r[0];
          diameterMax = r[1];
        }
      } else if (/Material/i.test(c.k)) material = c.v;
      else if (/Application/i.test(c.k)) application = c.v;
      else if (/Standard/i.test(c.k)) {
        standard = c.v;
        standardHighlight = c.hl;
      }
    }
  } else {
    const fill = body.match(/<line x1="([\d.]+)" y1="0" x2="([\d.]+)" y2="0" class="fill"/);
    if (fill) {
      const min = (parseFloat(fill[1]) - 4) / 192 * 24;
      const max = (parseFloat(fill[2]) - 4) / 192 * 24;
      diameterMin = Math.round(min * 10) / 10;
      diameterMax = Math.round(max * 10) / 10;
    }
    const row = body.match(/<div class="spec-row">([\s\S]*?)<\/div>\s*<\/div>/)?.[1];
    if (row) {
      for (const f of row.matchAll(/<span class="spec-k">([\s\S]*?)<\/span>\s*<span class="spec-v[^"]*">([\s\S]*?)<\/span>/g)) {
        const k = stripTags(f[1]);
        const v = i18n(f[2]);
        if (/Diameter/i.test(k)) {
          const r = parseRange(v.en);
          if (r) {
            diameterMin = r[0];
            diameterMax = r[1];
          }
        } else if (/Material/i.test(k)) material = v;
      }
    }
  }

  products.push({
    code,
    seriesEn: series.en,
    seriesBg: series.bg,
    descEn: desc.en,
    descBg: desc.bg,
    materialEn: material.en,
    materialBg: material.bg,
    diameterMin,
    diameterMax,
    layout,
    coreEn: core.en,
    coreBg: core.bg,
    insulationEn: insulation.en,
    insulationBg: insulation.bg,
    jacketEn: jacket.en,
    jacketBg: jacket.bg,
    applicationEn: application.en,
    applicationBg: application.bg,
    standardEn: standard.en,
    standardBg: standard.bg,
    standardHighlight,
    imageUrl,
    searchText,
    categorySlug,
    order,
  });
}

const outDir = join(__dirname, "..", "prisma");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "seed-data.json");
writeFileSync(outPath, JSON.stringify({ categories, products }, null, 2), "utf8");
console.log(`categories: ${categories.length}`);
console.log(`products: ${products.length}`);
const noMaterial = products.filter((p) => p.layout === "ruler" && !p.materialEn && !p.materialBg).length;
const badLayout = products.filter((p) => p.layout === "ruler" && (p.diameterMin == null || p.diameterMax == null)).length;
console.log(`ruler products missing material: ${noMaterial}`);
console.log(`ruler products missing diameter range: ${badLayout}`);
console.log(`wrote ${outPath}`);
