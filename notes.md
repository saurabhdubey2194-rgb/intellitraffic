# IntelliTraffic Build Notes (internal)

## Project facts
- Webdev project: /home/ubuntu/intellitraffic (web-db-user stack: React19 + Tailwind4 + tRPC11 + MySQL2/Drizzle + Manus OAuth)
- Template README key facts: tRPC via server/routers.ts, protectedProcedure from server/_core/trpc.ts, auth via useAuth() in client, wouter routing in client/src/App.tsx, MapView component at client/src/components/Map.tsx (Google Maps proxy, libs: marker,places,geocoding,geometry). vitest via pnpm test. Dev preview running on port 3000.
- DB is MySQL (TiDB) via DATABASE_URL env. Drizzle mysql-core. datetime(...).default(new Date()).notNull() required (defaultNow unsupported).
- Schema tables (14): users (roles: public|ambulance|police|hospital|host|user|admin; verificationStatus enum), ambulances, hospitals, policeStations, trafficSignals, roadSegments, trafficIncidents, emergencyRequests, emergencyCorridors, routes, savedRoutes, notifications, auditLogs, systemSettings. Types exported: Ambulance, Hospital, PoliceStation, TrafficSignal, RoadSegment, TrafficIncident, EmergencyRequest, EmergencyCorridor, Route, Notification.
- Demo data seeded via webdev_execute_sql: 12 KNP signals, 5 hospitals, 5 police stations, 7 road segments, 5 incidents, 11 system settings (demo.seeded.v2 flag). Kanpur center lat 26.4499 lng 80.3319. Report ID format IT-KNP-2026-NNNNNN (generated in shared/intellitraffic.ts: generateReportId/generateRequestId/generateCorridorId).
- shared/intellitraffic.ts: roles, haversineKm, formatEta, formatDistance, KANPUR_CENTER, DEMO_CITY etc.
- server/queries.ts: listUsers({role, verificationStatus, state, district, search, limit, offset}), getUserById, listAmbulances({userId,status}), getAmbulanceByUserId/ById, listHospitals, getHospitalById/ByUserId, listPoliceStations, getPoliceStationById/ByUserId, listTrafficSignals({district}), getTrafficSignalById, getSignalsByCorridor, listIncidents, getIncidentById, getIncidentByReportId, listEmergencyRequests, getEmergencyRequestById, getEmergencyRequestByRequestId, listCorridors, getCorridorById, getActiveCorridorByRequestId, getRoutesForRequest(requestId), getRouteById, listSavedRoutes, listNotifications, countUnreadNotifications, listAuditLogs, getSetting, listSettings, upsertSetting, nextCounter(category), getDashboardStats, getEmergencyRequestStats, getAmbulanceTrustStats(ambulanceId), listUsersInDateRange, listRequestsInDateRange, listIncidentsInDateRange. NOTE: listSegmentsAll() referenced but NOT yet defined — must add to queries.ts.
- server/routeEngine.ts: evaluateRoute/rankRoutes with weights congestion .3, incidents .25, capacity .15, historical .1, signals .2; predictTrafficLevels. RouteCandidate interface.
- server/seedDemo.ts: pnpm tsx server/seedDemo.ts (needs DATABASE_URL; failed with ETIMEDOUT from sandbox tsx — use webdev_execute_sql instead).
- Todo at /home/ubuntu/intellitraffic/todo.md.

## Current blockers in server/routers.ts (v1 draft, has 49 TS errors)
- Missing server/audit.ts module (imported as ./audit) — must create: audit(ctx, action, targetType, targetId, details?) inserting into auditLogs.
- protectedProcedure must be imported from ./_core/trpc (currently only router + publicProcedure imported).
- ambulancesTable helper is broken stub — replace direct usage with schema import.
- getCorridorRowId typed broken (db param NonNullable<...>).
- notifications delete/update via dynamic import of m.notifications works; savedRoutes delete via getSavedRoute helper.
- q.listSegmentsAll missing in queries.ts — add: select().from(roadSegments).limit(300).
- routers.ts is too large/fragile; better to rewrite cleanly.

