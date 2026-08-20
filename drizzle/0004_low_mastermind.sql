ALTER TABLE `activity_logs` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.741';--> statement-breakpoint
ALTER TABLE `ambulance_documents` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.741';--> statement-breakpoint
ALTER TABLE `ambulance_documents` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.741';--> statement-breakpoint
ALTER TABLE `ambulances` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.740';--> statement-breakpoint
ALTER TABLE `ambulances` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.740';--> statement-breakpoint
ALTER TABLE `auditLogs` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.741';--> statement-breakpoint
ALTER TABLE `emergencyCorridors` MODIFY COLUMN `activatedAt` datetime DEFAULT '2026-08-20 03:49:11.741';--> statement-breakpoint
ALTER TABLE `emergencyRequests` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.741';--> statement-breakpoint
ALTER TABLE `emergencyRequests` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.741';--> statement-breakpoint
ALTER TABLE `hospitals` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.740';--> statement-breakpoint
ALTER TABLE `hospitals` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.740';--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.741';--> statement-breakpoint
ALTER TABLE `policeStations` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.741';--> statement-breakpoint
ALTER TABLE `policeStations` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.741';--> statement-breakpoint
ALTER TABLE `roadSegments` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.741';--> statement-breakpoint
ALTER TABLE `routes` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.741';--> statement-breakpoint
ALTER TABLE `savedRoutes` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.741';--> statement-breakpoint
ALTER TABLE `signal_events` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.741';--> statement-breakpoint
ALTER TABLE `systemSettings` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.741';--> statement-breakpoint
ALTER TABLE `trafficIncidents` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.741';--> statement-breakpoint
ALTER TABLE `trafficSignals` MODIFY COLUMN `lastUpdated` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.741';--> statement-breakpoint
ALTER TABLE `trafficSignals` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.741';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.740';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.740';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` datetime NOT NULL DEFAULT '2026-08-20 03:49:11.740';--> statement-breakpoint
ALTER TABLE `ambulances` ADD `ambulanceType` varchar(64);--> statement-breakpoint
ALTER TABLE `hospitals` ADD `contactName` varchar(200);--> statement-breakpoint
ALTER TABLE `hospitals` ADD `contactNumber` varchar(32);--> statement-breakpoint
ALTER TABLE `policeStations` ADD `officerName` varchar(200);