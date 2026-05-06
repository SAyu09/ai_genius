const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Use the ACTUAL database from .env
const connectionString = 'postgresql://postgres.rvvwqoetqbiiohsrbiek:40Rertysh123pr@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';
const sql = postgres(connectionString, { prepare: false });

async function run() {
  // Check existing tables first
  const tables = await sql`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
  `;
  console.log('Existing tables:', tables.map(t => t.table_name));

  // Run all migrations
  const migrationsDir = path.join(__dirname, 'src/backend/db/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`\nFound ${files.length} migration files.`);

  for (const file of files) {
    console.log(`Running ${file}...`);
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await sql.unsafe(content);
      console.log(`  ✅ Completed ${file}`);
    } catch (err) {
      console.error(`  ❌ Failed ${file}: ${err.message}`);
    }
  }

  // Verify final state
  const finalTables = await sql`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
  `;
  console.log('\nFinal tables:', finalTables.map(t => t.table_name));

  await sql.end();
}

run();