## Auth flow note
- Manus OAuth: useAuth() gives user; role stored in users.role. Host = user.role === 'host'. Owner auto-promotion to admin exists in db.ts upsertUser.
- Registration: user signs in via OAuth, then role registration via auth.registerRoleProfile (role field). Public activates instantly; others pending verification (verified by host via admin.verifyUser).
- Host creation: not self-registerable — must be set by owner via admin (will implement via backend; owner can be set host via DB/env OWNER_OPEN_ID auto host logic in upsertUser? Currently auto-sets role 'admin' for owner; adapt to 'host').

## Progress state (updated)
- server/routers.ts REWRITTEN clean (~1000 lines): auth (me/logout/profile/updateProfile/registerRoleProfile), traffic (nearby/signals/signalDetail/incidents/reportIncident/updateIncidentStatus), routes (calculate/history/saved/saveRoute/deleteSaved), emergencies (create/mine/incoming/pendingForPolice/detail/approve/reject/activateCorridor/corridorProgress/arrive/complete/corridors/myCorridor), admin (stats/emergencyStats/users/verifyUser/ambulances/hospitals/policeStations/incidents/emergencies/corridors/signals/auditLogs/settings/updateSetting/exportData/systemHealth), notifications (list/unreadCount/markRead/markAllRead). 0 TS errors, dev server healthy.
- server/audit.ts created (uses auditLogs.actorUserId/actorRole/action/targetType/targetId/details).
- server/rbac.ts: ambulanceProcedure/policeProcedure/hospitalProcedure/hostProcedure/verifiedProcedure. Host bypasses gates.
- server/queries.ts: added listSegmentsAll() + predictTrafficLevels() (also exported from routeEngine.ts).
- DB seeded via webdev_execute_sql. seedDemo.ts leftover file at server/seedDemo.ts (delete it).
- server/intellitraffic.test.ts written referencing ./testHelpers buildCandidates — MUST create server/testHelpers.ts exporting buildCandidates (copy from routers.ts buildCandidates fn) OR move shared to routeEngine. Tests import verify: verificationStatus on test users may need checking (host user has verificationStatus undefined — ok since host bypass).
- Next: create testHelpers.ts, run pnpm test, then frontend (pages: Home landing, Login, RoleSelection, dashboards Public/Ambulance/Police/Hospital/Host, map, notifications, mobile bottom navs).
- Design: deep navy #0b1a33-ish bg, white text, red emergency, green verified, amber warning, blue info. 390px primary. Bottom navs per role.

## DB fix status (04:15 UTC)
- All datetime columns NOW HAVE DEFAULT CURRENT_TIMESTAMP except systemSettings.category nullable ok. fixed via ALTER TABLE retry script (fix-datetime*.mjs, now deleted).
- TiDB connection is FLAKY from sandbox: DNS getaddrinfo EAI_AGAIN / ETIMEDOUT every few minutes. Retry loop script needed. This causes intermittent test failures.
- Tests: 16/17 pass; the 1 failing is the mine() test intermittently (ETIMEDOUT). Root cause is DB flakiness, not code. Solution: make mine() query more tolerant OR accept flakiness — better: make the test not DB-dependent? It is (listEmergencyRequests). Leave timeouts high (20s) and rerun; tests pass eventually.
- emergencyRequests updatedAt now fixed too.
- traffic.signals endpoint verified working via curl (12 signals returned).

