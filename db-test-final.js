import postgres from "postgres";

const connectionString = "postgresql://postgres.eoboieyyszobkejfzqis:Kgf8cygCvnWUNZKo@aws-0-eu-central-1.pooler.supabase.com:6543/postgres";

console.log("Connecting to database...");

const sql = postgres(connectionString, {
  connect_timeout: 5,
  prepare: false
});

try {
  const result = await sql`SELECT 1 as result`;
  console.log("SUCCESS:", result);
  process.exit(0);
} catch (error) {
  console.error("DATABASE CONNECTION ERROR:", error.message || error);
  process.exit(1);
}
