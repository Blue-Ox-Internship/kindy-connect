const postgres = require("postgres");
const fs = require("fs");
const path = require("path");

// Manually parse the .env file
const envPath = "./.env";
let databaseUrl = "";

try {
  const envContent = fs.readFileSync(envPath, "utf8");
  const match = envContent.match(/DATABASE_URL\s*=\s*(.+)/);
  if (match) {
    databaseUrl = match[1].trim();
  }
} catch (err) {
  console.error("Error reading .env file:", err);
  process.exit(1);
}

if (!databaseUrl) {
  console.error("DATABASE_URL is not set in your .env file!");
  process.exit(1);
}

console.log("Connecting to Supabase...");
const sql = postgres(databaseUrl);

async function run() {
  try {
    console.log("Reading database/schema.sql...");
    const schemaSql = fs.readFileSync("./database/schema.sql", "utf8");

    console.log("Applying schema to database...");
    // unsafe() is used to run multi-query raw SQL strings
    await sql.unsafe(schemaSql);
    console.log("Schema applied successfully!");

    console.log("Reading database/seed.sql...");
    const seedSql = fs.readFileSync("./database/seed.sql", "utf8");

    console.log("Applying seed data...");
    await sql.unsafe(seedSql);
    console.log("Seed data inserted successfully!");

    console.log(
      "\nMigration and seeding completed successfully! All tables and mock data are now live in Supabase.",
    );
    process.exit(0);
  } catch (err) {
    console.error("\nError running database setup:", err);
    process.exit(1);
  }
}

run();
