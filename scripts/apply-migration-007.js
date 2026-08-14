import postgres from "postgres";
import fs from "fs";
import path from "path";

const envContent = fs.readFileSync(".env", "utf-8");
const match = envContent.match(/^DATABASE_URL=(.+)$/m);
const connectionString = match ? match[1].trim() : process.env.DATABASE_URL;

console.log("Connecting to Database...");
const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    const migrationSql = fs.readFileSync(
      path.join(process.cwd(), "database", "migrations", "007_school_custom_subjects.sql"),
      "utf-8",
    );
    console.log("Running migration 007_school_custom_subjects.sql...");
    await sql.unsafe(migrationSql);
    console.log("Migration 007 applied successfully!");

    const count = await sql`SELECT count(*) FROM subjects`;
    console.log("Total seeded subjects in DB:", count[0].count);

    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
