const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    // Modify agents table
    await sql`
      ALTER TABLE agents 
      ADD COLUMN IF NOT EXISTS type text DEFAULT 'hosted' NOT NULL,
      ADD COLUMN IF NOT EXISTS pricing_model text DEFAULT 'subscription' NOT NULL,
      ADD COLUMN IF NOT EXISTS monthly_price_paise integer,
      ADD COLUMN IF NOT EXISTS annual_price_paise integer,
      ADD COLUMN IF NOT EXISTS stripe_price_id_monthly text,
      ADD COLUMN IF NOT EXISTS stripe_price_id_annual text;
    `;

    // Modify purchases table
    await sql`
      ALTER TABLE purchases
      ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES users(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES subscriptions(id),
      ADD COLUMN IF NOT EXISTS stripe_payment_id text,
      ADD COLUMN IF NOT EXISTS currency text DEFAULT 'inr',
      ADD COLUMN IF NOT EXISTS type text DEFAULT 'one_time' NOT NULL,
      ADD COLUMN IF NOT EXISTS settlement_status text DEFAULT 'pending' NOT NULL,
      ADD COLUMN IF NOT EXISTS settlement_id uuid;
    `;

    // Create new tables
    await sql`
      CREATE TABLE IF NOT EXISTS seller_profiles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        business_name text,
        settlement_status text DEFAULT 'pending_details',
        tos_accepted_at timestamp,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS seller_bank_details (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        account_holder_name text NOT NULL,
        bank_name text NOT NULL,
        account_number_encrypted text NOT NULL,
        ifsc_code text NOT NULL,
        account_type text DEFAULT 'savings' NOT NULL,
        upi_id_encrypted text,
        pan_number_encrypted text NOT NULL,
        gst_number text,
        is_verified boolean DEFAULT false,
        verified_at timestamp,
        verified_by uuid REFERENCES users(id),
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS seller_settlements (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        period_start timestamp NOT NULL,
        period_end timestamp NOT NULL,
        gross_payout_paise integer NOT NULL,
        tds_deducted_paise integer DEFAULT 0 NOT NULL,
        refund_deductions_paise integer DEFAULT 0 NOT NULL,
        net_payout_paise integer NOT NULL,
        bank_reference_number text,
        status text DEFAULT 'processing' NOT NULL,
        failure_reason text,
        initiated_by uuid REFERENCES users(id),
        settled_at timestamp,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    // Add seller_id to purchases based on agent_id (for existing data)
    await sql`
      UPDATE purchases p
      SET seller_id = a.seller_id
      FROM agents a
      WHERE p.agent_id = a.id AND p.seller_id IS NULL;
    `;

    console.log("Database schema updated successfully.");
  } catch (err) {
    console.error("Error updating database schema:", err);
  } finally {
    await sql.end();
  }
}

main();
