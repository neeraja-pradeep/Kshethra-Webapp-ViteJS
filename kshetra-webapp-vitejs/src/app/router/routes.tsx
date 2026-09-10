import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AdminLayout } from '@/app/layout/AdminLayout'
import { permissionsForPath } from '@/app/layout/nav'
import { LandingRedirect } from '@/app/router/LandingRedirect'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'
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
import { TempleLocationsScreen } from '@/features/temple-locations/presentation/screens/TempleLocationsScreen'
import { StoreCategoriesScreen } from '@/features/store/presentation/screens/StoreCategoriesScreen'
import { StoreOrdersScreen } from '@/features/store/presentation/screens/StoreOrdersScreen'
import { StoreProductsScreen } from '@/features/store/presentation/screens/StoreProductsScreen'
import { UsersRolesScreen } from '@/features/users-roles/presentation/screens/UsersRolesScreen'
import { ComingSoon } from '@/shared/ui/ComingSoon'

/**
 * Application routes. The AdminLayout shell hosts every in-console module;
 * the auth screen is standalone (outside the shell).
 */

/** Absolute path -> screen. Paths are absolute so they key straight into NAV. */
const SHELL_SCREENS: ReadonlyArray<readonly [path: string, screen: ComponentType]> = [
  ['/dashboard', DashboardScreen],
  ['/counter', CounterPosScreen],
  ['/pooja-bookings', BookingsScreen],
  ['/pooja-orders', OrdersScreen],
  ['/store/orders', StoreOrdersScreen],
  ['/store/products', StoreProductsScreen],
  ['/store/categories', StoreCategoriesScreen],
  ['/poojas', PoojasScreen],
  ['/gods', GodsScreen],
  ['/devotees', DevoteesScreen],
  ['/notifications', NotificationsScreen],
  ['/media', MediaScreen],
  ['/agent-codes', AgentCodesScreen],
  ['/reports', ReportsScreen],
  ['/temple-location', TempleLocationsScreen],
  ['/users-roles', UsersRolesScreen],
]

/**
 * Every module route carries the gate its sidebar entry already declares —
 * read from NAV rather than restated here, so the two cannot drift. Hiding an
 * entry from the rail while leaving its URL open renders the screen as if the
 * user were entitled to it, which reads worse than a plain refusal.
 */
const shellRoutes = SHELL_SCREENS.map(([path, Screen]) => ({
  path: path.slice(1),
  element: (
    <ProtectedRoute requires={permissionsForPath(path)}>
      <Screen />
    </ProtectedRoute>
  ),
}))

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <LandingRedirect /> },
      ...shellRoutes,
      { path: 'store', element: <Navigate to="/store/orders" replace /> },
    ],
  },
  { path: '/login', element: <AuthScreen /> },
  {
    path: '/no-access',
    element: <ComingSoon title="You don't have access" desc="Ask a temple administrator to grant you this permission, then sign in again." />,
  },
  { path: '*', element: <ComingSoon title="Page not found" desc="The page you are looking for does not exist." /> },
])
