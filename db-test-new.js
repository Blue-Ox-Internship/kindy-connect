import postgres from "postgres";

const connectionString = "postgresql://postgres:cNdFqdQgDFeW3ZUy@db.eoboieyyszobkejfzqis.supabase.co:5432/postgres";

console.log("Connecting to new database...");

const sql = postgres(connectionString, {
  connect_timeout: 5,
});

try {
  const result = await sql`SELECT 1 as result`;
  console.log("SUCCESS:", result);
  process.exit(0);
} catch (error) {
  console.error("DATABASE CONNECTION ERROR:", error.message || error);
  process.exit(1);
}
