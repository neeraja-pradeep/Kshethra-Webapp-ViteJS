import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AdminLayout } from '@/app/layout/AdminLayout'
import { ComingSoon } from '@/shared/ui/ComingSoon'

/**
 * Application routes. Each module mounts its screen here; modules not yet
 * implemented render a ComingSoon placeholder so navigation always resolves.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <ComingSoon title="Dashboard" desc="Operational snapshot." /> },
      { path: 'counter', element: <ComingSoon title="Counter Bookings" desc="Walk-in counter sales and receipts." /> },
      { path: 'pooja-bookings', element: <ComingSoon title="Pooja Bookings" desc="Execution view — poojas to perform, by date." /> },
      { path: 'pooja-orders', element: <ComingSoon title="Pooja Orders" desc="Transaction view — orders, payments, refunds." /> },
      { path: 'store', element: <Navigate to="/store/orders" replace /> },
      { path: 'store/orders', element: <ComingSoon title="Store — Orders" desc="Store orders — fulfilment and refunds." /> },
      { path: 'store/products', element: <ComingSoon title="Store — Products" desc="Products, pricing, and stock." /> },
      { path: 'store/categories', element: <ComingSoon title="Store — Categories" desc="Product categories and their order." /> },
      { path: 'poojas', element: <ComingSoon title="Poojas" desc="All poojas and their pricing." /> },
      { path: 'gods', element: <ComingSoon title="Gods" desc="Gods referenced by poojas." /> },
      { path: 'devotees', element: <ComingSoon title="Devotees" desc="App user accounts and booking history." /> },
      { path: 'notifications', element: <ComingSoon title="Notifications" desc="Broadcast messages to app users." /> },
      { path: 'media', element: <ComingSoon title="Media" desc="Audio tracks and cover art for the app." /> },
      { path: 'agent-codes', element: <ComingSoon title="Agent code" desc="Booking-agent codes and attribution." /> },
      { path: 'reports', element: <ComingSoon title="Reports" desc="Financial reconciliation and reports." /> },
      { path: 'users-roles', element: <ComingSoon title="Users & Roles" desc="Employee and login registry." /> },
    ],
  },
  { path: '/login', element: <ComingSoon title="Sign in" desc="Kshetra Admin authentication." /> },
  { path: '*', element: <ComingSoon title="Page not found" desc="The page you are looking for does not exist." /> },
])
