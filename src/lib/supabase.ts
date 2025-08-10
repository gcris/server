import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hybueojodmoqtqjcwmun.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5YnVlb2pvZG1vcXRxamN3bXVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNDA5ODIsImV4cCI6MjA2ODkxNjk4Mn0.YuV2UJCVn-N8TOGlXimmQa3xXzrDTHckf0v-AzKnZF0'

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      patrollers: {
        Row: {
          id: string
          name: string
          email: string
          status: 'active' | 'inactive' | 'on_patrol'
          current_location: any
          created_at: string
        }
        Insert: {
          name: string
          email: string
          status?: 'active' | 'inactive' | 'on_patrol'
          current_location?: any
        }
      }
      stations: {
        Row: {
          id: string
          name: string
          location: any
          manager_id: string
          created_at: string
        }
      }
      patrol_routes: {
        Row: {
          id: string
          patroller_id: string
          route_data: any
          start_time: string
          end_time: string | null
          distance: number
        }
      }
    }
  }
}