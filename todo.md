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

## Scope round 2 — Delhi NCR rebrand + History & Activity System (user request Aug 14)

- [x] Add activity_logs, ambulance_documents, signal_events tables + migration
- [x] Create logActivity() utility and instrument all routers (auth, routes, incidents, ambulances, verifications, corridors, arrivals, signals, admin actions)
- [x] History endpoints: role-scoped mine, admin global w/ filters/search/stats/chart data/export
- [x] Rebrand Kanpur → Delhi NCR: shared constants (DLH), Home/RouteSearch landmarks, MapPage, Admin DataCenter, RoleRegistration, AlertsPage, DashboardPublic, RequestsPage coords
- [x] Landing page upgrade: new hero tagline/buttons, Problem/Solution/How/FAQ sections, Delhi NCR focus
- [x] Ambulance multi-step registration with document upload (ambulance_documents, S3 storage, preview)
- [x] Police ambulance verification queue w/ VIEW DOCUMENTS + approve/reject confirm dialog
- [x] Police green corridor page w/ ACTIVATE + signal phase animation (NORMAL→PRE-CLEARING→GREEN→AMBULANCE PASSING→NORMAL)
- [x] Signals simulation page (/signals) w/ cycle/phase/recommended duration widget
- [x] Live traffic page w/ auto-refresh + "LIVE PROTOTYPE DATA" label
- [x] History pages: global + user/ambulance/police/hospital + emergency-history + green-corridor-history + signals/history
- [x] Admin activity center: filters (role/activity/status/location/date), search, timeline, detail drawer, charts, CSV/JSON export
- [x] Admin dashboard live activity feed + demo controls (Reset Demo Data, Generate Traffic/Ambulance/Accident, Simulate Emergency/Signal, DEMO MODE)
- [x] Seed Delhi NCR demo data incl. 100+ activity records, trips, corridors, signal events
- [x] Notification ↔ history integration, impact dashboard "Estimated / Simulation Metrics"
- [x] Update vitest suite for new activity log logic, run all tests
- [x] Visual verification + final checkpoint (dark theme, admin RBAC, map 5/5 counts, signals admin simulation widget, 17/17 tests, removed temp seed script)
- [x] Fix: dark theme restored globally (ThemeProvider defaultTheme=dark)
- [x] Fix: admin role now passes hostProcedure gates (useRole maps admin→host)
- [x] Fix: map hospital/station counts (5/5) after role gate fix
- [x] Fix /admin/ambulances crash: "TypeError: rows.slice is not a function" in EntitiesPage — normalized {rows,total} shaped ambulance data and flattened {user,ambulance} joined rows (user bug report Aug 14)
