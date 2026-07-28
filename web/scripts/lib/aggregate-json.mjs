// Shared aggregation pattern for build-cases/build-posts/etc.
// Reads individual .json files from a directory, sorts by num field,
// and writes the aggregated array to an output file.
import fs from "node:fs";
import path from "node:path";

/**
 * Aggregates individual JSON files from a directory into a single bundle.
 * @param {string} sourceDir - Directory containing individual .json files
 * @param {string} outFile - Path to write the aggregated JSON
 * @param {object} [options] - Configuration options
 * @param {boolean} [options.optional=false] - If true, returns empty array when dir doesn't exist
 * @returns {any[]} The aggregated array
 */
export function aggregateJsonFiles(sourceDir, outFile, options = {}) {
  const { optional = false } = options;

  if (optional && !fs.existsSync(sourceDir)) {
    const items = [];
    fs.writeFileSync(outFile, JSON.stringify(items, null, 2) + "\n");
    return items;
  }

  const files = fs.readdirSync(sourceDir).filter((f) => f.endsWith(".json"));
  const items = files
    .map((f) => JSON.parse(fs.readFileSync(path.join(sourceDir, f), "utf-8")))
    .sort((a, b) => a.num - b.num);

  fs.writeFileSync(outFile, JSON.stringify(items, null, 2) + "\n");
  return items;
}
