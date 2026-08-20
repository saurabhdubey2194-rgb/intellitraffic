ALTER TABLE `activity_logs` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `ambulance_documents` MODIFY COLUMN `ambulanceId` int;--> statement-breakpoint
ALTER TABLE `ambulance_documents` MODIFY COLUMN `docType` enum('rc','ambulance_permit','driver_license','insurance','hospital_authorization','hospital_license','hospital_registration','police_id_card','police_authorization') NOT NULL;--> statement-breakpoint
ALTER TABLE `ambulance_documents` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `ambulance_documents` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `ambulances` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `ambulances` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `auditLogs` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `emergencyCorridors` MODIFY COLUMN `activatedAt` datetime DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `emergencyRequests` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `emergencyRequests` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `hospitals` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `hospitals` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `policeStations` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `policeStations` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `roadSegments` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `routes` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `savedRoutes` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `signal_events` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.156';--> statement-breakpoint
ALTER TABLE `systemSettings` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `trafficIncidents` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `trafficSignals` MODIFY COLUMN `lastUpdated` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `trafficSignals` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.155';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.154';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.154';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` datetime NOT NULL DEFAULT '2026-08-20 03:49:40.154';--> statement-breakpoint
ALTER TABLE `ambulance_documents` ADD `entityType` enum('AMBULANCE','HOSPITAL','POLICE','USER') DEFAULT 'AMBULANCE' NOT NULL;--> statement-breakpoint
ALTER TABLE `ambulance_documents` ADD `entityId` varchar(64);