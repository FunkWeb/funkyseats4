import type { Migration } from '../migration-runner/index.js'

export default {
  up: async (db) => {
    await db.query(`
  CREATE TABLE seat_features (
            seat_id INT UNSIGNED NOT NULL,
            feature_id INT UNSIGNED NOT NULL,
            PRIMARY KEY (seat_id, feature_id),
            FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE,
            FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
        )
    `)
  },
  down: async (db) => {
    await db.query(`DROP TABLE IF EXISTS seat_features`)
  },
} satisfies Migration
