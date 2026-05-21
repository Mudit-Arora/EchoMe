#!/usr/bin/env node
// Fetches URLs listed in scripts/sources.json, strips them to plain text,
// and writes one .txt file per URL into lib/sources/.
//
// Usage: npm run scrape
//
// NOTE: LinkedIn blocks anonymous scraping. To include LinkedIn content, copy
// the visible text from your profile page and save it as lib/sources/linkedin.txt
// manually — that file will be picked up alongside the scraped ones.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SOURCES_FILE = path.join(ROOT, "scripts", "sources.json");
const OUT_DIR = path.join(ROOT, "lib", "sources");

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(url) {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase()
    .slice(0, 80);
}

async function main() {
  if (!fs.existsSync(SOURCES_FILE)) {
    console.error(`Missing ${SOURCES_FILE}. Create it with a JSON array of URLs, e.g.:\n[\n  "https://your-site.com",\n  "https://your-site.com/about"\n]`);
    process.exit(1);
  }

  const urls = JSON.parse(fs.readFileSync(SOURCES_FILE, "utf8"));
  if (!Array.isArray(urls) || urls.length === 0) {
    console.error("scripts/sources.json must be a non-empty JSON array of URLs.");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const url of urls) {
    process.stdout.write(`Fetching ${url}... `);
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (intro-voice scraper)",
        },
      });
      if (!res.ok) {
        console.log(`FAILED (${res.status})`);
        continue;
      }
      const html = await res.text();
      const text = htmlToText(html);
      const slug = slugify(url) || "page";
      const out = path.join(OUT_DIR, `${slug}.txt`);
      fs.writeFileSync(out, `URL: ${url}\n\n${text}\n`);
      console.log(`ok (${text.length} chars) -> ${path.relative(ROOT, out)}`);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }
  }

  console.log("\nDone. Edit lib/sources/*.txt to trim noise if needed.");
  console.log("For LinkedIn, paste your profile text into lib/sources/linkedin.txt manually.");
}

main();
