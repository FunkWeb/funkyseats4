import { Navigate, createBrowserRouter } from 'react-router'
import ProtectedRoute from './features/auth/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import ProfilePage from './pages/ProfilePage'
import RoomSelectionPage from './pages/RoomSelectionPage'
import SeatViewPage from './pages/SeatViewPage'
import AdminRoomsPage from './pages/admin/AdminRoomsPage'
import AdminSeatTypesPage from './pages/admin/AdminSeatTypesPage'
import AdminSeatsPage from './pages/admin/AdminSeatsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="rooms" replace /> },
          { path: 'rooms', element: <RoomSelectionPage /> },
          { path: 'rooms/:roomId', element: <SeatViewPage /> },
          { path: 'profile', element: <ProfilePage /> },
          {
            path: 'admin',
            element: <ProtectedRoute role="ADMIN" />,
            children: [
              { index: true, element: <Navigate to="rooms" replace /> },
              { path: 'rooms', element: <AdminRoomsPage /> },
              { path: 'seats', element: <AdminSeatsPage /> },
              { path: 'seat-types', element: <AdminSeatTypesPage /> },
              { path: 'users', element: <AdminUsersPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
