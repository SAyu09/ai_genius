const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    // Drop existing functions and triggers if they exist to be idempotent
    await sql`DROP TRIGGER IF EXISTS trg_update_subscriber_count ON subscriptions;`;
    await sql`DROP FUNCTION IF EXISTS update_agent_subscriber_count();`;

    // Create the trigger function
    await sql`
      CREATE FUNCTION update_agent_subscriber_count()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
          UPDATE agents SET subscriber_count = subscriber_count + 1 WHERE id = NEW.agent_id;
        ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
          UPDATE agents SET subscriber_count = subscriber_count - 1 WHERE id = OLD.agent_id;
        ELSIF TG_OP = 'UPDATE' THEN
          IF NEW.status = 'active' AND OLD.status != 'active' THEN
            UPDATE agents SET subscriber_count = subscriber_count + 1 WHERE id = NEW.agent_id;
          ELSIF NEW.status != 'active' AND OLD.status = 'active' THEN
            UPDATE agents SET subscriber_count = subscriber_count - 1 WHERE id = NEW.agent_id;
          END IF;
        END IF;
        RETURN NULL; -- AFTER trigger
      END;
      $$ LANGUAGE plpgsql;
    `;

    // Create the trigger
    await sql`
      CREATE TRIGGER trg_update_subscriber_count
      AFTER INSERT OR UPDATE OR DELETE ON subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION update_agent_subscriber_count();
    `;

    // Recalculate subscriber_count for all agents based on current active subscriptions
    await sql`
      UPDATE agents a
      SET subscriber_count = (
        SELECT count(*) 
        FROM subscriptions s 
        WHERE s.agent_id = a.id AND s.status = 'active'
      );
    `;

    console.log("Subscriber count trigger and recalculation applied successfully.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await sql.end();
  }
}

main();
