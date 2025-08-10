import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Clock, Route, Users, Activity, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AnalyticsData {
  totalPatrols: number
  activePatrollers: number
  averageDuration: number
  totalDistance: number
  patrolsByDay: Array<{ day: string; count: number }>
  patrolsByHour: Array<{ hour: string; count: number }>
  statusDistribution: Array<{ name: string; value: number; color: string }>
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData>({
    totalPatrols: 0,
    activePatrollers: 0,
    averageDuration: 0,
    totalDistance: 0,
    patrolsByDay: [],
    patrolsByHour: [],
    statusDistribution: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  const fetchAnalytics = async () => {
    try {
      // Get date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90))

      // Fetch patrol sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('patrol_sessions')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (sessionsError) throw sessionsError

      // Fetch active users
      const { data: activeUsers, error: usersError } = await supabase
        .from('users')
        .select('status')
        .eq('status', 'active')

      if (usersError) throw usersError

      // Process data
      const totalPatrols = sessions?.length || 0
      const activePatrollers = activeUsers?.length || 0
      const averageDuration = sessions?.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) / totalPatrols || 0
      const totalDistance = sessions?.reduce((acc, s) => acc + (s.distance_km || 0), 0) || 0
      // Process charts data
      const patrolsByDay = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        const dayName = date.toLocaleDateString('en', { weekday: 'short' })
        const dayCount = sessions?.filter(s => 
          new Date(s.created_at).toDateString() === date.toDateString()
        ).length || 0
        return { day: dayName, count: dayCount }
      })

      const statusDistribution = [
        { name: 'Active', value: sessions?.filter(s => s.status === 'active').length || 0, color: '#10B981' },
        { name: 'Completed', value: sessions?.filter(s => s.status === 'completed').length || 0, color: '#3B82F6' },
        { name: 'Paused', value: sessions?.filter(s => s.status === 'paused').length || 0, color: '#F59E0B' }
      ]

      setData({
        totalPatrols,
        activePatrollers,
        averageDuration: Math.round(averageDuration),
        totalDistance: Math.round(totalDistance),
        patrolsByDay,
        patrolsByHour: [],
        statusDistribution
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const metrics = [
    {
      title: 'Total Patrols',
      value: data.totalPatrols,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Patrollers',
      value: data.activePatrollers,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Avg Duration',
      value: `${data.averageDuration}m`,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Total Distance',
      value: `${data.totalDistance}km`,
      icon: Route,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <div className="flex space-x-2">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-sm ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${metric.bgColor}`}>
                      <metric.icon className={`h-6 w-6 ${metric.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Patrol Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.patrolsByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" name="Patrols" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.statusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {data.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}