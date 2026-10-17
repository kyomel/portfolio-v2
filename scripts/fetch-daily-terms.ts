/**
 * Regenerates src/content/daily-terms/ from the daily-term-SE-Growth archive.
 *
 *   bun run fetch:terms                # shallow-clone the repo, then convert
 *   bun run fetch:terms --src <dir>    # convert an existing checkout (offline)
 *
 * One markdown file per term, so Astro renders each term as its own page.
 * .github/workflows/update-daily-terms.yml runs this on a schedule and commits
 * the diff; the push deploys through Workers Builds.
 */

import { spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "https://github.com/swegrowthid/daily-term-SE-Growth";
const OUT_DIR = fileURLToPath(new URL("../src/content/daily-terms/", import.meta.url));

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type ParsedTerm = {
  year: number;
  month: number;
  day: number | null;
  order: number;
  title: string;
  slug: string;
  source: string;
  body: string;
};

function slugify(title: string): string {
  return (
    title
      .normalize("NFKD")
      .replace(/\p{M}+/gu, "")
      .toLowerCase()
      .replace(/['"’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "term"
  );
}

function stripInline(line: string): string {
  return line
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/[*_]+/g, "")
    .trim();
}

function excerptOf(body: string): string {
  const parts: string[] = [];
  let inFence = false;
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim();
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence || line === "") continue;
    if (line.startsWith("#") || line.startsWith("|") || line.startsWith("!") || line.startsWith(">")) continue;
    const text = stripInline(line.replace(/^[-*+]\s+/, "").replace(/^\d+[.)]\s+/, ""));
    if (text) parts.push(text);
    if (parts.join(" ").length > 170) break;
  }
  const joined = parts.join(" ");
  return joined.length > 200 ? `${joined.slice(0, 197).trimEnd()}...` : joined;
}

function parseMonthFile(text: string, year: number, month: number, source: string): ParsedTerm[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const raw: { day: number | null; title: string; body: string[] }[] = [];
  let day: number | null = null;
  let current: (typeof raw)[number] | null = null;

  for (const line of lines) {
    // day markers appear as plain lines and as headings ("## day - 24")
    const dayMatch = /^day\s*[-:]\s*(\d+)/i.exec(line.replace(/^#{1,6}\s+/, ""));
    if (dayMatch) {
      day = Number(dayMatch[1]);
      continue;
    }
    if (line.startsWith("## ")) {
      const text = line.slice(3).trim();
      // august 2025 writes section labels as H2 ("## Definition:"); they
      // belong to the term above, they are not terms of their own
      if (/^(definition|example)s?\s*:?\s*$/i.test(text)) {
        if (current) current.body.push(line);
        continue;
      }
      if (current) raw.push(current);
      // NFKC folds mathematical bold titles ("𝗦𝘁𝗿𝗮𝗻𝗴𝗹𝗲𝗿") into plain text
      current = { day, title: text.normalize("NFKC"), body: [] };
      continue;
    }
    if (/^-{3,}\s*$/.test(line)) continue; // entry separators
    if (current) current.body.push(line);
  }
  if (current) raw.push(current);

  return raw
    .filter((term) => term.title.length > 0)
    .map((term, index) => ({
      year,
      month,
      day: term.day,
      order: index + 1,
      title: term.title,
      slug: slugify(term.title),
      source,
      body: term.body.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
    }));
}

function entryFile(term: ParsedTerm): string {
  const sourceUrl = `https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/${term.source}`;
  const frontmatter = [
    "---",
    `title: ${JSON.stringify(term.title)}`,
    `termSlug: ${JSON.stringify(term.slug)}`,
    `year: ${term.year}`,
    `month: ${term.month}`,
    `monthName: ${JSON.stringify(MONTH_NAMES[term.month])}`,
    `day: ${term.day ?? "null"}`,
    `order: ${term.order}`,
    `source: ${JSON.stringify(term.source)}`,
    `sourceUrl: ${JSON.stringify(sourceUrl)}`,
    `excerpt: ${JSON.stringify(excerptOf(term.body))}`,
    "---",
    "",
  ].join("\n");
  return `${frontmatter}${term.body}\n`;
}

async function main() {
  const argv = process.argv.slice(2);
  const srcIndex = argv.indexOf("--src");
  const explicitSrc = srcIndex >= 0 ? argv[srcIndex + 1] : undefined;

  let srcDir: string;
  let tempClone = false;
  if (explicitSrc) {
    srcDir = resolve(explicitSrc);
  } else {
    srcDir = join(tmpdir(), `daily-term-se-growth-${process.pid}`);
    const clone = spawnSync(
      "git",
      ["clone", "--depth", "1", "--single-branch", REPO, srcDir],
      { stdio: ["ignore", "ignore", "inherit"] },
    );
    if (clone.status !== 0) throw new Error(`git clone failed with status ${clone.status}`);
    tempClone = true;
  }

  try {
    const files = new Map<string, string>();
    const slugCount = new Map<string, number>();
    const uniqueSlug = (term: ParsedTerm): string => {
      const key = `${term.year}-${term.month}-${term.slug}`;
      const seen = slugCount.get(key) ?? 0;
      slugCount.set(key, seen + 1);
      return seen === 0 ? term.slug : `${term.slug}-${seen + 1}`;
    };

    const years = (await readdir(srcDir, { withFileTypes: true }))
      .filter((dir) => dir.isDirectory() && /^\d{4}$/.test(dir.name))
      .map((dir) => dir.name)
      .sort();

    let total = 0;
    for (const year of years) {
      const names = (await readdir(join(srcDir, year)))
        .filter((name) => /^[a-z]+-term\.md$/i.test(name))
        .sort();
      for (const name of names) {
        const month = MONTHS[name.slice(0, 3).toLowerCase()];
        if (!month) {
          console.warn(`skip ${year}/${name}: unknown month`);
          continue;
        }
        const source = `${year}/${name}`;
        const text = await readFile(join(srcDir, source), "utf8");
        const parsed = parseMonthFile(text, Number(year), month, source);
        for (const term of parsed) {
          const slug = uniqueSlug(term);
          files.set(`${year}-${String(month).padStart(2, "0")}-${slug}.md`, entryFile({ ...term, slug }));
        }
        console.log(`${source}: ${parsed.length} terms`);
        total += parsed.length;
      }
    }
    if (total === 0) throw new Error("no terms parsed; the archive layout may have changed");

    await mkdir(OUT_DIR, { recursive: true });
    let removed = 0;
    for (const name of (await readdir(OUT_DIR)).filter((name) => name.endsWith(".md"))) {
      if (!files.has(name)) {
        await unlink(join(OUT_DIR, name));
        removed += 1;
      }
    }
    let changed = 0;
    for (const [name, content] of files) {
      const target = join(OUT_DIR, name);
      const before = await readFile(target, "utf8").catch(() => null);
      if (before !== content) {
        await writeFile(target, content);
        changed += 1;
      }
    }
    console.log(`total ${total} terms across ${years.length} years, ${changed} written, ${removed} removed`);
  } finally {
    if (tempClone) await rm(srcDir, { recursive: true, force: true });
  }
}

await main();
