import type {
  AdminBookingDto,
  BookingDto,
  MyBookingDto,
  RoomBookingDto,
} from '../../../contracts/booking.js'
import type {
  AdminBooking,
  Booking,
  MyBooking,
  RoomBooking,
} from '../repositories/bookingsRepository.js'

const toBookingUser = ({
  userId,
  userName,
  userEmail,
  userAvatarPath,
}: {
  userId: number
  userName: string
  userEmail: string
  userAvatarPath: string | null
}) => ({
  id: userId,
  name: userName,
  email: userEmail,
  avatarPath: userAvatarPath,
})

export const toBookingDto = ({
  id,
  seatId,
  userId,
  status,
  bookingDate,
  timePeriod,
}: Booking): BookingDto => ({
  id,
  seatId,
  userId,
  status,
  bookingDate,
  timePeriod,
})

export const toMyBookingDto = ({
  roomName,
  roomSlug,
  seatNumber,
  ...booking
}: MyBooking): MyBookingDto => ({
  ...toBookingDto(booking),
  roomName,
  roomSlug,
  seatNumber,
})

export const toAdminBookingDto = ({
  userName,
  userEmail,
  userAvatarPath,
  ...booking
}: AdminBooking): AdminBookingDto => ({
  ...toMyBookingDto(booking),
  user: toBookingUser({
    userId: booking.userId,
    userName,
    userEmail,
    userAvatarPath,
  }),
})

export const toRoomBookingDto = ({
  userName,
  userAvatarPath,
  ...booking
}: RoomBooking): RoomBookingDto => ({
  ...toBookingDto(booking),
  user: {
    name: userName,
    avatarPath: userAvatarPath,
  },
})