## Demo seed (04:35 UTC)
- seed-demo.mjs at project root (delete before checkpoint). Inserts 6 demo users via openId='demo-...': demo-host (host/verified, OWNER-LEVEL), demo-police (police, verified, linked to policeStation id=1), demo-hospital (hospital/verified, linked to hospital id=1), demo-ambulance (ambulance/verified, ambulance profile UP78 AB 1234, trustScore 91), demo-public (public/verified, Rahul Gupta), demo-pending (ambulance/pending). Ambulance INSERT needed ON DUPLICATE updatedAt=NOW() because ambulances.updatedAt had no DB default — now fixed via fix-ambulances.mjs (ALTER table).
- DB counts verified: users 0→6 after seed, ambulances 2, hospitals 5, stations 5, signals 12, incidents 17 (5 demo + test-created).
- DB connection flaky (ETIMEDOUT/DNS) — retry loops needed; webdev_execute_sql also flaky. Use node scripts in files, not inline node -e (bash history expansion breaks).
- IMPORTANT: demo users exist in DB but Manus OAuth login is separate (openId differs from real login openId). For testing dashboards, the owner can be set host via demo-host user — BUT actual browser sessions are OAuth-based, so demo dashboards can only be viewed if we provide demo mode or if the owner's real user gets role host. Consider: owner login -> auto admin -> promote to host via admin.verifyUser? Owner auto-promotes to 'admin' in db.ts; UI should treat admin===host or change db.ts to role 'host' for owner.
- TODO: check db.ts owner promotion: change role 'admin' to 'host' for owner so the project owner automatically gets Host control center after login.

