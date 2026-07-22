import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AdminLayout } from '@/app/layout/AdminLayout'
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
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardScreen /> },
      { path: 'counter', element: <CounterPosScreen /> },
      { path: 'pooja-bookings', element: <BookingsScreen /> },
      { path: 'pooja-orders', element: <OrdersScreen /> },
      { path: 'store', element: <Navigate to="/store/orders" replace /> },
      { path: 'store/orders', element: <StoreOrdersScreen /> },
      { path: 'store/products', element: <StoreProductsScreen /> },
      { path: 'store/categories', element: <StoreCategoriesScreen /> },
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
  { path: '*', element: <ComingSoon title="Page not found" desc="The page you are looking for does not exist." /> },
])
