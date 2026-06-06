#!/usr/bin/env node
// Build-time RSS 2.0 feed for the blog → public/feed.xml.
// Source of truth = data/posts/*.json. Mirrors build-search-index.mjs:
// a generated static artifact served as-is (works with output: "export").
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.join(__dirname, "..", "data", "posts");
const outFile = path.join(__dirname, "..", "public", "feed.xml");
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://uapcodex.org"
).replace(/\/$/, "");

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const posts = (
  fs.existsSync(postsDir)
    ? fs.readdirSync(postsDir).filter((f) => f.endsWith(".json"))
    : []
)
  .map((f) => JSON.parse(fs.readFileSync(path.join(postsDir, f), "utf-8")))
  .sort((a, b) => b.num - a.num); // newest first

const items = posts
  .map((p) => {
    const url = `${SITE_URL}/blog/${p.id}`;
    return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${esc(p.summary)}</description>
    </item>`;
  })
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>UAP Codex — Blog</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Notas de método y avances del cuaderno de investigación UAP Codex.</description>
    <language>es</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, xml);
console.log(`build-rss: ${posts.length} posts → public/feed.xml`);
