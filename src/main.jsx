import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ConfigProvider } from './contexts/ConfigContext.jsx'
import { OffcutProvider } from './contexts/OffcutContext.jsx'
import { WorkInstanceProvider } from './contexts/WorkInstanceContext.jsx'
import { SubsidiaryProvider } from './contexts/SubsidiaryContext'
import { AlertTriangle } from 'lucide-react'
import { AppRouter } from './router'
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
 * Main Application with unified AppRouter
 */
function MainApp() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <SubsidiaryProvider>
          <ConfigProvider>
            <OffcutProvider>
              <WorkInstanceProvider>
                <AppRouter />
              </WorkInstanceProvider>
            </OffcutProvider>
          </ConfigProvider>
        </SubsidiaryProvider>
      </AuthProvider>
    </HelmetProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  </React.StrictMode>,
)
