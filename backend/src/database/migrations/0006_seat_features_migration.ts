import type { Connection } from 'mysql2/promise'
export async function up(conn: Connection): Promise<void> {
  await conn.query(`
        CREATE TABLE seat_features (
            Seat_id BIGINT UNSIGNED NOT NULL,
            Feature_id BIGINT UNSIGNED NOT NULL,
            PRIMARY KEY (Seat_id, Feature_id),
        )
    `)
}

export async function down(conn: Connection): Promise<void> {
  await conn.query(`
        DROP TABLE seat_features
    `)
}