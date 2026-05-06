const postgres = require('postgres');
const connectionString = 'postgresql://postgres.ggfoeekvtjqagjkvqmhc:AISellGet09@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require';
const sql = postgres(connectionString, { prepare: false });

async function run() {
  try {
    // Run the exact query that's failing in NextAuth
    const result = await sql`
      SELECT "account"."userId", "account"."type", "account"."provider", "account"."providerAccountId",
             "users"."id", "users"."email", "users"."name"
      FROM "account"
      INNER JOIN "users" ON "account"."userId" = "users"."id"
      WHERE "account"."provider" = 'google' AND "account"."providerAccountId" = 'test'
    `;
    console.log('Query succeeded:', result.length, 'rows');
  } catch (err) {
    console.error('Query failed:', err.message);
    console.error('Error code:', err.code);
  }

  // Check search_path
  const sp = await sql`SHOW search_path`;
  console.log('search_path:', sp[0].search_path);

  // Check if tables exist in other schemas
  const allTables = await sql`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_name IN ('account', 'users', 'session', 'verificationToken')
    ORDER BY table_schema, table_name
  `;
  console.log('\nAll matching tables across schemas:');
  allTables.forEach(t => console.log(`  ${t.table_schema}.${t.table_name}`));

  await sql.end();
}

run();
