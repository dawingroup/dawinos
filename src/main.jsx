import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { ConfigProvider } from './contexts/ConfigContext.jsx'
import { OffcutProvider } from './contexts/OffcutContext.jsx'
import { WorkInstanceProvider } from './contexts/WorkInstanceContext.jsx'
import { SubsidiaryProvider } from './contexts/SubsidiaryContext'
import DesignManagerModule from './modules/design-manager/DesignManagerModule'
import CustomerHubModule from './modules/customer-hub/CustomerHubModule'
import LaunchPipelineModule from './modules/launch-pipeline/LaunchPipelineModule'
import { FolderOpen, User, LogOut, Users, Layers, Cog, Wrench, AlertTriangle, Rocket, Database, Image, Home, Package, HardHat, Building2, ChevronDown, Check } from 'lucide-react'
import { useSubsidiary } from './contexts/SubsidiaryContext'
import { AssetRegistryPage } from './modules/assets'
import ClipperPage from './app/pages/ClipperPage'
import DawinOSDashboard from './app/pages/DawinOSDashboard'
import SettingsPage from './app/pages/SettingsPage'
import InventoryPage from './modules/inventory/pages/InventoryPage'
import { AdvisoryRoutes } from './subsidiaries/advisory/AdvisoryModule'
import './index.css'

// PWA initialization
import { initPWA } from './pwa/initPWA'
initPWA()

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
 * Dynamic navigation based on current subsidiary
 */
function GlobalHeader() {
  const { user, isAuthenticated, signInWithGoogle, signOut } = useAuth()
  const { currentSubsidiary, subsidiaries, setCurrentSubsidiary } = useSubsidiary()
  const location = useLocation()
  const navigate = useNavigate()
  const [showSubsidiaryMenu, setShowSubsidiaryMenu] = useState(false)
  const menuRef = useRef(null)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowSubsidiaryMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const isAdvisory = currentSubsidiary?.id === 'dawin-advisory'
  
  const currentModule = location.pathname === '/' ? 'home' :
    location.pathname.startsWith('/advisory/matflow') ? 'matflow' :
    location.pathname.startsWith('/advisory') ? 'advisory' :
    location.pathname.startsWith('/clipper') ? 'clipper' :
    location.pathname.startsWith('/inventory') ? 'inventory' :
    location.pathname.startsWith('/design/features') ? 'features' :
    location.pathname.startsWith('/launch-pipeline') ? 'launch-pipeline' :
    location.pathname.startsWith('/design') ? 'design' : 
    location.pathname.startsWith('/customers') ? 'customers' :
    location.pathname.startsWith('/assets') ? 'assets' : 'home'

  // Navigation items for Finishes
  const finishesNav = [
    { id: 'home', path: '/', icon: Home, label: 'Home', shortLabel: 'Home' },
    { id: 'clipper', path: '/clipper', icon: Image, label: 'Clipper', shortLabel: 'Clipper' },
    { id: 'design', path: '/design', icon: FolderOpen, label: 'Design Manager', shortLabel: 'Designs' },
    { id: 'customers', path: '/customers', icon: Users, label: 'Customers', shortLabel: 'CRM' },
    { id: 'inventory', path: '/inventory', icon: Package, label: 'Inventory', shortLabel: 'Inv' },
    { id: 'features', path: '/design/features', icon: Cog, label: 'Features', shortLabel: 'Feat' },
    { id: 'assets', path: '/assets', icon: Wrench, label: 'Assets', shortLabel: 'Assets' },
    { id: 'launch-pipeline', path: '/launch-pipeline', icon: Rocket, label: 'Launch', shortLabel: 'Launch' },
  ]
  
  // Navigation items for Advisory
  const advisoryNav = [
    { id: 'home', path: '/', icon: Home, label: 'Home', shortLabel: 'Home' },
    { id: 'matflow', path: '/advisory/matflow', icon: HardHat, label: 'MatFlow', shortLabel: 'MatFlow' },
  ]
  
  const navItems = isAdvisory ? advisoryNav : finishesNav
  const brandColor = currentSubsidiary?.color || '#872E5C'

  return (
    <header className="sticky top-0 z-50 h-16 sm:h-14 border-b border-gray-200 bg-white/95 backdrop-blur px-2 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
      {/* Left: Logo with Subsidiary Switcher */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowSubsidiaryMenu(!showSubsidiaryMenu)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div 
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: `linear-gradient(135deg, ${brandColor}, #E18425)` }}
          >
            {isAdvisory ? (
              <HardHat className="h-5 w-5 text-white" />
            ) : (
              <FolderOpen className="h-5 w-5 text-white" />
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <span className="text-sm font-semibold text-gray-900">{currentSubsidiary?.name || 'DawinOS'}</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
        </button>
        
        {/* Subsidiary Dropdown */}
        {showSubsidiaryMenu && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase">Switch Subsidiary</p>
            </div>
            {subsidiaries?.map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  setCurrentSubsidiary(sub)
                  setShowSubsidiaryMenu(false)
                  navigate('/')
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors ${
                  currentSubsidiary?.id === sub.id ? 'bg-gray-50' : ''
                }`}
              >
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: `linear-gradient(135deg, ${sub.color}, #E18425)` }}
                >
                  {sub.id === 'dawin-advisory' ? (
                    <HardHat className="h-4 w-4 text-white" />
                  ) : (
                    <FolderOpen className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                  <p className="text-xs text-gray-500">{sub.description}</p>
                </div>
                {currentSubsidiary?.id === sub.id && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Center: Module Switcher */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 border rounded-lg p-1 bg-gray-50 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentModule === item.id
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1d1d1f] text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
                {item.shortLabel !== item.label && (
                  <span className="sm:hidden">{item.shortLabel}</span>
                )}
              </button>
            )
          })}
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
              onClick={() => navigate('/settings')}
              className="p-2 min-h-[44px] min-w-[44px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Settings"
            >
              <Cog className="w-4 h-4" />
            </button>
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
        <SubsidiaryProvider>
          <ConfigProvider>
            <OffcutProvider>
              <WorkInstanceProvider>
                <AppLayout>
                <Routes>
                  <Route path="/" element={<DawinOSDashboard />} />
                  <Route path="/clipper" element={<ClipperPage />} />
                  <Route path="/design/*" element={<DesignManagerModule />} />
                  <Route path="/customers/*" element={<CustomerHubModule />} />
                  <Route path="/assets" element={<AssetRegistryPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/launch-pipeline/*" element={<LaunchPipelineModule />} />
                  <Route path="/advisory/*" element={<AdvisoryRoutes />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  {/* Redirect legacy cutlist routes to Design Manager */}
                  <Route path="/cutlist" element={<Navigate to="/design" replace />} />
                  <Route path="/*" element={<Navigate to="/" replace />} />
                </Routes>
                </AppLayout>
              </WorkInstanceProvider>
            </OffcutProvider>
          </ConfigProvider>
        </SubsidiaryProvider>
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
