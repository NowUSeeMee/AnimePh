const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function initDB() {
    try {
        console.log('Connecting to MySQL (no database selected yet)...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'defaultdb',
            multipleStatements: true,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null
        });

        console.log('Reading database.sql...');
        const sql = fs.readFileSync(path.join(__dirname, '..', 'database.sql'), 'utf8');

        console.log('Executing database schema creation scripts...');
        await connection.query(sql);
        console.log('Database and tables created successfully!');
        
        await connection.end();
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
}

initDB();
