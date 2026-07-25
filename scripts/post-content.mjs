/**
 * Posts articles from content-data.json to the NatalTruth API.
 * Usage: node scripts/post-content.mjs [--host URL]
 */
import { readFileSync } from "node:fs";
import process from "node:process";

const HOST = process.argv.includes("--host")
  ? process.argv[process.argv.indexOf("--host") + 1]
  : process.env.HOST || "http://localhost:8717";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "naoufac@nataltruth.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const articles = JSON.parse(readFileSync(new URL("./content-data.json", import.meta.url), "utf8"));

async function main() {
  console.log(`Host: ${HOST}`);
  if (!ADMIN_PASSWORD) { console.error("ADMIN_PASSWORD required"); process.exit(1); }

  // Login
  const loginRes = await fetch(`${HOST}/api/auth/login`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!loginRes.ok) { console.error(`Login failed: ${loginRes.status}`); process.exit(1); }
  const cookie = loginRes.headers.get("set-cookie")?.split(";")[0];
  console.log("Logged in as admin.");

  // Get existing slugs
  const existing = await fetch(`${HOST}/api/admin/posts`, { headers: { cookie } }).then((r) => r.json());
  const existingSlugs = new Set(existing.posts?.map((p) => p.slug) || []);
  console.log(`Existing posts: ${existingSlugs.size}`);

  let created = 0, skipped = 0, failed = 0;
  for (const article of articles) {
    if (existingSlugs.has(article.slug)) { skipped++; continue; }
    const res = await fetch(`${HOST}/api/admin/posts`, {
      method: "POST", headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(article),
    });
    if (res.ok) {
      created++;
      if (created % 20 === 0) console.log(`  ...${created} created`);
    } else {
      failed++;
      console.error(`  FAIL: ${article.slug} (${res.status})`);
    }
  }
  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}, Failed: ${failed}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
