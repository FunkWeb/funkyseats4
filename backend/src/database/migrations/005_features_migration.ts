import type { Connection } from 'mysql2/promise'
export async function up(conn: Connection): Promise<void> {
  await conn.query(`
        CREATE TABLE features (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            icon_path VARCHAR(255),
            category VARCHAR(50) CHECK (category IN ('OS', 'SOFTWARE', 'HARDWARE', 'OTHER')) NOT NULL
        )
    `)
}

export async function down(conn: Connection): Promise<void> {
  await conn.query(`
        DROP TABLE features
    `)
}
