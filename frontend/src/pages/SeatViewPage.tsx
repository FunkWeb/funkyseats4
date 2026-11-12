import { useParams } from 'react-router'

export default function SeatViewPage() {
  const { roomId } = useParams()

  return <>{roomId}</>
}
