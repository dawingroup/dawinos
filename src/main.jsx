import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { ConfigProvider } from './contexts/ConfigContext.jsx'
import { OffcutProvider } from './contexts/OffcutContext.jsx'
import { WorkInstanceProvider } from './contexts/WorkInstanceContext.jsx'
import DesignManagerModule from './modules/design-manager/DesignManagerModule'
import CustomerHubModule from './modules/customer-hub/CustomerHubModule'
import LaunchPipelineModule from './modules/launch-pipeline/LaunchPipelineModule'
import { FolderOpen, User, LogOut, Users, Layers, Cog, Wrench, AlertTriangle, Rocket } from 'lucide-react'
import { AssetRegistryPage } from './modules/assets'
import './index.css'

/**
 * Error Boundary to catch and display runtime errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-8 h-8" />
              <h1 className="text-xl font-bold">Something went wrong</h1>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <p className="text-sm font-mono text-red-800 break-all">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>
            <details className="text-xs text-gray-600 mb-4">
              <summary className="cursor-pointer font-medium">Stack trace</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-48 text-xs">
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-[#872E5C] text-white rounded-md hover:bg-[#6a2449]"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Global Header with Module Switcher
 * Apple-inspired black theme (#1d1d1f)
 */
function GlobalHeader() {
  const { user, isAuthenticated, signInWithGoogle, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  const currentModule = location.pathname.startsWith('/design/materials') ? 'materials' :
    location.pathname.startsWith('/design/features') ? 'features' :
    location.pathname.startsWith('/launch-pipeline') ? 'launch-pipeline' :
    location.pathname.startsWith('/design') ? 'design' : 
    location.pathname.startsWith('/customers') ? 'customers' :
    location.pathname.startsWith('/assets') ? 'assets' : 'design'

  return (
    <header className="sticky top-0 z-50 h-16 sm:h-14 border-b border-gray-200 bg-white/95 backdrop-blur px-2 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
      {/* Left: Logo and Brand */}
      <div className="flex items-center gap-2">
        <div 
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#872E5C] to-[#E18425] cursor-pointer"
          onClick={() => navigate('/design')}
        >
          <FolderOpen className="h-5 w-5 text-white" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold text-gray-900">Dawin Finishes</h1>
          <p className="text-[10px] text-gray-500">Manufacturing Tools</p>
        </div>
      </div>

      {/* Center: Module Switcher */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 border rounded-lg p-1 bg-gray-50 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => navigate('/design')}
          className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-md text-sm font-medium transition-colors ${
            currentModule === 'design'
              ? 'bg-[#1d1d1f] text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <FolderOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Design Manager</span>
          <span className="sm:hidden">Designs</span>
        </button>
        <button
          onClick={() => navigate('/customers')}
          className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-md text-sm font-medium transition-colors ${
            currentModule === 'customers'
              ? 'bg-[#1d1d1f] text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Customers</span>
          <span className="sm:hidden">CRM</span>
        </button>
        <button
          onClick={() => navigate('/design/materials')}
          className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-md text-sm font-medium transition-colors ${
            currentModule === 'materials'
              ? 'bg-[#1d1d1f] text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span className="hidden sm:inline">Materials</span>
          <span className="sm:hidden">Mat</span>
        </button>
        <button
          onClick={() => navigate('/design/features')}
          className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-md text-sm font-medium transition-colors ${
            currentModule === 'features'
              ? 'bg-[#1d1d1f] text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Cog className="h-4 w-4" />
          <span className="hidden sm:inline">Features</span>
          <span className="sm:hidden">Feat</span>
        </button>
        <button
          onClick={() => navigate('/assets')}
          className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-md text-sm font-medium transition-colors ${
            currentModule === 'assets'
              ? 'bg-[#1d1d1f] text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Wrench className="h-4 w-4" />
          <span className="hidden sm:inline">Assets</span>
        </button>
        <button
          onClick={() => navigate('/launch-pipeline')}
          className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-md text-sm font-medium transition-colors ${
            currentModule === 'launch-pipeline'
              ? 'bg-[#1d1d1f] text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Rocket className="h-4 w-4" />
          <span className="hidden sm:inline">Launch</span>
        </button>
        </div>
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
              className="p-2 min-h-[44px] min-w-[44px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signInWithGoogle()}
            className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-[#1d1d1f] text-white rounded-md text-sm font-medium hover:bg-[#424245] transition-colors"
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
                  <Route path="/customers/*" element={<CustomerHubModule />} />
                  <Route path="/assets" element={<AssetRegistryPage />} />
                  <Route path="/launch-pipeline/*" element={<LaunchPipelineModule />} />
                  {/* Redirect root and legacy cutlist routes to Design Manager */}
                  <Route path="/" element={<Navigate to="/design" replace />} />
                  <Route path="/cutlist" element={<Navigate to="/design" replace />} />
                  <Route path="/*" element={<Navigate to="/design" replace />} />
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
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  </React.StrictMode>,
)
