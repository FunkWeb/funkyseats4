import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelBooking } from '../../api/bookingsApi'
import { myBookingsBaseQueryKey } from './useMyBookings'
import { isRoomBookingsQuery } from './useRoomBookings'

export function useCancelBooking() {
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
        queryClient.invalidateQueries({ predicate: isRoomBookingsQuery }),
        queryClient.invalidateQueries({
          queryKey: myBookingsBaseQueryKey,
        }),
      ]),
  })
}
