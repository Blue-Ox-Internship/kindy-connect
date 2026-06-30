import postgres from "postgres";

// Initialize PostgreSQL client.
// In TanStack Start (running on Nitro), process.env is populated from the .env file.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("WARNING: DATABASE_URL is not set in environment variables!");
}

export const sql = postgres(connectionString || "", {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
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
