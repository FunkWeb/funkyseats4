import { Outlet } from 'react-router'
import type { UserRole } from '../../../../contracts/user'

interface ProtectedRouteProps {
  role?: UserRole
}

export default function ProtectedRoute(_props: ProtectedRouteProps) {
  return <Outlet />
}
