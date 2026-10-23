import type { CreateRoomRequest, RoomDto, UpdateRoomRequest } from '../../../contracts/room.js'
import { ConflictError, NotFoundError } from '../errors/appErrors.js'
import type { RoomsRepository } from '../repositories/roomsRepository.js'
import { findOrThrow } from './common.js'

export interface RoomsServiceDeps {
  rooms: Pick<
    RoomsRepository,
    'findAll' | 'findById' | 'existsBySlug' | 'create' | 'update' | 'delete'
  >
}

type Room = NonNullable<Awaited<ReturnType<RoomsRepository['findById']>>>

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

  const assertSlugAvailable = async (slug: string) => {
    if (await rooms.existsBySlug(slug)) throw new ConflictError(`Room slug ${slug} already exists`)
  }

  const findAll = async (): Promise<RoomDto[]> => (await rooms.findAll()).map(toRoomDto)

  const findById = async (roomId: number): Promise<RoomDto> => toRoomDto(await findRoom(roomId))

  const create = async (input: CreateRoomRequest): Promise<number> => {
    await assertSlugAvailable(input.slug)
    return rooms.create(input)
  }

  const update = async (roomId: number, input: UpdateRoomRequest): Promise<void> => {
    const room = await findRoom(roomId)
    if (input.slug !== undefined && input.slug !== room.slug) await assertSlugAvailable(input.slug)
    if (!(await rooms.update(roomId, input))) throw new NotFoundError('Room')
  }

  const remove = async (roomId: number): Promise<void> => {
    if (!(await rooms.delete(roomId))) throw new NotFoundError('Room')
  }

  return { findAll, findById, create, update, delete: remove }
}

export type RoomsService = ReturnType<typeof createRoomsService>
