import type { Connection } from 'mysql2/promise'

export async function up(conn: Connection): Promise<void> {
  await conn.query(`
    CREATE FUNCTION set_updated_at() RETURNS TIMESTAMP
    NOT DETERMINISTIC
    RETURN CURRENT_TIMESTAMP
  `)

  await conn.query(`
    CREATE TABLE users (

      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      google_id VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(60) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      avatar_path VARCHAR(255),
      role ENUM('CANDIDATE', 'SUPERVISOR', 'ADMIN') NOT NULL,
      last_login_at TIMESTAMP NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

    )
  `)

  await conn.query(`
    CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    SET NEW.updated_at = set_updated_at()
  `)
}

export async function down(conn: Connection): Promise<void> {
  await conn.query('DROP TRIGGER IF EXISTS trg_users_updated_at')
  await conn.query('DROP TABLE IF EXISTS users')
  await conn.query('DROP FUNCTION IF EXISTS set_updated_at')
}
