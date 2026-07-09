import postgres from "postgres";

// Initialize PostgreSQL client.
// In TanStack Start (running on Nitro), process.env is populated from the .env file.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("WARNING: DATABASE_URL is not set in environment variables!");
}

export const sql = postgres(connectionString || "", {
  // Keep pool small — Supabase free tier allows limited concurrent connections
  max: 5,
  // Close idle connections quickly to free up Supabase pool slots
  idle_timeout: 30,
  // Allow 30 seconds for connection — Supabase free tier can take up to 20s to wake
  connect_timeout: 30,
  // Recycle connections every 10 minutes
  max_lifetime: 60 * 10,
  // REQUIRED for Supabase PgBouncer in transaction mode (default pooler)
  // Without this, prepared statements fail on pooled connections
  prepare: false,
  // Suppress notices
  onnotice: () => {},
});

/**
 * Deeply converts an object's keys from snake_case to camelCase
 */
export function toCamel<T = any>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamel(v)) as any;
  } else if (obj !== null && obj !== undefined && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
      result[camelKey] = toCamel(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}

/**
 * Deeply converts an object's keys from camelCase to snake_case
 */
export function toSnake<T = any>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnake(v)) as any;
  } else if (obj !== null && obj !== undefined && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnake(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}

/**
 * Set Row Level Security (RLS) context for multi-tenant queries
 * Sets PostgreSQL session variables used by RLS policies
 * @param sql - PostgreSQL client instance
 * @param userId - ID of the authenticated user
 */
export async function setRLSContext(sql: any, userId: string) {
  // Query user to get role and school_id
  const users = await sql`SELECT role, school_id FROM users WHERE id = ${userId}`;
  
  if (users.length === 0) {
    throw new Error("Unauthorized: User not found");
  }
  
  const user = users[0];
  
  // Set user_id for all users
  await sql`SET LOCAL app.user_id = ${userId}`;
  
  // Set school_id only for school-scoped users (not super_admin)
  if (user.role !== 'super_admin' && user.school_id) {
    await sql`SET LOCAL app.school_id = ${user.school_id}`;
  }
  
  return { role: user.role, schoolId: user.school_id };
}
