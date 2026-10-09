import type { Migration } from "../migration-runner/index.js"

export default {
  up: async (db) => {
    await db.query(`
      CREATE TABLE users (
        id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        google_id     VARCHAR(255) NOT NULL UNIQUE,
        name          VARCHAR(60)  NOT NULL,
        email         VARCHAR(255) NOT NULL UNIQUE,
        avatar_path   VARCHAR(255),
        role          ENUM('CANDIDATE', 'SUPERVISOR', 'ADMIN') NOT NULL,
        last_login_at TIMESTAMP NULL,
        updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  },
  down: async (db) => {
    await db.query(`DROP TABLE IF EXISTS users`);
  },
} satisfies Migration;
