import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://neondb_owner:npg_ZtbPUjeFT39r@ep-damp-wildflower-azwjta3a-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to Neon PostgreSQL Database!');
    const res = await client.query('SELECT NOW()');
    console.log('Database Time:', res.rows[0]);
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection error:', err);
    process.exit(1);
  }
}

testConnection();
