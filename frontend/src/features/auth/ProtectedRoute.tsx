import { Navigate, Outlet } from 'react-router'
import type { UserRole } from '../../../../contracts/user'
import { Notice } from '../../components/Notice'
import { Spinner } from '../../components/Spinner'
import { useAuth } from './useAuth'

interface ProtectedRouteProps {
  role?: UserRole
}

export default function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { user, isPending, isError } = useAuth()

  if (isPending) {
    return <Spinner size="lg" label="Sjekker innlogging" />
  }

  if (isError) {
    return (
      <Notice
        variant="danger"
        title="Kunne ikke nå serveren"
        description="Vi fikk ikke kontakt med serveren. Prøv å laste siden på nytt om litt."
      />
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role && user.role !== role) {
    return <Navigate to="/rooms" replace />
  }

  return <Outlet />
}
