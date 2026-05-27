require('dotenv').config();
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
console.log('Testing with Client...');
console.log('URL:', DATABASE_URL);

async function main() {
    const client = new Client({ connectionString: DATABASE_URL });
    try {
        await client.connect();
        const res = await client.query('SELECT COUNT(*) FROM tanks');
        console.log('✓ Connected! Tanks in DB:', res.rows[0].count);
        await client.end();
    } catch (e) {
        console.log('✗ Failed:', e.message);
        await client.end();
    }
}

main().catch(console.error);