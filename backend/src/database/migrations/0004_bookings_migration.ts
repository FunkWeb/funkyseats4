import type { Migration } from '../migration-runner/index.js'

export default {
  up: async (db) => {
    await db.query(`
        CREATE TABLE bookings (
        id	            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,	
        seat_id	        INT UNSIGNED NOT NULL,	
        user_id	        INT UNSIGNED NOT NULL,	
        status	        ENUM('ACTIVE', 'COMPLETE', 'CANCELLED') NOT NULL,	
        booking_date	DATE NOT NULL,	
        time_period	    ENUM('BEFORE_LUNCH', 'AFTER_LUNCH', 'ALL_DAY') NOT NULL,	
        updated_at	    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,	
        created_at	    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seat_id) REFERENCES seats(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX (seat_id, booking_date)
      )
    `)
  },
  down: async (db) => {
    await db.query(`DROP TABLE IF EXISTS bookings`)
  },
} satisfies Migration
