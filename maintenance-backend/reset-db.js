const { Client } = require('pg');

async function resetDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'  // Connect to default postgres database first
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Terminate existing connections to maintenance_db
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'maintenance_db'
      AND pid <> pg_backend_pid();
    `);
    console.log('Terminated existing connections');

    // Drop and recreate database
    await client.query('DROP DATABASE IF EXISTS maintenance_db');
    console.log('Dropped maintenance_db');

    await client.query('CREATE DATABASE maintenance_db');
    console.log('Created maintenance_db');

    console.log('Database reset complete!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

resetDatabase();
