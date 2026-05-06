const postgres = require('postgres');
const connectionString = 'postgresql://postgres.ggfoeekvtjqagjkvqmhc:AISellGet09@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require';
const sql = postgres(connectionString, { prepare: false });

async function run() {
  // Check all columns in the account table
  const accountCols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'account'
    ORDER BY ordinal_position
  `;
  console.log('=== account table columns ===');
  accountCols.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));

  const usersCols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users'
    ORDER BY ordinal_position
  `;
  console.log('\n=== users table columns ===');
  usersCols.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));

  // Check existing data
  const accounts = await sql`SELECT * FROM account LIMIT 5`;
  console.log('\n=== account rows ===', accounts.length);
  accounts.forEach(a => console.log(`  provider=${a.provider} providerAccountId=${a.providerAccountId} userId=${a.userId}`));

  const users = await sql`SELECT id, email, name, role FROM users LIMIT 5`;
  console.log('\n=== users rows ===', users.length);
  users.forEach(u => console.log(`  id=${u.id} email=${u.email} name=${u.name} role=${u.role}`));

  await sql.end();
}

run();
