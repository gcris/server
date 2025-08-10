# Patrol Admin Panel

A modern administrator's panel for managing patroller activities with live tracking, analytics, and user management.

## Features

- **Login System**: Secure authentication with Supabase
- **Dashboard**: Overview of key metrics and recent activity
- **Live Tracking**: Real-time patroller location monitoring (Mapbox integration ready)
- **Route History**: Track and analyze patrol routes
- **Analytics**: Comprehensive performance metrics and charts
- **User Management**: Add, edit, and manage patrollers and staff
- **Station Management**: Manage patrol stations and assignments

## Setup

1. **Supabase Configuration**:
   - Update `src/lib/supabase.ts` with your Supabase URL and API key
   - Set up the following tables in your Supabase database:
     - `patrollers` (id, name, email, status, current_location, created_at)
     - `stations` (id, name, location, manager_id, created_at)
     - `patrol_routes` (id, patroller_id, route_data, start_time, end_time, distance)

2. **Mapbox Integration** (Optional):
   - Add your Mapbox access token to enable live map functionality
   - Install mapbox-gl: `npm install mapbox-gl @types/mapbox-gl`

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Design Features

- Modern gradient design with "pop" visual effects
- Responsive layout that works on all devices
- Interactive charts and analytics
- Real-time data updates
- Intuitive navigation and user experience

## Technology Stack

- React 18 with TypeScript
- Tailwind CSS for styling
- ShadCN UI components
- Supabase for backend
- Recharts for analytics
- React Router for navigation

## Default Login

For testing purposes, you can use any email/password combination. In production, set up proper authentication in Supabase.