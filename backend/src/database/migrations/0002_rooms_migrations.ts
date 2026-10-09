import type { Migration } from '../migration-runner/index.js'

export default {
  up: async (db) => {
    await db.query(`
     Create table rooms (
       PK	id	SERIAL	
       slug	VARCHAR(50) NOT NULL UNIQUE	
       name	VARCHAR(50) NOT NULL	
       description	TEXT	
       seat_map_path	VARCHAR(255)	
       max_days_ahead	INT NOT NULL DEFAULT 7	
       deleted_at	TIMESTAMP	
       updated_at	TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP	
       created_at	TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP	

)
    `)
  },
  down: async (db) => {
    await db.query(`DROP TABLE IF EXISTS rooms`)
  },
} satisfies Migration