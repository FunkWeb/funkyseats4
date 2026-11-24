import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelBooking } from '../../api/bookingsApi'
import { roomBookingsQueryKey } from './useRoomBookings'

export function useCancelBooking(roomId: number | undefined, date: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number[]>({
    mutationFn: async (bookingIds) => {
      await Promise.all(bookingIds.map((bookingId) => cancelBooking(bookingId)))
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: roomBookingsQueryKey(roomId, date),
      })
    },
  })
}
