import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Phosphor webfont — regular (default UI) + fill (active/selected state).
import '@phosphor-icons/web/regular'
import '@phosphor-icons/web/fill'

import App from './app/App'
import './index.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
