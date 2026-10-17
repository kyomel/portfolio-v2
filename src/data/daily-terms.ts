import type { CollectionEntry } from "astro:content";

/** Shared helpers for the /daily-terms/ pages. */

export const DAILY_TERMS_REPO = "https://github.com/swegrowthid/daily-term-SE-Growth";

export type DailyTerm = CollectionEntry<"dailyTerms">;

/** Chronological order, oldest first: year, then month, then position in the month. */
export const byOldest = (a: DailyTerm, b: DailyTerm) =>
  a.data.year - b.data.year ||
  a.data.month - b.data.month ||
  a.data.order - b.data.order;

/** Canonical URL of one term page; the month is zero-padded for sortability. */
export const termHref = (term: DailyTerm) =>
  `/daily-terms/${term.data.year}/${String(term.data.month).padStart(2, "0")}/${term.data.termSlug}/`;
