// Direct script to create kst-001 superadmin user
import postgres from "postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env file
const envContent = readFileSync(join(__dirname, ".env"), "utf-8");
const dbUrl = envContent.match(/DATABASE_URL=(.+)/)?.[1]?.trim();

if (!dbUrl) {
  console.error("❌ DATABASE_URL not found in .env file");
  process.exit(1);
}

const sql = postgres(dbUrl);

async function createUser() {
  try {
    console.log("🔄 Creating superadmin user kst-001...");
    
    // Check if user exists
    const existing = await sql`SELECT id FROM users WHERE id = 'kst-001'`;
    
    if (existing.length > 0) {
      console.log("⚠️  User kst-001 already exists. Updating...");
      await sql`
        UPDATE users SET 
          name = 'Super Administrator',
          email = 'superadmin.kst@kinder.app',
          role = 'super_admin',
          status = 'verified',
          phone = '+254700000099',
          password = 'admin123',
          school_id = NULL,
          class_id = NULL,
          subjects = NULL
        WHERE id = 'kst-001'
      `;
    } else {
      console.log("➕ Creating new user kst-001...");
      await sql`
        INSERT INTO users (
          id, name, email, role, status, phone, 
          registered_at, password, class_id, school_id, subjects
        ) VALUES (
          'kst-001', 
          'Super Administrator', 
          'superadmin.kst@kinder.app', 
          'super_admin', 
          'verified', 
          '+254700000099', 
          CURRENT_DATE, 
          'admin123', 
          NULL, 
          NULL,
          NULL
        )
      `;
    }

    console.log("✅ User created/updated successfully!");
    
    // Verify
    const user = await sql`
      SELECT id, name, email, role, status, school_id, password 
      FROM users 
      WHERE id = 'kst-001'
    `;
    
    if (user.length > 0) {
      console.log("\n✅ Verification successful:");
      console.log("   ID:", user[0].id);
      console.log("   Name:", user[0].name);
      console.log("   Email:", user[0].email);
      console.log("   Role:", user[0].role);
      console.log("   Status:", user[0].status);
      console.log("   School ID:", user[0].school_id || 'NULL (correct for super_admin)');
      console.log("   Password:", user[0].password);
      console.log("\n🔑 You can now login with:");
      console.log("   ID: kst-001");
      console.log("   Password: admin123");
    } else {
      console.log("❌ User not found after creation!");
    }
    
    // List all superadmins
    const superadmins = await sql`
      SELECT id, name, email, role, status 
      FROM users 
      WHERE role = 'super_admin'
      ORDER BY id
    `;
    
    console.log(`\n📋 All superadmin accounts (${superadmins.length}):`);
    superadmins.forEach(u => {
      console.log(`   - ${u.id}: ${u.name} (${u.status})`);
    });
    
  } catch (error) {
    console.error("❌ Failed:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

createUser();
