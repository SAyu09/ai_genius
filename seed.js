const postgres = require('postgres');

const sql = postgres({
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  username: 'postgres.ggfoeekvtjqagjkvqmhc',
  password: 'AISellGet09',
  ssl: 'require',
});

async function seed() {
  console.log('🌱 Seeding sample agents into Supabase...\n');

  try {
    // 1. Get a seller (using the first user or creating a system seller)
    const [systemSeller] = await sql`
      INSERT INTO users (email, name, role)
      VALUES ('hello@sellgetai.com', 'Lumen Labs', 'seller')
      ON CONFLICT (email) DO UPDATE SET role = 'seller'
      RETURNING id
    `;

    // 2. Insert sample agents
    const sampleAgents = [
      {
        seller_id: systemSeller.id,
        slug: 'atlas-sdr',
        name: 'Atlas SDR',
        tag: 'Sales',
        description: 'Autonomous sales development representative that books meetings 24/7.',
        long_desc: 'Atlas SDR uses advanced LLMs to research prospects, write hyper-personalized emails, and book meetings directly in your calendar. It integrates with LinkedIn, Apollo, and Gmail.',
        price: 4900,
        asset_key: 'agents/atlas-sdr.zip',
        features: ['Lead Research', 'Email Automation', 'Calendar Booking'],
        integrations: ['Gmail', 'LinkedIn', 'Slack'],
        use_cases: ['B2B Sales', 'Recruiting', 'Event Attendance'],
        rating: 48,
        review_count: 12,
        sales_count: 1420,
        is_approved: true
      },
      {
        seller_id: systemSeller.id,
        slug: 'pulse-analytics',
        name: 'Pulse Analytics',
        tag: 'Data',
        description: 'AI-driven business intelligence that predicts churn before it happens.',
        long_desc: 'Pulse connects to your database and identifies patterns that human analysts miss. Get daily reports on health scores, churn risks, and expansion opportunities.',
        price: 8900,
        asset_key: 'agents/pulse.zip',
        features: ['Churn Prediction', 'Revenue Forecasting', 'Auto-Reporting'],
        integrations: ['Strip', 'PostgreSQL', 'HubSpot'],
        use_cases: ['SaaS Ops', 'Financial Analysis'],
        rating: 49,
        review_count: 8,
        sales_count: 850,
        is_approved: true
      },
      {
        seller_id: systemSeller.id,
        slug: 'quill-writer',
        name: 'Quill Ghostwriter',
        tag: 'Content',
        description: 'Creates SEO-optimized blog posts and social threads in your unique voice.',
        long_desc: 'Quill analyzes your previous writing to mimic your tone, style, and vocabulary. It researches facts on the fly and optimizes for both humans and search engines.',
        price: 3500,
        asset_key: 'agents/quill.zip',
        features: ['Voice Cloning', 'Fact Checking', 'SEO Optimization'],
        integrations: ['WordPress', 'X / Twitter', 'Ghost'],
        use_cases: ['Content Marketing', 'Personal Branding'],
        rating: 45,
        review_count: 24,
        sales_count: 2100,
        is_approved: true
      }
    ];

    for (const agent of sampleAgents) {
      await sql`
        INSERT INTO agents ${sql(agent)}
        ON CONFLICT (slug) DO NOTHING
      `;
      console.log(`✅ Seeded: ${agent.name}`);
    }

    console.log('\n🎉 Seeding complete!');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    await sql.end();
  }
}

seed();
