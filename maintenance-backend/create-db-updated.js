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

    const databases = ['maintenance-db', 'maintenance_db'];
    
    for (const dbName of databases) {
      const checkResult = await client.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [dbName]
      );

      if (checkResult.rows.length === 0) {
        await client.query(`CREATE DATABASE "${dbName}"`);
        console.log(`✅ Database "${dbName}" created successfully`);
      } else {
        console.log(`ℹ️  Database "${dbName}" already exists`);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
