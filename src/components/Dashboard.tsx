import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, MapPin, Activity, Building2 } from 'lucide-react'

const stats = [
  {
    title: 'Active Patrollers',
    value: '24',
    change: '+2 from yesterday',
    icon: Users,
    color: 'text-green-600'
  },
  {
    title: 'Total Stations',
    value: '12',
    change: 'All operational',
    icon: Building2,
    color: 'text-blue-600'
  },
  {
    title: 'Routes Today',
    value: '156',
    change: '+12% from yesterday',
    icon: MapPin,
    color: 'text-purple-600'
  },
  {
    title: 'Avg Response Time',
    value: '4.2m',
    change: '-0.5m improvement',
    icon: Activity,
    color: 'text-orange-600'
  }
]

const recentActivity = [
  { id: 1, patroller: 'John Doe', action: 'Started patrol route A-1', time: '2 minutes ago', status: 'active' },
  { id: 2, patroller: 'Sarah Smith', action: 'Completed checkpoint B-3', time: '5 minutes ago', status: 'completed' },
  { id: 3, patroller: 'Mike Johnson', action: 'Reported incident at Station 5', time: '12 minutes ago', status: 'alert' },
  { id: 4, patroller: 'Lisa Brown', action: 'Ended shift at Station 2', time: '18 minutes ago', status: 'inactive' }
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{activity.patroller}</p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={activity.status === 'active' ? 'default' : 
                                  activity.status === 'alert' ? 'destructive' : 'secondary'}>
                      {activity.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors">
                <MapPin className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-900">View Live Map</p>
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors">
                <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-900">Add Patroller</p>
              </button>
              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors">
                <Building2 className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-purple-900">Manage Stations</p>
              </button>
              <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-center transition-colors">
                <Activity className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-orange-900">View Reports</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}