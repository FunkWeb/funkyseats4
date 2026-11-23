import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type {
  CreateFeatureRequest,
  FeatureDto,
  UpdateFeatureRequest,
} from '../../../contracts/feature.js'
import { pickColumns } from '../database/columns.js'
import type { QueryParams } from '../database/queryParams.js'

type FeatureRow = FeatureDto & RowDataPacket

export type SeatFeatureDto = FeatureDto & { seatId: number }
type SeatFeatureRow = SeatFeatureDto & RowDataPacket

const FEATURE_COLUMNS = `
    features.id,
    features.name,
    features.description,
    features.icon_path AS iconPath,
    features.category`

const SELECT_FEATURE = `SELECT ${FEATURE_COLUMNS} FROM features`
const WRITABLE_FIELDS = ['name', 'description', 'iconPath', 'category'] as const

export const createFeaturesRepository = (db: Pool) => {
  const selectFeatures = async (
    clause: string,
    params: QueryParams = {},
  ): Promise<FeatureDto[]> => {
    const [rows] = await db.execute<FeatureRow[]>(`${SELECT_FEATURE} ${clause}`, params)
    return rows
  }

  return {
    findAll: () => selectFeatures('ORDER BY features.name'),
    existsByName: async (name: string): Promise<boolean> => {
      const [rows] = await db.execute<RowDataPacket[]>(
        'SELECT 1 FROM features WHERE name = :name LIMIT 1',
        { name },
      )
      return rows.length > 0
    },
    findById: async (id: number): Promise<FeatureDto | null> => {
      const [feature] = await selectFeatures('WHERE features.id = :id', { id })
      return feature ?? null
    },
    findBySeatId: (seatId: number) =>
      selectFeatures(
        `JOIN seat_features ON seat_features.feature_id = features.id
         WHERE seat_features.seat_id = :seatId
         ORDER BY features.name`,
        { seatId },
      ),
    findByRoomId: async (roomId: number): Promise<SeatFeatureDto[]> => {
      const [rows] = await db.execute<SeatFeatureRow[]>(
        `SELECT seat_features.seat_id AS seatId, ${FEATURE_COLUMNS}
         FROM features
         JOIN seat_features ON seat_features.feature_id = features.id
         JOIN seats ON seats.id = seat_features.seat_id
         WHERE seats.room_id = :roomId AND seats.deleted_at IS NULL
         ORDER BY features.name`,
        { roomId },
      )
      return rows
    },
    create: async (feature: CreateFeatureRequest) => {
      const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO features (name, description, icon_path, category)
         VALUES (:name, :description, :iconPath, :category)`,
        feature,
      )
      return result.insertId
    },
    update: async (id: number, input: UpdateFeatureRequest): Promise<boolean> => {
      const { assignments, params } = pickColumns(WRITABLE_FIELDS, input)
      if (assignments.length === 0) return false
      const [result] = await db.execute<ResultSetHeader>(
        `UPDATE features SET ${assignments.join(', ')} WHERE id = :id`,
        { ...params, id },
      )
      return result.affectedRows === 1
    },
    delete: async (id: number): Promise<boolean> => {
      const [result] = await db.execute<ResultSetHeader>('DELETE FROM features WHERE id = :id', {
        id,
      })
      return result.affectedRows === 1
    },
    attachToSeat: async (seatId: number, featureId: number) => {
      await db.execute(
        'INSERT INTO seat_features (seat_id, feature_id) VALUES (:seatId, :featureId)',
        { seatId, featureId },
      )
    },
    detachFromSeat: async (seatId: number, featureId: number) => {
      const [result] = await db.execute<ResultSetHeader>(
        'DELETE FROM seat_features WHERE seat_id = :seatId AND feature_id = :featureId',
        { seatId, featureId },
      )
      return result.affectedRows === 1
    },
  }
}

export type FeaturesRepository = ReturnType<typeof createFeaturesRepository>
