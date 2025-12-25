import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ConfigProvider } from './contexts/ConfigContext.jsx'
import { OffcutProvider } from './contexts/OffcutContext.jsx'
import { WorkInstanceProvider } from './contexts/WorkInstanceContext.jsx'
import DesignManagerModule from './modules/design-manager/DesignManagerModule'
import './index.css'

/**
 * Main Application with Module Routing
 * 
 * Routes:
 * - / (root): Cutlist Processor (legacy App.jsx)
 * - /design/*: Design Manager module
 */
function MainApp() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfigProvider>
          <OffcutProvider>
            <WorkInstanceProvider>
              <Routes>
                <Route path="/design/*" element={<DesignManagerModule />} />
                <Route path="/*" element={<App />} />
              </Routes>
            </WorkInstanceProvider>
          </OffcutProvider>
        </ConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>,
)
