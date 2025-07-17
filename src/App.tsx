import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { Dashboard } from './components/pages/Dashboard'
import { InvoiceUpload } from './components/pages/InvoiceUpload'
import { InvoiceManagement } from './components/pages/InvoiceManagement'
import { DataEditor } from './components/pages/DataEditor'
import { AIInsights } from './components/pages/AIInsights'
import { Reports } from './components/pages/Reports'
import { Settings } from './components/pages/Settings'
import { Toaster } from './components/ui/sonner'

type Page = 'dashboard' | 'upload' | 'management' | 'editor' | 'insights' | 'reports' | 'settings'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    
    // Listen for navigation events
    const handleNavigateToUpload = () => {
      setCurrentPage('upload')
    }
    
    window.addEventListener('navigateToUpload', handleNavigateToUpload)
    
    return () => {
      unsubscribe()
      window.removeEventListener('navigateToUpload', handleNavigateToUpload)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-3xl font-bold text-foreground mb-4">AI Accounting Workflow</h1>
          <p className="text-muted-foreground mb-6">
            Streamline your accounting process with AI-powered invoice management
          </p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />
      case 'upload':
        return <InvoiceUpload />
      case 'management':
        return <InvoiceManagement />
      case 'editor':
        return <DataEditor />
      case 'insights':
        return <AIInsights />
      case 'reports':
        return <Reports />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        <div className="flex-1 flex flex-col">
          <Header user={user} />
          <main className="flex-1 p-6">
            {renderPage()}
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  )
}

export default App