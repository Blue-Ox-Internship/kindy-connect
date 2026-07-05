// Quick migration script to add subjects column
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env file manually
const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
const dbUrl = envContent.match(/DATABASE_URL=(.+)/)?.[1]?.trim();

if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

const sql = postgres(dbUrl);

async function migrate() {
  try {
    console.log('🔄 Adding subjects column to users table...');
    
    // Add subjects column
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subjects TEXT[]`;
    
    console.log('✅ Successfully added subjects column!');
    
    // Verify
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'subjects'
    `;
    
    if (columns.length > 0) {
      console.log('✅ Verification successful! Column exists:', columns[0]);
    } else {
      console.log('⚠️  Warning: Column not found in verification');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
