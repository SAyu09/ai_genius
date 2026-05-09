const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'agents';
    `;
    console.log(columns.map(c => c.column_name));
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

main();