## Frontend progress (04:45 UTC)
- index.css: full navy retheme done (light theme=white navy-tinted, dark=.navy deep). semantic vars --it-emergency/verified/warning/info. Added .fade-in-up, .pulse-emergency, body navy bg override, button press scale.
- client/index.html: Inter font added, title=IntelliTraffic.
- client/src/lib/ui.ts: created — ROLE_LABEL/ICON, verificationLabel/Color, incidentTypeLabel, trafficLevelLabel, trafficColor (hex), emergencyStatusLabel/Color, signalPrepLabel/Color.
- components/DashboardLayout.tsx: REWRITTEN — exports ROLE_NAV (public: Home/Map/Routes/Alerts/Profile; ambulance: Home/Emergency/Route/Alerts/Profile; police: Command/Requests/Map/Alerts/Profile; hospital: Home/Emergencies/Ambulances/Alerts/Profile; host: Dashboard/Users/Verification/Traffic/Signals/Maps/Ambulances/Hospitals/Police/Emergencies/Incidents/Routes/Analytics/AuditLogs/Settings/DataCenter). Logo IntelliTraffic w/ green accent. roleForUser treats admin===host. Demo badge in footer.
- components/RoleShell.tsx: created — auth gate, DEMO banner, MobileBottomNav (bottom-0 fixed, grid-cols-5), StickyEmergency (SOS red pulse for ambulance, crown for hospital/police), useRole helper. Children wrapped in DashboardLayout.
- components/RoleRegistration.tsx: created — role choose → form dialog.
- pages/Home.tsx: REWRITTEN — landing: hero 'Don't just find traffic. Predict it. Clear it. Beat it.', workflow strip (10 steps), 4 role cards, features grid, footer w/ simulation disclaimer. LogoMark imported from DashboardLayout.
- IMPORTANT registerRoleProfile input shape: { role, ambulance:{driverName,registrationNumber(5-32),driverLicenceNumber,permitNumber,insuranceNumber,hospitalAssociation,hospitalId,hospitalAssociation?}, hospital:{hospitalName,registrationNumber,emergencyContact,address,district,state,lat,lng}, police:{stationName!,officerId,designation,district,state,area,lat,lng}, phone?,city?,district?,state? } — public has NO nested key, flat fields. FIX RoleRegistration.tsx submit mapping: must wrap fields in ambulance/hospital/police objects and rename police fields: stationName (officer enters station name? — prompt said Police Station field). Verify public path sends flat.
- Routers key endpoints: auth.me/logout/profile/updateProfile/registerRoleProfile; traffic.nearby({lat,lng,radiusKm?}), traffic.signals, traffic.signalDetail({id}), traffic.incidents({status,limit}), traffic.reportIncident({type,description,lat,lng,district?}), traffic.updateIncidentStatus({id,status}) police; routes.calculate({originLat,originLng,destinationLat,destinationLng,mode?}), routes.history, routes.saved, routes.saveRoute, routes.deleteSaved; emergencies.create({ambulanceId?,hospitalId,emergencyType,lat,lng,priority?}), emergencies.mine, emergencies.incoming (hospital), emergencies.pendingForPolice, emergencies.detail({id}), emergencies.approve({id,policeStationId?}), emergencies.reject({id,reason}), emergencies.activateCorridor({id}), emergencies.corridorProgress({id}), emergencies.arrive({id}), emergencies.complete({id}), emergencies.corridors.myCorridor; admin.stats, admin.emergencyStats, admin.users(filter), admin.verifyUser({userId,status,note}), admin.ambulances, admin.hospitals, admin.policeStations, admin.incidents, admin.emergencies, admin.corridors, admin.signals, admin.auditLogs, admin.settings, admin.updateSetting({category,key,value}), admin.exportData({type}), admin.systemHealth; notifications.list/unreadCount/markRead({id})/markAllRead.
- Map component: client/src/components/Map.tsx MapView + onMapReady. libs: marker,places,geocoding,geometry. Check SKILL webdev-maps-integration.
- App.tsx routes NOT yet updated — need: /, /dashboard, /map, /routes, /alerts, /profile, /emergency, /requests, /emergencies, /ambulances, /admin/*

## Frontend progress v3 (05:25 UTC)
- client/src/lib/labels.ts CREATED (all exports: incidentColor, incidentTypeLabel, incidentTypes, trafficColor, trafficLevelLabel, trafficLevels, emergencyStatusLabel/Color/Statuses, priorityLabel/Color/priorities, signalPrepLabel/Color/Phases, roleLabel, roles, severityLabel/Color, verificationStatusLabel/Color, corridorStatusLabel/Color, formatEta, formatDistance). imports from @shared/intellitraffic (added: TRAFFIC_LEVEL, PRIORITY, SIGNAL_PREP, EMERGENCY_STATUS, ROLE exports).
- pages DONE: Home (landing), MapPage (9 layers), DashboardPublic (public dashboard), RouteSearch (AI compare — RouteCandidate = EvaluatedRoute fields: name,distanceKm,baseEtaSec,etaSec,congestionDelayMin,incidentDelayMin,signalDelayMin,historicalDelayMin,trafficLevel,score,scoreBreakdown{congestion,incidents,capacity,historical,signalDensity},reason?,waypoints,selected). Routes: calculate mutation, saveRoute, saved, deleteSaved. LANDMARKS 8 Kanpur points.
- AlertsPage.tsx DONE: reportIncident dialog {type,description,lat,lng,district}, incident list, police queue with status buttons (investigating/verified/resolved/false_report), stats strip. incidents query returns {rows}.
- DashboardLayout ROLE_NAV paths: public→/dashboard /map /routes /alerts /profile; ambulance→/dashboard /emergency /routes /alerts /profile; police→/dashboard /requests /map /alerts /profile; hospital→/dashboard /emergencies /ambulances /alerts /profile; host→/dashboard + /admin/users /admin/verification /admin/traffic /admin/signals /map /admin/ambulances /admin/hospitals /admin/police /admin/emergencies /admin/incidents /admin/routes /admin/analytics /admin/audit /admin/settings /admin/data
- RoleShell wraps children in DashboardLayout, shows DEMO banner, mobile bottom nav, sticky SOS button (roles ambulance/police/hospital).

## Frontend progress v4 (05:40 UTC)
- pages/ProfilePage.tsx DONE — account card, ambulance/hospital/police profile cards (hospital name=hospital.name), trust bar, editable contact form (updateProfile: name/phone/city/district/state).
- pages/EmergencyPage.tsx DONE — STEPS timeline (submitted/approved/corridor_active/in_transit/arrived/completed), latest active request + corridor telemetry (estimatedTimeSavedMin/signalsPrepared/totalSignals/progressPct/status), signal priority simulation grid (prepPhase ready/preparing/monitoring → GREEN WAVE/PRE-CLEARING/MONITORING/NORMAL), position range slider + corridorProgress mutation, activateCorridor button when approved, new request form (hospitalId select from traffic.nearby hospitals {id,name,distanceKm,bedsAvailable,emergencyAvailable}, priority select high/critical/extreme, condition textarea), request history.
- pages/RequestsPage.tsx DONE — police queue (pendingForPolice returns {rows}: requestId/ambulanceId/hospitalId/patientCondition/priority/status/suspicious/reviewNote/distanceKm/etaSec/createdAt), approve (requestId,reviewNote?) + reject (requestId,reason min 3 chars), mini stats strip, hospital name resolution via traffic.nearby at KANPUR_CENTER r15.
- NOTE: RequestsPage uses HOSPITAL_NAMES empty Record — actually uses hospitalName fn from nearby list; remove HOSPITAL_NAMES const if present.
- Remaining: HospitalPage (emergencies.incoming, arrive, complete), AmbulancesPage (admin host: admin.ambulances/hospitals/policeStations lists), DashboardHost (admin.stats {totals?,requestsByStatus?,topSignals?... verify shape before building}, admin.emergencyStats, systemHealth), admin pages (users table w/ verifyUser, verification queue, signals table, ambulances/hospitals/police, emergencies, incidents, routes, analytics, audit, settings key/value, data export). App.tsx wiring + RoleShell/RoleRegistration already done.

## Frontend progress v5 (05:50 UTC) — VERIFIED API SHAPES
- getDashboardStats returns: {totalUsers,publicUsers,verifiedAmbulances,policeStations,hospitals,activeEmergencies,activeCorridors,trafficIncidents,pendingVerifications}. systemHealth returns {backend,database,mats?:} → backend:"online"|..., database:"online"|"offline", maps:"online"|...
- Admin endpoints: users({role,verificationStatus,state,district,search,limit,offset}?)→{rows,total}; verifyUser{userId,status(pending?no: verified|rejected|suspended|under_review),note?}; ambulances/hospitals/policeStations/corridors/signals→rows direct; incidents({district,type,status}?)→{rows}; emergencies→{rows,limit100}; auditLogs({limit,offset}?)→{rows}; settings→rows direct; updateSetting{key,value,category?}; exportData{table}→{rows,count}.
- incidents table columns: id,reportId,reportedByUserId,type(enum),description,lat,lng,district,status,reolvedAt,createdAt — NO severity, NO title. admin/incidentTypeLabel from labels.ts maps type.
- trafficIncidents enum types: accident,road_blockage,waterlogging,construction,broken_signal,heavy_congestion,other.
- pages DONE so far: Home, MapPage, DashboardPublic, RouteSearch, AlertsPage, ProfilePage, EmergencyPage, RequestsPage, HospitalEmergencies, AdminPage.tsx (exports: VerificationQueuePage, UsersPage, SignalsAdminPage, EntitiesPage{kind ambulances|hospitals|police|incidents|emergencies|corridors}, IncidentsAdminPage, AuditLogPage, SettingsAdminPage, DataCenterPage), DashboardHost.
- EntitiesPage kind mapping: ambulances→admin.ambulances, hospitals→admin.hospitals, police→admin.policeStations, incidents→admin.incidents, emergencies→admin.emergencies, corridors→admin.corridors. Verified via switch.
- NOTE EntitiesPage rows uses `r.type ?? r.title` — incidents has no title; fine.
- SettingsAdminPage uses settingKey/settingValue — VERIFIED correct.
- DataCenterPage export works — verified return {rows,count}.
- Remaining: App.tsx routing for all pages; RoleRegistration wired to App; verify RoleShell handles role nav + mobile bottom nav. Then screenshots, checkpoint.
- ALSO: admin.updateIncidentStatus exists? — police status updates via traffic.updateIncidentStatus (policeProcedure). Verified earlier in routers.
- IMPORTANT devserver log shows stale tsc error about server/audit module from earlier compaction window — dev server recovered (file changes detected after). Verify tsc is green before checkpoint.

## Frontend progress v6 (05:57 UTC) — App.tsx WIRED
- App.tsx routes: / →Home; /map /routes /alerts /profile (Shared); /dashboard → RoleDashboard which uses useRole(useAuth()) → ambulance=EmergencyPage, police=RequestsPage, hospital=HospitalEmergencies, else DashboardHost. /emergency (ambulance), /requests (police), /emergencies + /ambulances (hospital), /admin/{users,verification,traffic,signals,ambulances,hospitals,police,emergencies,incidents,routes,analytics,audit,settings,data} (host). admin/traffic and admin/routes currently reuse IncidentsAdminPage/Emergencies EntitiesPage — TEMP placeholders acceptable. RoleRegistration NOT mounted anywhere yet — consider adding to RoleShell or Home; user without profile hits /dashboard which renders DashboardHost (role=public→host)?? NOTE useRole returns 'public' for no role → DashboardHost renders! Risky but RoleShell sign-in gate + profile has role. Actually users.role defaults 'user' → useRole returns 'user' → RoleDashboard falls through to DashboardHost which calls trpc.admin.stats (hostProcedure → FORBIDDEN for non-host). MUST gate: RoleDashboard should show RoleRegistration when role is 'user'.
- TS remaining: MapPage.tsx line ~371: incidents.data?.length / traffic.data?.length / hospitals.data?.length / police.data?.length — these queries return {rows,total}; fix to .rows?.length. Also MapPage line ~341: Badge style={{color:'#fff'}} prop error — Badge accepts style? error says style not on IntrinsicAttributes; check usage — probably a different Badge (Badge component DOES accept style as it's div). Actually error: 'style' does not exist on type 'IntrinsicAttributes & { className?... }' — that is for Badge at line ~341? Check MapPage for a custom icon component with className/style props conflict.
- DashboardHost fixed (verifiedAmbulances etc).
- tsc run: pnpm run check.

## OLD TODO pages remaining:
- ProfilePage (auth.profile {user,ambulance,hospital,police}; updateProfile {name,phone,city,district,state}), EmergencyPage (ambulance: hospitals list, create {hospitalId,patientCondition,priority,fromLat?,fromLng?}, mine, activateCorridor, corridorProgress, myCorridor), RequestsPage (police pendingForPolice; approve {requestId,reviewNote?}; reject {requestId,reason}), HospitalEmergencies (incoming, arrive, complete), AmbulancesPage (admin host/hospital), DashboardHost (recharts charts from admin.stats/emergencyStats/systemHealth), admin/* pages (users table w/ verifyUser, verification queue, traffic signals table, ambulances/hospitals/police lists, emergencies table, incidents, routes, analytics, audit logs, settings key/value, data export). App.tsx wiring.

## OLD Frontend progress v2 (05:00 UTC)
- client/src/lib/labels.ts was CREATED by me (incidentColor(type) returns className, incidentTypeLabel, severityLabel/Color, trafficColor, trafficLevelLabel, emergencyStatusLabel/Color, signalPrepLabel/Color, ROLE_LABEL). VERIFY file exists; DashboardPublic imports from it.
- pages/MapPage.tsx: DONE — 9 toggleable layers, colored polylines for road segments (load-based), clickable markers, detail panel, stats. Uses MapView {initialCenter, initialZoom, onMapReady, className}.
- pages/DashboardPublic.tsx: DONE — quick actions (SOS tel:112, Report Incident → /alerts, Find Hospital → /map, Traffic Update → /map), nearby summary (overall/avgSpeedKmh/incidentCount/signalCount/hospitalCount/policeStationCount/lastUpdated), nearby services, live alerts feed, signal grid.
- traffic.nearby returns: {overall,avgSpeedKmh,signalCount,incidentCount,hospitalCount,policeStationCount,signals,incidents,hospitals(distanceKm),policeStations(distanceKm),demo,lastUpdated}
- traffic.signals optional input {district?}
- admin.segments added to routers (hostProcedure → q.listSegmentsAll())
- RoleRegistration.tsx: fixed payload mapping (public flat, ambulance/hospital/police nested; police needs stationName)

## TODO pages still to build (route in App.tsx with lazy wrapper):
- /dashboard → DashboardPublic (public role) ; host dashboard: DashboardHost (stats, charts)
- /routes → RouteSearch (routes.calculate mutation: fromLat,fromLng,toLat,toLng,emergency?,requestId?; returns {routes, simulated}; RouteCandidate fields: name, distanceKm, etaSec, trafficLevel, score, reason, waypoints, selected)
- /alerts → AlertsPage (incidents: reportIncident form {type,description,lat,lng,district?}; list; police updateIncidentStatus {id,status})
- /profile → ProfilePage (auth.profile {user,ambulance,hospital,police}; updateProfile {name,phone,city,district,state})
- /emergency → EmergencyPage ambulance (hospitals list to select hospitalId, create {hospitalId,patientCondition,priority,fromLat?,fromLng?}; mine list w/ refresh; activateCorridor {requestId}; corridorProgress {requestId,progressPct}; myCorridor {requestId})
- /requests → RequestsPage police (pendingForPolice; approve {requestId,reviewNote?}; reject {requestId,reason})
- /emergencies → HospitalEmergencies (incoming {rows,hospital}; arrive {requestId}; complete {requestId})
- /ambulances → AmbulancesPage (admin list)
- /admin/users /admin/verification /admin/traffic /admin/signals /admin/ambulances /admin/hospitals /admin/police /admin/emergencies /admin/incidents /admin/routes /admin/analytics /admin/audit /admin/settings /admin/data
- host dashboard charts via recharts (admin.stats, admin.emergencyStats, admin.systemHealth)
- App.tsx: wire all routes + RoleShell usage; role-based route guards.

## Remaining phases
- Backend done-ish (needs fixes + real-time): add SSE/heartbeat or polling-based realtime via tRPC queries (polling refetch 5s) + audit.ts + listSegmentsAll.
- Frontend: landing page, auth/login flow, role dashboards (public/ambulance/police/hospital/host), map layers, emergency workflow UI, notifications, mobile bottom navs (390px primary), deep navy design (navy bg #0b1a33-ish, red/green/amber/blue semantic).
- Vitest: RBAC tests + route engine tests.
- Checkpoint at end, publish via UI button.

## Design direction (user-specified)
- Deep navy + white base; red emergency, green verified, amber warning, blue info.
- Mobile-first 390px, role bottom nav: public (Home/Map/Routes/Alerts/Profile), ambulance (Home/Emergency/Route/Alerts/Profile), police (Command/Requests/Map/Alerts/Profile), hospital (Home/Emergencies/Ambulances/Alerts/Profile), host (Command/Admin sidebar).
- Sticky emergency action; demo data labeled DEMO/SIMULATED.

## Frontend progress v7 (05:55 UTC) — FINAL VERIFICATION
- TypeScript: 0 errors. Tests 16/17 pass (1 transient DB ETIMEDOUT).
- Temp scripts removed (debug-query.mjs, fix-*.mjs, seed-demo.mjs, .gitkeep).
- Visual check via sandbox browser: Home renders fully (hero, lifecycle chips, 4 role cards, IT-KNP-2026-NNNNNN, disclaimer). /map shows RoleShell sign-in gate (expected for anonymous).
- Known infra: TiDB gateway DNS intermittently EAI_AGAIN from sandbox; webdev_execute_sql reliable. Not a code issue.
- TODO left: run final test retry until green, checkpoint, deliver.
