/**
 * Runs a .sql file against the project database.
 *
 *   node scripts/db.js supabase/migrations/0019_mentor_services.sql
 *   node scripts/db.js --query "select count(*) from bookings"
 *
 * Lives in the repo rather than a temp folder so it survives between sessions
 * and can be granted permission once, in .claude/settings.local.json.
 *
 * Reads only the password from .env.local, which is gitignored, and builds the
 * connection string here so nothing depends on a hand-assembled URL.
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const ROOT = path.resolve(__dirname, "..");
const PROJECT_REF = "akpkogwmchczuxapnlgy";

// Through the connection pooler rather than db.<ref>.supabase.co, because the
// direct host has an AAAA record and no A record. On a network without working
// IPv6 it does not resolve at all — this script worked in the morning and
// stopped by the evening, with nothing changed but the route out. The pooler
// answers on IPv4 too.
//
// Session mode (5432), not transaction mode (6543). Migrations and the access
// rule tests lean on transactions, temp tables and SET LOCAL ROLE, and session
// mode gives all three exactly as a direct connection would.
const POOLER_HOST = "aws-1-eu-west-1.pooler.supabase.com";

function readPassword() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found");
  }
  const line = fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith("SUPABASE_DB_PASSWORD="));
  if (!line) throw new Error("SUPABASE_DB_PASSWORD missing from .env.local");
  const value = line
    .slice("SUPABASE_DB_PASSWORD=".length)
    .trim()
    .replace(/^["']|["']$/g, "");
  if (!value) throw new Error("SUPABASE_DB_PASSWORD is empty");
  return value;
}

function readSql() {
  const args = process.argv.slice(2);
  const queryFlag = args.indexOf("--query");
  if (queryFlag !== -1) {
    const sql = args[queryFlag + 1];
    if (!sql) throw new Error("--query needs some SQL after it");
    return { label: "inline query", sql };
  }
  const file = args[0];
  if (!file) throw new Error("Pass a .sql file path, or --query \"...\"");
  const full = path.resolve(ROOT, file);
  if (!fs.existsSync(full)) throw new Error(`No such file: ${file}`);
  return { label: file, sql: fs.readFileSync(full, "utf8") };
}

(async () => {
  let client;
  try {
    const { label, sql } = readSql();
    client = new Client({
      // The pooler wants the project ref in the username; the password is the
      // same database password as before.
      connectionString: `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(
        readPassword(),
      )}@${POOLER_HOST}:5432/postgres`,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 20000,
    });
    await client.connect();

    // Postgres notices are how a guarded migration reports what it decided,
    // and swallowing them would hide "already applied — nothing to do".
    client.on("notice", (n) => console.log(`NOTICE: ${n.message}`));

    console.log(`Running ${label}...`);
    const result = await client.query(sql);
    for (const r of Array.isArray(result) ? result : [result]) {
      if (r.rows && r.rows.length) console.table(r.rows);
      else if (r.command) console.log(`${r.command} ok (${r.rowCount ?? 0} rows)`);
    }
    console.log("Done.");
  } catch (err) {
    console.error("DB ERROR:", err.message);
    process.exitCode = 1;
  } finally {
    await client?.end().catch(() => {});
  }
})();
