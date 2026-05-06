const postgres = require('postgres');
const connectionString = 'postgresql://postgres.ggfoeekvtjqagjkvqmhc:AISellGet09@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require';
const sql = postgres(connectionString, { prepare: false });

async function run() {
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `;
  console.log('Tables in public schema:');
  tables.forEach(t => console.log(`- ${t.table_name}`));
  await sql.end();
}

run();
