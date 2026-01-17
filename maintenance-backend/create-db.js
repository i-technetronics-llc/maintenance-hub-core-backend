const { Client } = require('pg');

async function createDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    const checkResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'maintenance_db'"
    );

    if (checkResult.rows.length === 0) {
      await client.query('CREATE DATABASE maintenance_db');
      console.log('Database "maintenance_db" created successfully');
    } else {
      console.log('Database "maintenance_db" already exists');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
