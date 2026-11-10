import { Navigate, createBrowserRouter } from 'react-router'
import AdminRoomsPage from './pages/admin/AdminRoomsPage'
import AdminSeatsPage from './pages/admin/AdminSeatsPage'
import AdminSeatTypesPage from './pages/admin/AdminSeatTypesPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import ProfilePage from './pages/ProfilePage'
import RoomSelectionPage from './pages/RoomSelectionPage'
import SeatViewPage from './pages/SeatViewPage'
import AppLayout from './layouts/AppLayout'
import ProtectedRoute from './features/auth/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/rooms" replace />,
          },
          {
            path: 'rooms',
            element: <RoomSelectionPage />,
          },
          {
            path: 'rooms/:roomId',
            element: <SeatViewPage />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
          {
            element: <ProtectedRoute role="ADMIN" />,
            children: [
              {
                path: 'admin',
                children: [
                  {
                    index: true,
                    element: <Navigate to="/admin/rooms" replace />,
                  },
                  {
                    path: 'rooms',
                    element: <AdminRoomsPage />,
                  },
                  {
                    path: 'seats',
                    element: <AdminSeatsPage />,
                  },
                  {
                    path: 'seat-types',
                    element: <AdminSeatTypesPage />,
                  },
                  {
                    path: 'users',
                    element: <AdminUsersPage />,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
