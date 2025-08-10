import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save, Upload, Camera } from 'lucide-react'

interface User {
    id: string
    username: string
    full_name: string | null
    email: string | null
    user_type: string
    police_rank: string | null
    status: string | null
    station_id: number | null
    contact_number: string | null
    profile_picture_url: string | null
}

interface Station {
    id: number
    name: string
}

interface EditUserProps {
    userId: string
    onBack: () => void
    onSave: () => void
}

export default function EditUser({ userId, onBack, onSave }: EditUserProps) {
    const [user, setUser] = useState<User | null>(null)
    const [stations, setStations] = useState<Station[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        email: '',
        user_type: '',
        police_rank: '',
        status: '',
        station_id: '',
        contact_number: ''
    })

    useEffect(() => {
        fetchStations()
        fetchUser()
    }, [userId])

    const fetchUser = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) throw error

            setUser(data)
            setFormData({
                username: data.username || '',
                full_name: data.full_name || '',
                email: data.email || '',
                user_type: data.user_type || '',
                police_rank: data.police_rank || '',
                status: data.status || '',
                station_id: data.station_id?.toString() || '',
                contact_number: data.contact_number || ''
            })
        } catch (error) {
            console.error('Error fetching user:', error)
            toast({
                title: "Error",
                description: "Failed to fetch user details",
                variant: "destructive"
            })
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

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Error",
                description: "Please select an image file",
                variant: "destructive"
            })
            return
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Error",
                description: "File size must be less than 5MB",
                variant: "destructive"
            })
            return
        }

        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${userId}-${Date.now()}.${fileExt}`

            const { data, error } = await supabase.storage
                .from('profile-pictures')
                .upload(fileName, file)

            if (error) throw error

            const { data: { publicUrl } } = supabase.storage
                .from('profile-pictures')
                .getPublicUrl(fileName)

            // Update user profile picture URL in database
            const { error: updateError } = await supabase
                .from('users')
                .update({ profile_picture_url: publicUrl })
                .eq('id', userId)

            if (updateError) throw updateError

            setProfileImageUrl(publicUrl)
            setUser(prev => prev ? { ...prev, profile_picture_url: publicUrl } : null)

            toast({
                title: "Success",
                description: "Profile picture updated successfully"
            })
        } catch (error) {
            console.error('Error uploading photo:', error)
            toast({
                title: "Error",
                description: "Failed to upload photo",
                variant: "destructive"
            })
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const updateData = {
                ...formData,
                station_id: formData.station_id ? parseInt(formData.station_id) : null
            }

            const { error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', userId)

            if (error) throw error

            toast({
                title: "Success",
                description: "User updated successfully"
            })
            onSave()
        } catch (error) {
            console.error('Error updating user:', error)
            toast({
                title: "Error",
                description: "Failed to update user",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    if (!user) {
        return <div>User not found</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Picture</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-4">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={profileImageUrl || user.profile_picture_url || undefined} />
                            <AvatarFallback className="text-lg">
                                {user.full_name?.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <>
                                    <Camera className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Photo
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>User Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="contact_number">Contact Number</Label>
                                <Input
                                    id="contact_number"
                                    value={formData.contact_number}
                                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="user_type">User Type</Label>
                                <Select value={formData.user_type} onValueChange={(value) => setFormData({ ...formData, user_type: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="supervisor">Supervisor</SelectItem>
                                        <SelectItem value="patroller">Patroller</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="police_rank">Police Rank</Label>
                                <Input
                                    id="police_rank"
                                    value={formData.police_rank}
                                    onChange={(e) => setFormData({ ...formData, police_rank: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="station_id">Station</Label>
                                <Select value={formData.station_id} onValueChange={(value) => setFormData({ ...formData, station_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select station" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stations.map((station) => (
                                            <SelectItem key={station.id} value={station.id.toString()}>
                                                {station.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}