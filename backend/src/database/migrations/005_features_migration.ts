import {pool} from '../connectionPool.js';

export async function up(): Promise<void> {
    await pool.query(`
        CREATE TABLE features (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            icon_path VARCHAR(255),
            category VARCHAR(50) CHECK (category IN ('OS', 'SOFTWARE', 'HARDWARE', 'OTHER')) NOT NULL
        )
    `);
}

export async function down(): Promise<void> {
    await pool.query(`
        DROP TABLE features
    `);
}