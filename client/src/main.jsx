import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './ui/ui.css'
import App from './App.jsx'
import { receiveSessionHandoff } from './sessionBridge'

// An expired handoff returns to the normal sign-in screen.
await receiveSessionHandoff().catch(() => {});
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
