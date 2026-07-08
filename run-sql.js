// Script to run any SQL file against the database
import postgres from "postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get SQL file from command line args
const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("❌ Usage: node run-sql.js <path-to-sql-file>");
  process.exit(1);
}

// Read .env file manually
const envContent = readFileSync(join(__dirname, ".env"), "utf-8");
const dbUrl = envContent.match(/DATABASE_URL=(.+)/)?.[1]?.trim();

if (!dbUrl) {
  console.error("❌ DATABASE_URL not found in .env file");
  process.exit(1);
}

const sql = postgres(dbUrl);

async function runSql() {
  try {
    console.log(`🔄 Running SQL file: ${sqlFile}`);
    
    // Read the SQL file
    const sqlContent = readFileSync(join(__dirname, sqlFile), "utf-8");
    
    // Split by semicolons to run each statement separately
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.toLowerCase() !== 'select');
    
    for (const statement of statements) {
      if (statement) {
        console.log(`  Executing: ${statement.substring(0, 60)}...`);
        await sql.unsafe(statement);
      }
    }

    console.log("✅ SQL file executed successfully!");
    
    // Verify the user was created
    const user = await sql`SELECT id, name, email, role, status, school_id FROM users WHERE id = 'kst-001'`;
    
    if (user.length > 0) {
      console.log("\n✅ User created successfully:");
      console.log(user[0]);
      console.log("\n🔑 Login credentials:");
      console.log("   ID: kst-001");
      console.log("   Password: admin123");
    } else {
      console.log("⚠️  Warning: User not found after creation");
    }
  } catch (error) {
    console.error("❌ Execution failed:", error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runSql();
