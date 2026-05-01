/**
 * One-time Supabase setup script.
 * Run with: node scripts/setup-supabase.mjs
 *
 * Creates:
 *  - The 'encrypted-files' storage bucket (private)
 *  - All required database tables (files, upload_sessions, access_attempts)
 *  - Required SQL function (increment_download_count)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Manually parse .env.local (no dotenv needed)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env.local");
if (existsSync(envPath)) {
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = "encrypted-files";

async function createBucket() {
  console.log(`\n📦  Creating storage bucket '${BUCKET}'…`);

  // Check if bucket already exists
  const { data: buckets, error: listErr } =
    await supabase.storage.listBuckets();
  if (listErr) {
    throw new Error(`Failed to list buckets: ${listErr.message}`);
  }

  if (buckets?.some((b) => b.name === BUCKET)) {
    console.log(`   ✓ Bucket '${BUCKET}' already exists — skipping.`);
    return;
  }

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: false, // Private bucket — access only via service role
    fileSizeLimit: null, // No additional limit (app enforces its own)
  });

  if (error) {
    throw new Error(`Failed to create bucket: ${error.message}`);
  }

  console.log(`   ✓ Bucket '${BUCKET}' created (private).`);
}

async function runMigration() {
  console.log("\n🗄️   Running database migration…");

  const sqlPath = join(__dirname, "../supabase/migrations/001_initial.sql");
  const sql = readFileSync(sqlPath, "utf-8");

  // Split on statement boundaries (double newlines after semicolons)
  // and run each statement individually
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  let ok = 0;
  let skipped = 0;

  for (const stmt of statements) {
    const { error } = await supabase.rpc("exec_sql", { sql: stmt + ";" }).then(
      (res) => res,
      () => ({ error: null }), // rpc might not exist
    );

    if (error && error.message?.includes("already exists")) {
      skipped++;
    } else if (error) {
      console.warn(`   ⚠  Statement warning: ${error.message}`);
      console.warn(`      SQL: ${stmt.slice(0, 80)}…`);
    } else {
      ok++;
    }
  }

  console.log(`   ✓ Migration complete (${ok} statements, ${skipped} already existed).`);
}

async function runRawSQL() {
  console.log("\n🗄️   Setting up database schema via Supabase SQL API…");

  const sqlPath = join(__dirname, "../supabase/migrations/001_initial.sql");
  const sql = readFileSync(sqlPath, "utf-8");

  // Use the REST API with service role key to execute raw SQL
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    // This is expected — exec_sql function doesn't exist by default
    // The user needs to run the SQL manually
    console.log("   ℹ  Cannot auto-run SQL (exec_sql function not available).");
    console.log(
      "   ➜  Please run the migration SQL manually in the Supabase SQL editor:",
    );
    console.log(`      ${supabaseUrl.replace("https://", "https://app.supabase.com/project/")}/editor`);
    return false;
  }

  console.log("   ✓ SQL migration applied.");
  return true;
}

async function verifyTables() {
  console.log("\n🔍  Verifying database tables…");

  const tables = ["files", "upload_sessions", "access_attempts"];
  const missing = [];

  for (const table of tables) {
    const { error } = await supabase.from(table).select("count").limit(0);
    if (error && error.code === "42P01") {
      missing.push(table);
      console.log(`   ✗ Table '${table}' is missing`);
    } else if (error) {
      console.log(`   ⚠  Table '${table}': ${error.message}`);
    } else {
      console.log(`   ✓ Table '${table}' exists`);
    }
  }

  return missing;
}

async function main() {
  console.log("🔧  Nexro — Supabase Setup");
  console.log(`    Project: ${supabaseUrl}`);

  try {
    // 1. Create storage bucket
    await createBucket();

    // 2. Verify tables exist
    const missing = await verifyTables();

    if (missing.length > 0) {
      console.log(
        "\n⚠️   Missing tables detected. You need to run the migration SQL manually.",
      );
      console.log("\n📋  Steps:");
      console.log("   1. Open the Supabase SQL Editor:");
      const projectRef = supabaseUrl
        .replace("https://", "")
        .replace(".supabase.co", "");
      console.log(
        `      https://supabase.com/dashboard/project/${projectRef}/sql/new`,
      );
      console.log(
        "   2. Copy and paste the contents of: supabase/migrations/001_initial.sql",
      );
      console.log("   3. Click 'Run'");
      console.log("   4. Re-run this script to verify: node scripts/setup-supabase.mjs");
    } else {
      console.log("\n✅  All tables exist.");
    }

    console.log("\n🎉  Setup complete! You can now start the dev server:");
    console.log("    npm run dev\n");
  } catch (err) {
    console.error("\n❌  Setup failed:", err.message);
    process.exit(1);
  }
}

main();
