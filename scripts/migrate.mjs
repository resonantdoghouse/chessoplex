import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ref = process.env.SUPABASE_PROJECT_REF;
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!ref || !token) {
  console.error("ERROR: SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN must be set in .env.local");
  console.error("Get your access token at: https://supabase.com/dashboard/account/tokens");
  process.exit(1);
}

const sql = readFileSync(
  resolve(__dirname, "../supabase/migrations/20260430000000_initial_schema.sql"),
  "utf8",
);

console.log("Running migration against project:", ref);

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

const body = await res.json().catch(() => ({}));

if (!res.ok) {
  const msg = body?.message ?? JSON.stringify(body);
  if (msg.includes("already exists")) {
    console.log("✓ Already applied — schema is up to date.");
  } else {
    console.error("Migration failed:", res.status, msg);
    process.exit(1);
  }
} else {
  console.log("✓ Migration complete.");
}
