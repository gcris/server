import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Patroller {
  id: string
  name: string
  status: string
  current_latitude: number | null
  current_longitude: number | null
  last_location_update: string | null
  route_points: any[]
}

interface MapboxMapProps {
  patrollers: Patroller[]
  selectedPatroller: string | null
  onPatrollerSelect: (id: string | null) => void
}

export default function MapboxMap({ patrollers, selectedPatroller, onPatrollerSelect }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [mapboxLoaded, setMapboxLoaded] = useState(false)

  useEffect(() => {
    // Load Mapbox GL JS
    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'
    script.onload = () => {
      const link = document.createElement('link')
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css'
      link.rel = 'stylesheet'
      document.head.appendChild(link)
      setMapboxLoaded(true)
    }
    document.head.appendChild(script)

    return () => {
      if (map.current) map.current.remove()
    }
  }, [])

  useEffect(() => {
    if (!mapboxLoaded || !mapContainer.current || map.current) return

    // Get Mapbox token from Supabase secrets
    const initializeMap = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-mapbox-token')
        const token = data?.token || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'

        // @ts-ignore
        window.mapboxgl.accessToken = token

        // @ts-ignore
        // console.log(mapContainer);
        map.current = new window.mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-74.0060, 40.7128], // NYC default
          zoom: 12
        })

        // Add navigation controls
        // @ts-ignore
        map.current.addControl(new window.mapboxgl.NavigationControl())

        map.current.on('load', () => {
          updatePatrollerMarkers()
        })
      } catch (error) {
        console.error('Failed to initialize map:', error)
      }
    }

    initializeMap()
  }, [mapboxLoaded])

  const updatePatrollerMarkers = () => {
    if (!map.current) return

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.mapbox-marker')
    existingMarkers.forEach(marker => marker.remove())

    // Add markers for active patrollers
    patrollers.forEach(patroller => {
      if (!patroller.current_latitude || !patroller.current_longitude) return

      // @ts-ignore
      const el = document.createElement('div')
      el.className = 'mapbox-marker'
      el.style.width = '20px'
      el.style.height = '20px'
      el.style.borderRadius = '50%'
      el.style.cursor = 'pointer'
      el.style.border = '2px solid white'
      el.style.backgroundColor = patroller.status === 'active' ? '#10B981' :
        patroller.status === 'on_patrol' ? '#F59E0B' : '#6B7280'

      // @ts-ignore
      new window.mapboxgl.Marker(el)
        .setLngLat([patroller.current_longitude, patroller.current_latitude])
        .addTo(map.current)

      el.addEventListener('click', () => {
        onPatrollerSelect(selectedPatroller === patroller.id ? null : patroller.id)
      })
    })
  }

  useEffect(() => {
    updatePatrollerMarkers()
  }, [patrollers, selectedPatroller])

  if (!mapboxLoaded) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Map...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="relative w-full h-96 rounded-lg">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      <button
        onClick={() => {
          if (mapContainer.current) {
            if (document.fullscreenElement) {
              document.exitFullscreen()
            } else {
              mapContainer.current.requestFullscreen()
            }
          }
        }}
        className="absolute top-2 right-2 bg-white hover:bg-gray-50 border border-gray-300 rounded p-2 shadow-sm z-10 transition-colors"
        title="Toggle fullscreen"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>
  )
}