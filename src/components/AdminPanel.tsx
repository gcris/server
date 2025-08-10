import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Login from './Login'
// import GoogleAuth from './GoogleAuth'
import Sidebar from './Sidebar'
import Dashboard from './Dashboard'
import LiveTracking from './LiveTracking'
import UserManagement from './UserManagement'
import Analytics from './Analytics'
import RouteHistory from './RouteHistory'
import StationManagement from './StationManagement'

export default function AdminPanel() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  // const [showGoogleAuth, setShowGoogleAuth] = useState(false)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setActiveTab('dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={(userData) => {
      setUser(userData)
      // setShowGoogleAuth(true)
    }} />
  }

  // if (showGoogleAuth) {
  //   return <GoogleAuth
  //     user={user}
  //     onAuthComplete={() => setShowGoogleAuth(false)}
  //   />
  // }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      // case 'live-tracking':
      //   return <LiveTracking />
      case 'route-history':
        return <RouteHistory />
      case 'analytics':
        return <Analytics />
      case 'users':
        return <UserManagement />
      case 'stations':
        return <StationManagement />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-auto p-8">
        {renderContent()}
      </main>
    </div>
  )
}