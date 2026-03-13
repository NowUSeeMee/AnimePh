const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDB() {
    try {
        console.log('Connecting to MySQL (no database selected yet)...');
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            multipleStatements: true
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
