import fs from "node:fs";
import path from "node:path";
import { BIO } from "./bio";

const SOURCES_DIR = path.join(process.cwd(), "lib", "sources");

function loadSources(): string {
  if (!fs.existsSync(SOURCES_DIR)) return "";
  const files = fs.readdirSync(SOURCES_DIR).filter((f) => !f.startsWith("."));
  if (files.length === 0) return "";
  return files
    .map((f) => {
      const text = fs.readFileSync(path.join(SOURCES_DIR, f), "utf8").trim();
      return `=== source: ${f} ===\n${text}`;
    })
    .join("\n\n");
}

export function buildContext(): string {
  const sources = loadSources();
  if (!sources) return BIO;
  return `${BIO}\n\n# Raw source material (ground truth — synthesize from here)\n\n${sources}`;
}
