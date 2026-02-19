const mysql = require('mysql2/promise');

async function setup() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '' // Default XAMPP/WAMP password
        });

        await connection.query('CREATE DATABASE IF NOT EXISTS online_order_db');
        console.log('Database online_order_db created or already exists.');
        await connection.end();
    } catch (error) {
        console.error('Error creating database:', error);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
             console.error('Please check your MySQL credentials in setup.js');
        }
    }
}

setup();
