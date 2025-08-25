import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING
});

async function fixSessionsTable() {
  try {
    console.log('🔧 Fixing sessions table for connect-pg-simple...');
    
    // Drop the existing sessions table if it exists
    console.log('🗑️ Dropping existing sessions table...');
    await pool.query('DROP TABLE IF EXISTS "sessions" CASCADE');
    
    // Create the sessions table with the exact structure connect-pg-simple expects
    console.log('📋 Creating sessions table with proper structure...');
    await pool.query(`
      CREATE TABLE "sessions" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
      WITH (OIDS=FALSE);
    `);
    
    // Add the primary key constraint
    await pool.query(`
      ALTER TABLE "sessions" ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
    `);
    
    // Create the index that connect-pg-simple expects
    await pool.query(`
      CREATE INDEX "IDX_sessions_expire" ON "sessions" ("expire");
    `);
    
    console.log('✅ Sessions table created with proper structure');
    
    // Verify the table structure
    const result = await pool.query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'sessions'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Sessions table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check for the unique constraint
    const constraintResult = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND table_name = 'sessions'
    `);
    
    console.log('🔒 Table constraints:');
    constraintResult.rows.forEach(row => {
      console.log(`  - ${row.constraint_name}: ${row.constraint_type}`);
    });
    
    // Check for indexes
    const indexResult = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'sessions'
    `);
    
    console.log('📈 Table indexes:');
    indexResult.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });
    
  } catch (error) {
    console.error('❌ Sessions table fix failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixSessionsTable()
  .then(() => {
    console.log('🎉 Sessions table fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Sessions table fix failed:', error);
    process.exit(1);
  });
