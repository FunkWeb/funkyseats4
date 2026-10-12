import type { Migration } from '../migration-runner/index.js'

export default {
  up: async (db) => {
    await db.query(`
  CREATE TABLE seat_features (
            SEAT_id BIGINT UNSIGNED NOT NULL,
            FEATURE_id BIGINT UNSIGNED NOT NULL,
            PRIMARY KEY (SEAT_id, FEATURE_id),
            FOREIGN KEY (SEAT_id) REFERENCES seats(id) ON DELETE CASCADE,
            FOREIGN KEY (FEATURE_id) REFERENCES features(id) ON DELETE CASCADE
        )
      )
    `)
  },
  down: async (db) => {
    await db.query(`DROP TABLE IF EXISTS seat_features`)
  },
} satisfies Migration
