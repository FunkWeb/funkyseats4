import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelBooking } from '../../api/bookingsApi'
import { roomBookingsQueryKey } from './useRoomBookings'

export function useCancelBooking(roomId: number | undefined, date: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number[]>({
    mutationFn: async (bookingIds) => {
      const results = await Promise.allSettled(
        bookingIds.map((bookingId) => cancelBooking(bookingId)),
      )
      const failure = results.find(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      )
      if (failure) throw failure.reason
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: roomBookingsQueryKey(roomId, date),
        }),
        queryClient.invalidateQueries({
          queryKey: ['bookings', 'me'],
        }),
      ]),
  })
}
