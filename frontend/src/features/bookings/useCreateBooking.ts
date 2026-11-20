import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { BookingDto, NewBooking } from '../../../../contracts/booking'
import { createBooking } from '../../api/bookingsApi'
import { roomBookingsQueryKey } from './useRoomBookings'

export function useCreateBooking(roomId: number | undefined, date: string) {
  const queryClient = useQueryClient()

  return useMutation<BookingDto, Error, NewBooking>({
    mutationFn: (input) => createBooking(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: roomBookingsQueryKey(roomId, date),
      })
    },
  })
}
