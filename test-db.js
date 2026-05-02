const postgres = require('postgres');

const sql = postgres({
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  username: 'postgres.ggfoeekvtjqagjkvqmhc',
  password: 'AISellGet09',
  ssl: 'require',
  connect_timeout: 15,
});

sql`SELECT 1 as ok`
  .then(r => { console.log('✅ CONNECTED to Supabase!'); sql.end(); })
  .catch(e => { console.error('❌ Failed:', e.message); sql.end(); });
