import type { Migration } from '../migration-runner/index.js'

export default {
  up: async (db) => {
    await db.query(`
        CREATE TABLE seats (
         id	            SERIAL PRIMARY KEY,
         room_id	      BIGINT UNSIGNED NOT NULL FOREIGN KEY,
         seat_number	  VARCHAR(10) NOT NULL UNIQUE,
         description	  TEXT,
         deleted_at	    TIMESTAMP,
         updated_at	    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         created_at	    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

          )
    `)
  },
  down: async (db) => {
    await db.query(`DROP TABLE IF EXISTS users`)
  },
} satisfies Migration
