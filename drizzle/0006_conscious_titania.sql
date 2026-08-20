CREATE TABLE `user_passwords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`openId` varchar(64) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.940',
	`updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.940',
	CONSTRAINT `user_passwords_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_passwords_email_unique` UNIQUE(`email`),
	CONSTRAINT `user_passwords_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `activity_logs` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.940';--> statement-breakpoint
ALTER TABLE `ambulance_documents` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.940';--> statement-breakpoint
ALTER TABLE `ambulance_documents` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.940';--> statement-breakpoint
ALTER TABLE `ambulances` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.939';--> statement-breakpoint
ALTER TABLE `ambulances` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.939';--> statement-breakpoint
ALTER TABLE `auditLogs` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.940';--> statement-breakpoint
ALTER TABLE `emergencyCorridors` MODIFY COLUMN `activatedAt` datetime DEFAULT '2026-08-20 03:55:03.939';--> statement-breakpoint
ALTER TABLE `emergencyRequests` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.939';--> statement-breakpoint
ALTER TABLE `emergencyRequests` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.939';--> statement-breakpoint
ALTER TABLE `hospitals` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.939';--> statement-breakpoint
ALTER TABLE `hospitals` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.939';--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.940';--> statement-breakpoint
ALTER TABLE `policeStations` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.939';--> statement-breakpoint
ALTER TABLE `policeStations` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.939';--> statement-breakpoint
ALTER TABLE `roadSegments` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.939';--> statement-breakpoint
ALTER TABLE `routes` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.940';--> statement-breakpoint
ALTER TABLE `savedRoutes` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.940';--> statement-breakpoint
ALTER TABLE `signal_events` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.940';--> statement-breakpoint
ALTER TABLE `systemSettings` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.940';--> statement-breakpoint
ALTER TABLE `trafficIncidents` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.939';--> statement-breakpoint
ALTER TABLE `trafficSignals` MODIFY COLUMN `lastUpdated` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.939';--> statement-breakpoint
ALTER TABLE `trafficSignals` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.939';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.938';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.938';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` datetime NOT NULL DEFAULT '2026-08-20 03:55:03.938';