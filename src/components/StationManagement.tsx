import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Building2, Plus, Edit, Trash2, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface Station {
  id: number
  name: string
  address: string
  contact_number: string
  created_at: string
}

export default function StationManagement() {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStation, setEditingStation] = useState<Station | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact_number: ''
  })
  const { toast } = useToast()

  const fetchStations = async () => {
    try {
      const { data, error } = await supabase
        .from('stations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setStations(data || [])
    } catch (error) {
      console.error('Error fetching stations:', error)
      toast({
        title: "Error",
        description: "Failed to fetch stations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStations()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingStation) {
        const { error } = await supabase
          .from('stations')
          .update(formData)
          .eq('id', editingStation.id)

        if (error) throw error
        toast({
          title: "Success",
          description: "Station updated successfully"
        })
      } else {
        const { error } = await supabase
          .from('stations')
          .insert([formData])

        if (error) throw error
        toast({
          title: "Success",
          description: "Station created successfully"
        })
      }

      setDialogOpen(false)
      setEditingStation(null)
      setFormData({ name: '', address: '', contact_number: '' })
      fetchStations()
    } catch (error) {
      console.error('Error saving station:', error)
      toast({
        title: "Error",
        description: "Failed to save station",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (station: Station) => {
    setEditingStation(station)
    setFormData({
      name: station.name,
      address: station.address,
      contact_number: station.contact_number
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this station?')) return

    try {
      const { error } = await supabase
        .from('stations')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast({
        title: "Success",
        description: "Station deleted successfully"
      })
      fetchStations()
    } catch (error) {
      console.error('Error deleting station:', error)
      toast({
        title: "Error",
        description: "Failed to delete station",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Station Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Station
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStation ? 'Edit Station' : 'Add New Station'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Station Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="contact">Contact Number</Label>
                <Input
                  id="contact"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingStation ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))
        ) : stations.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No stations found</p>
          </div>
        ) : (
          stations.map((station) => (
            <Card key={station.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Building2 className="mr-2 h-5 w-5 text-blue-600" />
                    {station.name}
                  </div>
                  {/* <Badge variant="outline">ID: {station.id}</Badge> */}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start">
                  <MapPin className="mr-2 h-4 w-4 text-gray-500 mt-0.5" />
                  <p className="text-sm text-gray-600">{station.address}</p>
                </div>
                <p className="text-sm text-gray-600">📞 {station.contact_number}</p>
                <p className="text-xs text-gray-500">
                  Created: {new Date(station.created_at).toLocaleDateString()}
                </p>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(station)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(station.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}