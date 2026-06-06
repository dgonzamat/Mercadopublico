#!/usr/bin/env node
// Build-time aggregator: reads data/posts/*.json (one file per blog post)
// and writes data/posts.json (the bundle imported by lib/posts.ts).
// Source of truth = data/posts/. The bundle is a generated artifact.
// Mirrors scripts/build-cases.mjs.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.join(__dirname, "..", "data", "posts");
const outFile = path.join(__dirname, "..", "data", "posts.json");

const files = fs.existsSync(postsDir)
  ? fs.readdirSync(postsDir).filter((f) => f.endsWith(".json"))
  : [];
const posts = files
  .map((f) => JSON.parse(fs.readFileSync(path.join(postsDir, f), "utf-8")))
  .sort((a, b) => a.num - b.num);

fs.writeFileSync(outFile, JSON.stringify(posts, null, 2) + "\n");
console.log(`build-posts: aggregated ${posts.length} posts → data/posts.json`);
