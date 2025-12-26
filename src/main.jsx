import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { ConfigProvider } from './contexts/ConfigContext.jsx'
import { OffcutProvider } from './contexts/OffcutContext.jsx'
import { WorkInstanceProvider } from './contexts/WorkInstanceContext.jsx'
import DesignManagerModule from './modules/design-manager/DesignManagerModule'
import { Scissors, FolderOpen, User, LogOut } from 'lucide-react'
import './index.css'

/**
 * Global Header with Module Switcher
 * Apple-inspired black theme (#1d1d1f)
 */
function GlobalHeader() {
  const { user, isAuthenticated, signInWithGoogle, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  const currentModule = location.pathname.startsWith('/design') ? 'design' : 'cutlist'

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-gray-200 bg-white/95 backdrop-blur px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left: Logo and Brand */}
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#872E5C] to-[#E18425]">
          {currentModule === 'cutlist' ? (
            <Scissors className="h-5 w-5 text-white" />
          ) : (
            <FolderOpen className="h-5 w-5 text-white" />
          )}
        </div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold text-gray-900">Dawin Finishes</h1>
          <p className="text-[10px] text-gray-500">Manufacturing Tools</p>
        </div>
      </div>

      {/* Center: Module Switcher */}
      <div className="flex items-center gap-1 border rounded-lg p-1 bg-gray-50">
        <button
          onClick={() => navigate('/')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            currentModule === 'cutlist'
              ? 'bg-[#1d1d1f] text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Scissors className="h-4 w-4" />
          <span className="hidden sm:inline">Cutlist Processor</span>
          <span className="sm:hidden">Cutlist</span>
        </button>
        <button
          onClick={() => navigate('/design')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            currentModule === 'design'
              ? 'bg-[#1d1d1f] text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <FolderOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Design Manager</span>
          <span className="sm:hidden">Designs</span>
        </button>
      </div>

      {/* Right: User Menu */}
      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
              <span className="text-sm text-gray-700 hidden md:block">
                {user.displayName || user.email}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signInWithGoogle()}
            className="flex items-center gap-2 px-4 py-2 bg-[#1d1d1f] text-white rounded-md text-sm font-medium hover:bg-[#424245] transition-colors"
          >
            <User className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </div>
    </header>
  )
}

/**
 * App Layout with Global Header
 */
function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 flex flex-col">
      <GlobalHeader />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

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
              <AppLayout>
                <Routes>
                  <Route path="/design/*" element={<DesignManagerModule />} />
                  <Route path="/*" element={<App />} />
                </Routes>
              </AppLayout>
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
