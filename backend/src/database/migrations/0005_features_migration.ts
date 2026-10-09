import type { Migration } from '../migration-runner/index.js'

export default {
  up: async (db) => {
    await db.query(`
        CREATE TABLE features (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            icon_path VARCHAR(255),
        category ENUM('OS', 'SOFTWARE', 'HARDWARE', 'OTHER') NOT NULL
    )
        
    `)
  },
  down: async (db) => {
    await db.query(`DROP TABLE IF EXISTS features`)
  },
} satisfies Migration
