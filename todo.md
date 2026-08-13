# IntelliTraffic — Project TODO

## Foundation
- [x] Define database schema (users, roles, ambulances, hospitals, police stations, signals, incidents, corridors, routes, notifications, audit logs, system settings)
- [x] Apply migrations to database
- [x] Zod input validation on all endpoints

## Auth & RBAC
- [x] Registration with 5 role types: public, ambulance, police, hospital, host
- [x] Role-specific dashboards with backend RBAC enforcement (FORBIDDEN for unauthorized)
- [x] Account verification workflow (pending/under_review/verified/rejected/suspended) with host verification
- [x] Host admin role (created via backend config, never self-registerable)

## Map & Location
- [x] Interactive Google Maps integration (with fallback) — Kanpur demo city
- [x] Toggleable map layers: traffic, signals, accidents, road closures, hospitals, police stations, emergency corridors, construction, waterlogging
- [x] Location permission request + "use my location" flow
- [x] Location selector (state/district/city/area)

## Public Features
- [x] Public dashboard: live/simulated nearby traffic, avg speed, delay, nearby signals/hospitals/police
- [x] Signal detail panels (density, queue, status, clearance)
- [x] Public route search with multi-route comparison (distance/ETA/traffic) + AI recommendation weighing congestion, incidents, capacity, historical data, signal density
- [x] Incident reporting (accident, waterlogging, construction, blocked road, broken signal, congestion, other) with GPS capture
- [x] Report IDs in format IT-KNP-2026-NNNNNN
- [x] Nearby hospitals/police stations listings with distance/ETA

## Emergency Workflow
- [x] Ambulance emergency request submission
- [x] Police verification & approval flow
- [x] AI route selection for emergency (fastest ETA, scored)
- [x] Predictive emergency corridor activation (signals prepared ahead of ambulance)
- [x] Dynamic signal priority simulation (clearly labeled simulated)
- [x] Real-time route switching when better route detected
- [x] Hospital arrival confirmation + corridor closure
- [x] Public emergency alerts to nearby users (no patient details exposed)

## Role Dashboards
- [x] Public dashboard + mobile bottom nav (Home/Map/Routes/Alerts/Profile)
- [x] Ambulance dashboard: my requests, verification status, live corridor status, mobile nav
- [x] Police command center: active emergencies/corridors, approve/reject requests, incident management, what-if simulation
- [x] Hospital dashboard: incoming emergencies, confirm arrival, mobile nav
- [x] Host admin center: users mgmt, verification center, signals mgmt, incidents, emergencies, routes, analytics, audit logs, data export, system health, AI/routing config, demo seed/reset
- [x] Host mobile nav (Command/Requests/Map/Alerts/Profile) and desktop sidebar

## Real-time & Data
- [x] Real-time updates without page refresh (WebSocket/SSE) for emergency lifecycle, notifications
- [x] Persistent per-user notifications (read/unread/mark all)
- [x] Host-seeded demo data (Kanpur signals, hospitals, police stations, traffic) clearly labeled DEMO/SIMULATED
- [x] User-specific data isolation (no mixed/fake history)

## Security & Quality
- [x] Backend authorization on every sensitive endpoint; role isolation in DB queries
- [x] Audit logs for host/admin actions
- [x] Vitest tests for RBAC and key flows
- [x] Landing page with USP hero, features, CTAs
