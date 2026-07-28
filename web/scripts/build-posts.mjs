#!/usr/bin/env node
// Build-time aggregator: reads data/posts/*.json (one file per blog post)
// and writes data/posts.json (the bundle imported by lib/posts.ts).
// Source of truth = data/posts/. The bundle is a generated artifact.
// Mirrors scripts/build-cases.mjs — both share lib/aggregate-json.mjs.
import path from "path";
import { fileURLToPath } from "url";
import { aggregateJsonFiles } from "./lib/aggregate-json.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.join(__dirname, "..", "data", "posts");
const outFile = path.join(__dirname, "..", "data", "posts.json");

// `optional`: the posts directory may not exist in a fresh checkout.
const posts = aggregateJsonFiles(postsDir, outFile, { optional: true });
console.log(`build-posts: aggregated ${posts.length} posts → data/posts.json`);
