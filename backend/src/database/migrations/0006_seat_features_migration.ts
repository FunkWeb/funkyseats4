import type { Migration } from "../migration-runner/index.js"


export default {
  up: async (db) => {
    await db.query(`
   Seat_id BIGINT UNSIGNED NOT NULL,
            Feature_id BIGINT UNSIGNED NOT NULL,
            PRIMARY KEY (Seat_id, Feature_id),
        )
      )
    `)
  },
  down: async (db) => {
    await db.query(`DROP TABLE IF EXISTS seat_features`)
  },
} satisfies Migration
