#!/usr/bin/env node
// Scrapes every openhands.dev blog post listed in the sitemap into one JSON
// file per post: { slug, url, title, date, description, text }.
// Usage: node scripts/scrape-openhands-articles.mjs <outDir>
import fs from "node:fs";
import path from "node:path";

const SITE = "https://openhands.dev";
const outDir = process.argv[2];
if (!outDir) {
  console.error("usage: scrape-openhands-articles.mjs <outDir>");
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

const meta = (html, key) => {
  const m =
    html.match(
      new RegExp(`<meta[^>]+(?:property|name)="${key}"[^>]+content="([^"]*)"`, "i"),
    ) ||
    html.match(
      new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="${key}"`, "i"),
    );
  return m ? decode(m[1]) : "";
};

// KaTeX renders each formula twice (MathML + HTML) and swallows the "$"
// delimiters, which turns "$0.25-$2" into duplicated fragments. Replace the
// whole formula with its TeX source in "$...$".
function flattenKatex(html) {
  let out = "";
  let i = 0;
  const open = '<span class="katex">';
  for (;;) {
    const start = html.indexOf(open, i);
    if (start === -1) return out + html.slice(i);
    out += html.slice(i, start);
    let depth = 0;
    let j = start;
    const tag = /<(\/?)span\b[^>]*>/g;
    tag.lastIndex = start;
    for (let m = tag.exec(html); m; m = tag.exec(html)) {
      depth += m[1] ? -1 : 1;
      j = tag.lastIndex;
      if (depth === 0) break;
    }
    const tex = html.slice(start, j).match(/<annotation[^>]*>([\s\S]*?)<\/annotation>/)?.[1] ?? "";
    out += `$${tex}$`;
    i = j;
  }
}

function htmlToText(html) {
  const body = flattenKatex(html.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? html);
  return decode(
    body
      .replace(/<(script|style|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, "")
      .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|pre)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li[^>]*>/gi, "- ")
      .replace(/<[^>]+>/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n+/g, "\n\n"),
  ).trim();
}

const sitemap = await (await fetch(`${SITE}/sitemap.xml`)).text();
const slugs = [
  ...new Set(
    [...sitemap.matchAll(/<loc>https:\/\/(?:www\.)?openhands\.dev\/blog\/([^<\/]+)<\/loc>/g)].map(
      (m) => m[1],
    ),
  ),
];
console.log(`${slugs.length} posts in sitemap`);

let failed = 0;
for (const slug of slugs) {
  try {
    const res = await fetch(`${SITE}/blog/${slug}`);
    if (!res.ok) throw new Error(String(res.status));
    const html = await res.text();
    const date =
      meta(html, "article:published_time") ||
      html.match(/"datePublished":"([^"]+)"/)?.[1] ||
      "";
    const post = {
      slug,
      url: `${SITE}/blog/${slug}`,
      title: meta(html, "og:title") || html.match(/<title>([^<]*)/)?.[1] || slug,
      date: date.slice(0, 10),
      description: meta(html, "og:description"),
      text: htmlToText(html),
    };
    fs.writeFileSync(path.join(outDir, `${slug}.json`), JSON.stringify(post, null, 2));
  } catch (e) {
    failed += 1;
    console.error(`FAILED ${slug}: ${e.message}`);
  }
}
console.log(`done, ${failed} failed`);
