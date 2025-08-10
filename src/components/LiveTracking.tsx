import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, RefreshCw, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import MapboxMap from './MapboxMap'

interface Patroller {
  id: string
  full_name: string
  status: string
  current_latitude: number | null
  current_longitude: number | null
  last_location_update: string | null
  route_points: any[]
  station_id: number | null
}

export default function LiveTracking() {
  const [patrollers, setPatrollers] = useState<Patroller[]>([])
  const [selectedPatroller, setSelectedPatroller] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPatrollers = async () => {
    try {
      const { data, error } = await supabase
        .from('patrol_sessions')
        .select(`
          id,
          user_id,
          status,
          current_latitude,
          current_longitude,
          last_location_update,
          route_points,
          users!inner(
            full_name,
            station_id
          )
        `)
        .eq('status', 'active')
        .order('last_location_update', { ascending: false })

      if (error) throw error

      const formattedData = data?.map(session => ({
        id: session.user_id,
        full_name: session.users.full_name || 'Unknown',
        status: session.status,
        current_latitude: session.current_latitude,
        current_longitude: session.current_longitude,
        last_location_update: session.last_location_update,
        route_points: session.route_points || [],
        station_id: session.users.station_id
      })) || []

      setPatrollers(formattedData)
    } catch (error) {
      console.error('Error fetching patrollers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatrollers()
    const interval = setInterval(fetchPatrollers, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const refreshData = () => {
    setLoading(true)
    fetchPatrollers()
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'on_patrol': return 'secondary'
      case 'paused': return 'outline'
      default: return 'outline'
    }
  }

  const formatLastUpdate = (timestamp: string | null) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    return `${diffHours}h ${diffMinutes % 60}m ago`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Live Tracking</h1>
        <Button onClick={refreshData} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Live Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MapboxMap 
                patrollers={patrollers}
                selectedPatroller={selectedPatroller}
                onPatrollerSelect={setSelectedPatroller}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Active Patrollers ({patrollers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : patrollers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No active patrollers</p>
              ) : (
                <div className="space-y-4">
                  {patrollers.map((patroller) => (
                    <div 
                      key={patroller.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedPatroller === patroller.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPatroller(
                        selectedPatroller === patroller.id ? null : patroller.id
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{patroller.full_name}</h3>
                        <Badge variant={getStatusBadgeVariant(patroller.status)}>
                          {patroller.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Station {patroller.station_id || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Last update: {formatLastUpdate(patroller.last_location_update)}
                      </p>
                      {patroller.current_latitude && patroller.current_longitude && (
                        <div className="text-xs text-gray-400 mt-2">
                          Lat: {patroller.current_latitude.toFixed(4)}, 
                          Lng: {patroller.current_longitude.toFixed(4)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}