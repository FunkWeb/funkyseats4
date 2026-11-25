import type { CreateRoomRequest, RoomDto, UpdateRoomRequest } from '../../../contracts/room.js'
import { ConflictError, NotFoundError, ValidationError } from '../errors/appErrors.js'
import type { Room, RoomsRepository } from '../repositories/roomsRepository.js'
import { findOrThrow } from './common.js'

export interface RoomsServiceDeps {
  rooms: Pick<
    RoomsRepository,
    'findAll' | 'findById' | 'existsBySlug' | 'existsBySeatMapPath' | 'create' | 'update' | 'delete'
  >
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SLUG_MAX_LENGTH = 50

const toRoomDto = (room: Room): RoomDto => ({
  id: room.id,
  slug: room.slug,
  name: room.name,
  description: room.description,
  seatMapPath: room.seatMapPath,
  maxDaysAhead: room.maxDaysAhead,
})

export const createRoomsService = ({ rooms }: RoomsServiceDeps) => {
  const findRoom = (roomId: number) => findOrThrow(rooms.findById(roomId), 'Room')

  const assertSlugUsable = async (slug: string) => {
    if (slug.length > SLUG_MAX_LENGTH || !SLUG_PATTERN.test(slug)) {
      throw new ValidationError(`Invalid room slug ${slug}`)
    }
    if (await rooms.existsBySlug(slug)) throw new ConflictError(`Room slug ${slug} already exists`)
  }

  const findAll = async (): Promise<RoomDto[]> => (await rooms.findAll()).map(toRoomDto)

  const findById = async (roomId: number): Promise<RoomDto> => toRoomDto(await findRoom(roomId))

  const create = async (input: CreateRoomRequest): Promise<number> => {
    await assertSlugUsable(input.slug)
    return rooms.create(input)
  }

  const update = async (roomId: number, input: UpdateRoomRequest): Promise<string | null> => {
    const room = await findRoom(roomId)
    if (input.slug !== undefined && input.slug !== room.slug) await assertSlugUsable(input.slug)
    await rooms.update(roomId, input)
    return room.seatMapPath
  }

  const remove = async (roomId: number): Promise<string | null> => {
    const room = await findRoom(roomId)
    if (!(await rooms.delete(roomId))) throw new NotFoundError('Room')
    return room.seatMapPath
  }

  const isSeatMapInUse = (seatMapPath: string): Promise<boolean> =>
    rooms.existsBySeatMapPath(seatMapPath)

  return { findAll, findById, create, update, delete: remove, isSeatMapInUse }
}

export type RoomsService = ReturnType<typeof createRoomsService>
