import axios from 'axios';
import pg from 'pg';
const { Pool } = pg;

// Configuration
const config = {
  api: {
    url: 'http://localhost:3001',
    healthEndpoint: '/api/health'
  },
  database: {
    host: 'valantdb.postgres.database.azure.com',
    port: 5432,
    database: 'postgres',
    user: 'divyansh04',
    password: 'Rawal@00',
    ssl: {
      rejectUnauthorized: false
    }
  }
};

// PostgreSQL connection pool
const pool = new Pool(config.database);

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Health check functions
async function checkApiHealth() {
  try {
    const response = await axios.get(config.api.url + config.api.healthEndpoint, {
      timeout: 5000
    });
    
    if (response.status === 200) {
      console.log(`${colors.green}✓${colors.reset} API Health: OK`);
      return true;
    } else {
      console.log(`${colors.red}✗${colors.reset} API Health: Failed (Status: ${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} API Health: Failed (${error.message})`);
    return false;
  }
}

async function checkDatabaseHealth() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as health_check');
    client.release();
    
    if (result.rows.length > 0) {
      console.log(`${colors.green}✓${colors.reset} Database Health: OK`);
      return true;
    } else {
      console.log(`${colors.red}✗${colors.reset} Database Health: Failed (No response)`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Database Health: Failed (${error.message})`);
    return false;
  }
}

async function getDatabaseStats() {
  try {
    const client = await pool.connect();
    
    // Get table counts
    const queries = [
      { name: 'Patients', query: 'SELECT COUNT(*) as count FROM patients WHERE is_active = true' },
      { name: 'Active Admissions', query: 'SELECT COUNT(*) as count FROM patient_admissions WHERE status = $1', params: ['active'] },
      { name: 'Doctors', query: 'SELECT COUNT(*) as count FROM doctors WHERE is_active = true' },
      { name: 'Available Beds', query: 'SELECT COUNT(*) as count FROM beds WHERE status = $1', params: ['available'] },
      { name: 'Today Transactions', query: 'SELECT COUNT(*) as count FROM patient_transactions WHERE transaction_date = CURRENT_DATE' }
    ];
    
    console.log(`\n${colors.blue}Database Statistics:${colors.reset}`);
    
    for (const query of queries) {
      try {
        const result = await client.query(query.query, query.params || []);
        const count = result.rows[0].count;
        console.log(`  ${query.name}: ${count}`);
      } catch (error) {
        console.log(`  ${query.name}: Error (${error.message})`);
      }
    }
    
    client.release();
  } catch (error) {
    console.log(`${colors.red}Error getting database stats: ${error.message}${colors.reset}`);
  }
}

async function checkDiskSpace() {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as database_size,
        pg_size_pretty(pg_total_relation_size('patients')) as patients_table_size
    `);
    
    console.log(`\n${colors.blue}Storage Information:${colors.reset}`);
    console.log(`  Database Size: ${result.rows[0].database_size}`);
    console.log(`  Patients Table Size: ${result.rows[0].patients_table_size}`);
    
    client.release();
  } catch (error) {
    console.log(`${colors.red}Error getting storage info: ${error.message}${colors.reset}`);
  }
}

async function runHealthCheck() {
  console.log(`\n${colors.blue}=== Hospital CRM Health Check ===${colors.reset}`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);
  
  const apiStatus = await checkApiHealth();
  const dbStatus = await checkDatabaseHealth();
  
  if (apiStatus && dbStatus) {
    console.log(`\n${colors.green}Overall Status: HEALTHY${colors.reset}`);
    
    // Get additional stats if everything is healthy
    await getDatabaseStats();
    await checkDiskSpace();
  } else {
    console.log(`\n${colors.red}Overall Status: UNHEALTHY${colors.reset}`);
  }
  
  console.log(`\n${colors.blue}===================================${colors.reset}\n`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--continuous')) {
    console.log('Starting continuous monitoring (every 30 seconds)...');
    console.log('Press Ctrl+C to stop');
    
    // Run health check immediately
    await runHealthCheck();
    
    // Set up interval for continuous monitoring
    setInterval(runHealthCheck, 30000);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nStopping health monitoring...');
      process.exit(0);
    });
  } else {
    // Single health check
    await runHealthCheck();
    process.exit(0);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
main().catch(console.error);