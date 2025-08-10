import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'

interface RouteMapModalProps {
  session: any
  open: boolean
  onClose: () => void
}

export default function RouteMapModal({ session, open, onClose }: RouteMapModalProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [mapboxLoaded, setMapboxLoaded] = useState(false)

  useEffect(() => {
    if (!open) return

    // Check if mapbox is already loaded
    if (window.mapboxgl && window.mapboxgl.Map) {
      setMapboxLoaded(true)
      return
    }

    // Only load if not already loading/loaded
    if (document.querySelector('script[src*="mapbox-gl.js"]')) {
      // Script already exists, wait for it to load
      const checkMapbox = setInterval(() => {
        if (window.mapboxgl && window.mapboxgl.Map) {
          setMapboxLoaded(true)
          clearInterval(checkMapbox)
        }
      }, 100)
      return () => clearInterval(checkMapbox)
    }

    // Load Mapbox GL JS
    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'
    script.onload = () => {
      const link = document.createElement('link')
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css'
      link.rel = 'stylesheet'
      document.head.appendChild(link)

      // Wait for mapbox to be fully available
      const checkMapbox = setInterval(() => {
        if (window.mapboxgl && window.mapboxgl.Map) {
          setMapboxLoaded(true)
          clearInterval(checkMapbox)
        }
      }, 50)
    }
    document.head.appendChild(script)

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [open])

  useEffect(() => {
    // console.log('Initialize mapbox');
    // console.log('mapboxLoaded', mapboxLoaded);
    // console.log('mapContainer.current', mapContainer.current);
    // console.log('map.current', map.current);
    // console.log('open', open);
    // if (!mapboxLoaded || map.current || !open) return
    if (!window.mapboxgl || !window.mapboxgl.Map) return
    console.log('Initialize mapbox 2');

    const initializeMap = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-mapbox-token')
        const token = data?.token || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'

        window.mapboxgl.accessToken = token

        map.current = new window.mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [120.6034426961101, 18.197771187194157],
          zoom: 12,
        })

        if (window.mapboxgl.NavigationControl) {
          map.current.addControl(new window.mapboxgl.NavigationControl())
        }

        map.current.on('load', () => {
          drawRoute()
        })
      } catch (error) {
        console.error('Failed to initialize map:', error)
      }
    }

    try {
      initializeMap()
    }
    catch (error) {
      console.error('Error on Initializing Map: ', error);
    }
  }, [mapboxLoaded, open])

  const drawRoute = () => {
    if (!map.current || !session?.gps_path || session.gps_path.length === 0) return

    const coordinates = session.gps_path
      .filter((point: any) => point.latitude && point.longitude)
      .map((point: any) => [point.longitude, point.latitude])

    if (coordinates.length === 0) return

    // Add route line
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      }
    })

    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3B82F6',
        'line-width': 4
      }
    })
    // console.log(session?.users?.profile_picture_url);
    // const el = document.createElement('div');
    // el.className = 'custom-marker';
    // el.style.backgroundImage = session?.users?.profile_picture_url; // Replace with your image URL
    // el.style.width = '50px'; // Adjust size as needed
    // el.style.height = '50px'; // Adjust size as needed
    // el.style.backgroundSize = 'cover';
    // el.style.color = '#10B981'

    // Add start marker
    if (coordinates.length > 0 && window.mapboxgl.Marker) {
      new window.mapboxgl.Marker({ color: '#10B981' })
        .setLngLat(coordinates[0])
        .setPopup(new window.mapboxgl.Popup().setHTML('<div>Start</div>'))
        .addTo(map.current)
    }

    // Add end marker
    if (coordinates.length > 1 && window.mapboxgl.Marker) {
      new window.mapboxgl.Marker({ color: '#EF4444' })
        .setLngLat(coordinates[coordinates.length - 1])
        .setPopup(new window.mapboxgl.Popup().setHTML('<div>End</div>'))
        .addTo(map.current)
    }

    // Fit map to route bounds
    if (window.mapboxgl.LngLatBounds) {
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord)
      }, new window.mapboxgl.LngLatBounds(coordinates[0], coordinates[0]))

      map.current.fitBounds(bounds, { padding: 50 })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Route Path - {session?.users?.full_name}
          </DialogTitle>
        </DialogHeader>
        <div className="relative h-96">
          {mapboxLoaded ? (
            <>
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
            </>
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading Map...</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}