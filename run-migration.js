const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const sql = postgres({
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  username: 'postgres.ggfoeekvtjqagjkvqmhc',
  password: 'AISellGet09',
  ssl: 'require',
  connect_timeout: 15,
});

async function run() {
  const file = fs.readFileSync(path.join(__dirname, 'src/db/migrations/0000_outstanding_roughhouse.sql'), 'utf8');
  console.log('Running migration...');
  try {
    await sql.unsafe('DROP TABLE IF EXISTS account, session, verificationToken, subscriptions, purchases, reviews, agents, users CASCADE;');
    await sql.unsafe(file);
    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await sql.end();
  }
}

run();
