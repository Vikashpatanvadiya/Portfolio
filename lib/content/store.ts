import { promises as fs } from "node:fs";
import path from "node:path";
import seed from "@/content/site.json";
import { normalizeContent } from "./normalize";
import type { SiteContent } from "./types";

/* ------------------------------------------------------------------ */
/*  storage                                                             */
/*  - Upstash Redis (REST) when its env vars exist — used on Vercel     */
/*  - otherwise content/site.json on disk — used in local dev           */
/* ------------------------------------------------------------------ */

export const CONTENT_TAG = "site-content";
const KEY = "portfolio:content";
const FILE = path.join(process.cwd(), "content", "site.json");

const redis = (() => {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
})();

export const storageMode = redis ? "redis" : process.env.VERCEL ? "readonly" : "file";

export async function getContent(): Promise<SiteContent> {
  if (redis) {
    try {
      const res = await fetch(`${redis.url}/get/${KEY}`, {
        headers: { Authorization: `Bearer ${redis.token}` },
        cache: "force-cache",
        next: { tags: [CONTENT_TAG] },
      });
      const { result } = (await res.json()) as { result: string | null };
      if (result) return normalizeContent(JSON.parse(result));
    } catch (e) {
      console.error("[content] redis read failed, using seed", e);
    }
    return normalizeContent(seed);
  }
  if (storageMode === "file") {
    try {
      return normalizeContent(JSON.parse(await fs.readFile(FILE, "utf8")));
    } catch {
      /* fall through to the bundled seed */
    }
  }
  return normalizeContent(seed);
}

export async function writeContent(content: SiteContent): Promise<void> {
  const json = JSON.stringify(content, null, 2);
  if (redis) {
    const res = await fetch(redis.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${redis.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["SET", KEY, json]),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Redis write failed (${res.status})`);
    return;
  }
  if (storageMode === "readonly") {
    throw new Error(
      "No database connected. Add Upstash Redis to this Vercel project (Storage tab) so admin edits can be saved."
    );
  }
  await fs.writeFile(FILE, json + "\n", "utf8");
}
