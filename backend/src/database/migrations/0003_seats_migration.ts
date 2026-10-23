import type { Migration } from '../migration-runner/index.js'

export default {
  up: async (db) => {
    await db.query(`
        CREATE TABLE seats (
         id	            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
         room_id	      INT UNSIGNED NOT NULL,
         seat_number	  VARCHAR(10) NOT NULL,
         description	  TEXT,
         deleted_at	    TIMESTAMP NULL,
         updated_at	    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         created_at	    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
         active_seat_number VARCHAR(10) GENERATED ALWAYS AS (IF(deleted_at IS NULL, seat_number, NULL)) STORED,
         FOREIGN KEY (room_id) REFERENCES rooms(id),
         UNIQUE (room_id, active_seat_number)
          )
    `)
  },
  down: async (db) => {
    await db.query(`DROP TABLE IF EXISTS seats`)
  },
} satisfies Migration
