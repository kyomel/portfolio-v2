import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { byOldest, termHref } from "../../data/daily-terms";

/**
 * Client-side search index for /daily-terms/: titles plus excerpts, fetched
 * lazily on first focus. Short keys keep the payload small (~20 KB gzipped).
 */
export const GET: APIRoute = async () => {
  const terms = (await getCollection("dailyTerms")).sort(byOldest);
  const data = terms.map((term) => ({
    t: term.data.title,
    u: termHref(term),
    m: `${term.data.monthName.slice(0, 3)} ${term.data.year}${
      term.data.day !== null ? ` · day ${term.data.day}` : ""
    }`,
    e: term.data.excerpt,
  }));
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
