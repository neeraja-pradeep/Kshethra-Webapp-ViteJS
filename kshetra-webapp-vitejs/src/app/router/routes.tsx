import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AdminLayout } from '@/app/layout/AdminLayout'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { PERMISSIONS } from '@/features/auth/application/hooks/permissions'
import { AgentCodesScreen } from '@/features/agent-codes/presentation/screens/AgentCodesScreen'
import { AuthScreen } from '@/features/auth/presentation/screens/AuthScreen'
import { BookingsScreen } from '@/features/bookings/presentation/screens/BookingsScreen'
import { CounterPosScreen } from '@/features/counter-pos/presentation/screens/CounterPosScreen'
import { DashboardScreen } from '@/features/dashboard/presentation/screens/DashboardScreen'
import { DevoteesScreen } from '@/features/devotees/presentation/screens/DevoteesScreen'
import { MediaScreen } from '@/features/media/presentation/screens/MediaScreen'
import { NotificationsScreen } from '@/features/notifications/presentation/screens/NotificationsScreen'
import { OrdersScreen } from '@/features/orders/presentation/screens/OrdersScreen'
import { GodsScreen } from '@/features/poojas/presentation/screens/GodsScreen'
import { PoojasScreen } from '@/features/poojas/presentation/screens/PoojasScreen'
import { ReportsScreen } from '@/features/reports/presentation/screens/ReportsScreen'
import { StoreCategoriesScreen } from '@/features/store/presentation/screens/StoreCategoriesScreen'
import { StoreOrdersScreen } from '@/features/store/presentation/screens/StoreOrdersScreen'
import { StoreProductsScreen } from '@/features/store/presentation/screens/StoreProductsScreen'
import { UsersRolesScreen } from '@/features/users-roles/presentation/screens/UsersRolesScreen'
import { ComingSoon } from '@/shared/ui/ComingSoon'

/**
 * Application routes. The AdminLayout shell hosts every in-console module;
 * the auth screen is standalone (outside the shell).
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardScreen /> },
      {
        path: 'counter',
        element: (
          <ProtectedRoute requires={PERMISSIONS.operateCounter}>
            <CounterPosScreen />
          </ProtectedRoute>
        ),
      },
      { path: 'pooja-bookings', element: <BookingsScreen /> },
      { path: 'pooja-orders', element: <OrdersScreen /> },
      { path: 'store', element: <Navigate to="/store/orders" replace /> },
      {
        path: 'store/orders',
        element: (
          // Reading a shop order is `view_order`; acting on somebody else's is
          // what `access_all_objects` guards, and every action on this screen
          // does exactly that.
          <ProtectedRoute requires={PERMISSIONS.viewEcommerceOrder}>
            <StoreOrdersScreen />
          </ProtectedRoute>
        ),
      },
      {
        path: 'store/products',
        element: (
          <ProtectedRoute requires={PERMISSIONS.viewProduct}>
            <StoreProductsScreen />
          </ProtectedRoute>
        ),
      },
      {
        path: 'store/categories',
        element: (
          <ProtectedRoute requires={PERMISSIONS.viewCategory}>
            <StoreCategoriesScreen />
          </ProtectedRoute>
        ),
      },
      { path: 'poojas', element: <PoojasScreen /> },
      { path: 'gods', element: <GodsScreen /> },
      { path: 'devotees', element: <DevoteesScreen /> },
      { path: 'notifications', element: <NotificationsScreen /> },
      { path: 'media', element: <MediaScreen /> },
      { path: 'agent-codes', element: <AgentCodesScreen /> },
      { path: 'reports', element: <ReportsScreen /> },
      { path: 'users-roles', element: <UsersRolesScreen /> },
    ],
  },
  { path: '/login', element: <AuthScreen /> },
  {
    path: '/no-access',
    element: <ComingSoon title="You don't have access" desc="Ask a temple administrator to grant you this permission, then sign in again." />,
  },
  { path: '*', element: <ComingSoon title="Page not found" desc="The page you are looking for does not exist." /> },
])
