import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import NotificationProvider from './components/NotificationProvider.jsx'
import AuthProvider from './components/AuthProvider.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter useTransitions={false}><NotificationProvider><AuthProvider><App /></AuthProvider></NotificationProvider></BrowserRouter>
  </StrictMode>,
)
