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

async function migrate() {
  console.log('🚀 Creating tables in Supabase...\n');

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password_hash TEXT,
        image TEXT,
        role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
        stripe_account_id TEXT,
        stripe_onboarded BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ users table created');

    await sql`
      CREATE TABLE IF NOT EXISTS agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        tag TEXT NOT NULL,
        description TEXT NOT NULL,
        long_desc TEXT NOT NULL,
        price INTEGER NOT NULL,
        asset_key TEXT NOT NULL,
        features TEXT[],
        integrations TEXT[],
        use_cases TEXT[],
        rating INTEGER NOT NULL DEFAULT 0,
        review_count INTEGER NOT NULL DEFAULT 0,
        sales_count INTEGER NOT NULL DEFAULT 0,
        is_approved BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ agents table created');

    await sql`
      CREATE TABLE IF NOT EXISTS purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
        stripe_session_id TEXT NOT NULL UNIQUE,
        amount_paid INTEGER NOT NULL,
        platform_fee INTEGER NOT NULL,
        seller_payout INTEGER NOT NULL,
        purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ purchases table created');

    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ reviews table created');

    console.log('\n🎉 All 4 tables created successfully in Supabase!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await sql.end();
  }
}

migrate();
