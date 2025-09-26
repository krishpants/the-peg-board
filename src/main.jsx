import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fortawesome/fontawesome-free/css/all.min.css'
import BadmintonQueue from './BadmintonQueue.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BadmintonQueue />
  </StrictMode>,
)
