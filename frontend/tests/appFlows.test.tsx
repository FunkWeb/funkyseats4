import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import type { ReactNode } from 'react'
import type { RoomDto } from '../../contracts/room'
import type { SeatWithFeaturesDto } from '../../contracts/seat'
import LoginPage from '../src/pages/LoginPage'
import ProfilePage from '../src/pages/ProfilePage'
import RoomSelectionPage from '../src/pages/RoomSelectionPage'
import SeatViewPage from '../src/pages/SeatViewPage'

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useRooms: vi.fn(),
  useRoomSeats: vi.fn(),
  useRoomBookings: vi.fn(),
  useCreateBooking: vi.fn(),
  useCancelBooking: vi.fn(),
  useMyBookings: vi.fn(),
  useMyBookingStats: vi.fn(),
  createBooking: vi.fn(),
  cancelBooking: vi.fn(),
}))

vi.mock('../src/features/auth/useAuth', () => ({ useAuth: mocks.useAuth }))
vi.mock('../src/features/auth/DevLoginButtons', () => ({ DevLoginButtons: () => null }))
vi.mock('../src/features/rooms/useRooms', () => ({ useRooms: mocks.useRooms }))
vi.mock('../src/features/seats/useRoomSeats', () => ({ useRoomSeats: mocks.useRoomSeats }))
vi.mock('../src/features/bookings/useRoomBookings', () => ({
  useRoomBookings: mocks.useRoomBookings,
}))
vi.mock('../src/features/bookings/useCreateBooking', () => ({
  useCreateBooking: mocks.useCreateBooking,
}))
vi.mock('../src/features/bookings/useCancelBooking', () => ({
  useCancelBooking: mocks.useCancelBooking,
}))
vi.mock('../src/features/bookings/useMyBookings', () => ({ useMyBookings: mocks.useMyBookings }))
vi.mock('../src/features/bookings/useMyBookingStats', () => ({
  useMyBookingStats: mocks.useMyBookingStats,
}))

const room: RoomDto = {
  id: 3,
  slug: 'quiet-room',
  name: 'Quiet room',
  description: 'A focused work space',
  seatMapPath: null,
  maxDaysAhead: 7,
}

const seat: SeatWithFeaturesDto = {
  id: 12,
  roomId: room.id,
  seatNumber: 'A1',
  description: null,
  deletedAt: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  features: [],
}

function renderAt(path: string, page: ReactNode, routePath = '*') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={routePath} element={page} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('frontend user flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useAuth.mockReturnValue({
      user: null,
      isPending: false,
      isError: false,
      isAdmin: false,
      logout: vi.fn(),
      isLoggingOut: false,
    })
    mocks.useRooms.mockReturnValue({ data: [room], isPending: false, isError: false })
    mocks.useRoomSeats.mockReturnValue({
      data: [seat],
      isPending: false,
      isError: false,
      isSuccess: true,
    })
    mocks.useRoomBookings.mockReturnValue({ data: [], isPending: false, isError: false })
    mocks.createBooking.mockReset()
    mocks.cancelBooking.mockReset()
    mocks.useCreateBooking.mockReturnValue({
      mutate: mocks.createBooking,
      error: null,
      isError: false,
      isPending: false,
      variables: undefined,
    })
    mocks.useCancelBooking.mockReturnValue({
      mutate: mocks.cancelBooking,
      error: null,
      isError: false,
      isPending: false,
      variables: undefined,
    })
  })

  afterEach(cleanup)

  it('shows the Google sign-in action when logged out', () => {
    renderAt('/login', <LoginPage />)

    expect(screen.getByRole('heading', { name: 'FunkySeats' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Logg inn med Google' })).toBeInTheDocument()
  })

  it('lists rooms with a link to the room seat view', () => {
    renderAt('/rooms', <RoomSelectionPage />)

    expect(screen.getByRole('heading', { name: 'Velg rom' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Quiet room/ })).toHaveAttribute(
      'href',
      '/rooms/quiet-room',
    )
  })

  it('submits a booking for the selected available seat and date', async () => {
    const user = userEvent.setup()
    renderAt('/rooms/quiet-room', <SeatViewPage />, '/rooms/:slug')

    expect(screen.getByRole('heading', { name: 'A1' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Reserver/ }))

    expect(mocks.createBooking).toHaveBeenCalledWith({
      seatId: seat.id,
      bookingDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      timePeriod: 'ALL_DAY',
    })
  })

  it('shows profile bookings and lets the user request cancellation', async () => {
    const user = userEvent.setup()
    mocks.useAuth.mockReturnValue({
      user: {
        id: 9,
        name: 'Test User',
        email: 'test@example.com',
        avatarPath: null,
        role: 'CANDIDATE',
        lastLoginAt: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      isPending: false,
      isError: false,
      isAdmin: false,
      logout: vi.fn(),
      isLoggingOut: false,
    })
    mocks.useMyBookings.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: {
        page: 1,
        pageSize: 20,
        total: 1,
        items: [
          {
            id: 41,
            seatId: seat.id,
            userId: 9,
            status: 'ACTIVE',
            bookingDate: '2099-05-01',
            timePeriod: 'ALL_DAY',
            roomName: room.name,
            roomSlug: room.slug,
            seatNumber: seat.seatNumber,
          },
        ],
      },
    })
    mocks.useMyBookingStats.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        upcoming: 1,
        completed: 0,
        cancelled: 0,
        thisMonth: 0,
        favouriteRoom: null,
        favouriteSeat: null,
        byPeriod: { BEFORE_LUNCH: 0, AFTER_LUNCH: 0, ALL_DAY: 1 },
        perMonth: [],
      },
    })
    renderAt('/profile', <ProfilePage />)

    expect(screen.getByRole('heading', { name: 'Mine reservasjoner' })).toBeInTheDocument()
    expect(screen.getByText('Quiet room')).toBeInTheDocument()
    expect(screen.getByText('A1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Avbestill' }))

    expect(mocks.cancelBooking).toHaveBeenCalledWith([41])
  })
})
