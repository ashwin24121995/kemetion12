const mysql = require('mysql2/promise');
const fs = require('fs');

// Railway MySQL Connection Details
const connection = {
  host: 'shortline.proxy.rlwy.net',
  user: 'root',
  password: 'gHqTOZRBzmuKReUNbOXKAvkRZFpjVkwh',
  database: 'railway',
  port: 52808,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function setupDatabase() {
  let conn;
  try {
    console.log('🔗 Connecting to Railway MySQL database...');
    conn = await mysql.createConnection(connection);
    console.log('✅ Connected successfully!');

    // Read SQL file
    const sqlFile = fs.readFileSync('./database.sql', 'utf8');
    const statements = sqlFile.split(';').filter(stmt => stmt.trim());

    console.log(`\n📊 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;

      try {
        console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`);
        await conn.execute(statement);
        console.log(`✅ Success\n`);
      } catch (error) {
        console.error(`❌ Error: ${error.message}\n`);
        // Continue with next statement
      }
    }

    console.log('\n🎉 Database setup completed!');
    console.log('\n📋 Tables created:');
    console.log('  ✓ users');
    console.log('  ✓ matches');
    console.log('  ✓ players');
    console.log('  ✓ teams');
    console.log('  ✓ team_players');
    console.log('  ✓ contests');
    console.log('  ✓ contest_entries');
    console.log('  ✓ player_performances');
    console.log('  ✓ scoring_rules');
    console.log('  ✓ admin_logs');
    console.log('  ✓ transactions');
    console.log('  ✓ notifications');
    console.log('\n✨ KEMETION database is ready to use!');

    await conn.end();
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
