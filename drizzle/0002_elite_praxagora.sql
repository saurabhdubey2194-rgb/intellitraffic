ALTER TABLE `users` DROP INDEX `users_role_idx`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_verification_idx`;--> statement-breakpoint
ALTER TABLE `ambulances` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.015';--> statement-breakpoint
ALTER TABLE `ambulances` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.015';--> statement-breakpoint
ALTER TABLE `auditLogs` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.015';--> statement-breakpoint
ALTER TABLE `emergencyCorridors` MODIFY COLUMN `activatedAt` datetime DEFAULT '2026-08-13 03:38:10.015';--> statement-breakpoint
ALTER TABLE `emergencyRequests` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.015';--> statement-breakpoint
ALTER TABLE `emergencyRequests` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.015';--> statement-breakpoint
ALTER TABLE `hospitals` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.015';--> statement-breakpoint
ALTER TABLE `hospitals` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.015';--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.015';--> statement-breakpoint
ALTER TABLE `policeStations` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.015';--> statement-breakpoint
ALTER TABLE `policeStations` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.015';--> statement-breakpoint
ALTER TABLE `roadSegments` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.015';--> statement-breakpoint
ALTER TABLE `routes` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.015';--> statement-breakpoint
ALTER TABLE `savedRoutes` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.015';--> statement-breakpoint
ALTER TABLE `systemSettings` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.015';--> statement-breakpoint
ALTER TABLE `trafficIncidents` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.015';--> statement-breakpoint
ALTER TABLE `trafficSignals` MODIFY COLUMN `lastUpdated` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.015';--> statement-breakpoint
ALTER TABLE `trafficSignals` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.015';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.014';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.014';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` datetime NOT NULL DEFAULT '2026-08-13 03:38:10.014';