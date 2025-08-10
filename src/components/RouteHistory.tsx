import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Clock, Route, Activity, Search, Filter, Map, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import RouteMapModal from './RouteMapModal'
import _ from 'lodash'

interface PatrolSession {
  id: string
  user_id: string
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  distance_km: number | null
  average_speed_kmh: number | null
  max_speed_kmh: number | null
  status: string
  gps_path: any[]
  users: {
    police_rank: string
    full_name: string
    email: string
    station_id: string
    profile_picture_url: string
    stations: {
      name
    }
  }
}

interface Station {
  id: string
  name: string
}

interface User {
  id: string
  police_rank: string
  full_name: string
}

export default function RouteHistory() {
  const [sessions, setSessions] = useState<PatrolSession[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  // const [statusFilter, setStatusFilter] = useState('all')
  const [stationFilter, setStationFilter] = useState('all')
  const [patrollerFilter, setPatrollerFilter] = useState('all')
  const [startDate, setStartDate] = useState(format((Date.now() - 1), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(Date.now(), 'yyyy-MM-dd'))
  const [selectedSession, setSelectedSession] = useState<PatrolSession | null>(null)
  const [showMapModal, setShowMapModal] = useState(false)

  useEffect(() => {
    fetchSessions()
    fetchStations()
    fetchUsers()
  }, [])

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('patrol_sessions')
        .select(`
          *,
          users!inner(
            police_rank,
            full_name,
            email,
            station_id,
            profile_picture_url,
            stations!inner(
              name
            )
          )
        `)
        .order('start_time', { ascending: false })

      if (error) throw error
      setSessions(data)
    } catch (error) {
      console.error('Error fetching patrol sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStations = async () => {
    try {
      const { data, error } = await supabase
        .from('stations')
        .select('id, name')
        .order('name')

      if (error) throw error
      setStations(data || [])
    } catch (error) {
      console.error('Error fetching stations:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, police_rank, full_name')
        .neq('user_type', 'admin')
        .order('full_name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching stations:', error)
    }
  }

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.users.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.users.email.toLowerCase().includes(searchTerm.toLowerCase())
    // const matchesStatus = statusFilter === 'all' || session.status === statusFilter
    const matchesStation = stationFilter === 'all' || session.users.station_id === stationFilter
    const matchesPatroller = patrollerFilter === 'all' || session.user_id === patrollerFilter

    // Date filtering
    const sessionDate = new Date(session.start_time).toISOString().split('T')[0]
    const matchesStartDate = !startDate || sessionDate >= startDate
    const matchesEndDate = !endDate || sessionDate <= endDate

    return matchesSearch && matchesStation && matchesPatroller && matchesStartDate && matchesEndDate
  })

  // Get unique patrollers for filter
  const uniquePatrollers = _.groupBy(sessions.map(session => { session.user_id, session.users.full_name }), 'user_id');

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Route History</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Route History</h1>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-10 w-36"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-10 w-36"
            />
          </div>

          {/* <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select> */}
          <Select value={stationFilter} onValueChange={setStationFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Station" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stations</SelectItem>
              {stations.map(station => (
                <SelectItem key={station.id} value={station.id}>{station.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={patrollerFilter} onValueChange={setPatrollerFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Patroller" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patrollers</SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>{user.police_rank} {user.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSessions.map((session) => (
          <Card key={session.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{session.users.police_rank} {session.users.full_name}</CardTitle>
                  <p className="text-sm text-gray-500">{session.users?.stations.name}</p>
                </div>
                <Badge className={getStatusColor(session.status)}>
                  {session.status || 'Unknown'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  {format(new Date(session.start_time), 'MMM dd, yyyy HH:mm')}
                  {session.end_time && ` - ${format(new Date(session.end_time), 'HH:mm')}`}
                </span>
              </div>

              {session.duration_minutes && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Activity className="h-4 w-4" />
                  <span>{session.duration_minutes} minutes</span>
                </div>
              )}

              {session.distance_km && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Route className="h-4 w-4" />
                  <span>{session.distance_km} km</span>
                  {session.average_speed_kmh && (
                    <span className="text-gray-400">
                      • Avg: {session.average_speed_kmh} km/h
                    </span>
                  )}
                </div>
              )}

              {session.gps_path && session.gps_path.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{session.gps_path.length} GPS points</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedSession(session)
                      setShowMapModal(true)
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    <Map className="h-3 w-3 mr-1" />
                    View Route
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <RouteMapModal
        session={selectedSession}
        open={showMapModal}
        onClose={() => {
          setShowMapModal(false)
          setSelectedSession(null)
        }}
      />

      {filteredSessions.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No patrol sessions found</p>
            <p className="text-sm text-gray-400 mt-2">
              {searchTerm !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Patrol sessions will appear here once patrollers start their routes'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}