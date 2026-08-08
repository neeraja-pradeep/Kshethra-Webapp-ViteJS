import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'

import { ensureCsrfToken } from '@/core/api/csrf'
import { setUnauthorizedHandler } from '@/core/api/http'

import { AppErrorBoundary } from '@/app/providers/AppErrorBoundary'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { router } from '@/app/router/routes'

function App() {
  useEffect(() => {
    // One CSRF fetch on start; without the cookie every write is a 403.
    void ensureCsrfToken()

    // core/ must not know about the router, so the composition root supplies
    // what a dead session means: back to the login screen.
    setUnauthorizedHandler(() => {
      if (window.location.pathname !== '/login') void router.navigate('/login', { replace: true })
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  return (
    <AppErrorBoundary>
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </AppErrorBoundary>
  )
}

export default App
