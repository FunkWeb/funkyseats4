import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { CreateFeatureRequest, FeatureDto } from '../../../contracts/feature.js'
import type { QueryParams } from '../database/queryParams.js'

type FeatureRow = FeatureDto & RowDataPacket

const SELECT_FEATURE = `
  SELECT
    features.id,
    features.name,
    features.description,
    features.icon_path AS iconPath,
    features.category
  FROM features`

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
    create: async (feature: CreateFeatureRequest) => {
      const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO features (name, description, icon_path, category)
         VALUES (:name, :description, :iconPath, :category)`,
        feature,
      )
      return result.insertId
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
