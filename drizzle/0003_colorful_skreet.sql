CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` varchar(32) NOT NULL,
	`userId` int,
	`userRole` varchar(32),
	`userName` varchar(200),
	`userEmail` varchar(320),
	`actionType` varchar(128) NOT NULL,
	`actionDescription` text NOT NULL,
	`entityType` varchar(64),
	`entityId` varchar(64),
	`status` varchar(64) DEFAULT 'SUCCESS',
	`ipAddress` varchar(64),
	`deviceType` varchar(64),
	`location` varchar(200),
	`metadata` text,
	`createdAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.695',
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`),
	CONSTRAINT `activity_logs_activityId_unique` UNIQUE(`activityId`)
);
--> statement-breakpoint
CREATE TABLE `ambulance_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ambulanceId` int NOT NULL,
	`docType` enum('rc','ambulance_permit','driver_license','insurance','hospital_authorization') NOT NULL,
	`fileName` varchar(300) NOT NULL,
	`mimeType` varchar(128),
	`sizeBytes` int,
	`storageKey` varchar(300),
	`url` text,
	`status` enum('pending_review','verified','rejected') DEFAULT 'pending_review',
	`note` text,
	`createdAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.695',
	`updatedAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.695',
	CONSTRAINT `ambulance_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signal_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`signalId` int NOT NULL,
	`corridorId` int,
	`requestId` varchar(32),
	`phase` varchar(64) NOT NULL,
	`previousPhase` varchar(64),
	`normalDurationSec` int DEFAULT 60,
	`optimizedDurationSec` int,
	`reason` varchar(200),
	`corridorEvent` boolean DEFAULT false,
	`createdAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.695',
	CONSTRAINT `signal_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ambulances` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.694';--> statement-breakpoint
ALTER TABLE `ambulances` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.694';--> statement-breakpoint
ALTER TABLE `auditLogs` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.694';--> statement-breakpoint
ALTER TABLE `emergencyCorridors` MODIFY COLUMN `activatedAt` datetime DEFAULT '2026-08-14 03:43:21.694';--> statement-breakpoint
ALTER TABLE `emergencyRequests` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.694';--> statement-breakpoint
ALTER TABLE `emergencyRequests` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.694';--> statement-breakpoint
ALTER TABLE `hospitals` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.694';--> statement-breakpoint
ALTER TABLE `hospitals` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.694';--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.694';--> statement-breakpoint
ALTER TABLE `policeStations` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.694';--> statement-breakpoint
ALTER TABLE `policeStations` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.694';--> statement-breakpoint
ALTER TABLE `roadSegments` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.694';--> statement-breakpoint
ALTER TABLE `routes` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.694';--> statement-breakpoint
ALTER TABLE `savedRoutes` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.694';--> statement-breakpoint
ALTER TABLE `systemSettings` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.695';--> statement-breakpoint
ALTER TABLE `trafficIncidents` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.694';--> statement-breakpoint
ALTER TABLE `trafficSignals` MODIFY COLUMN `lastUpdated` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.694';--> statement-breakpoint
ALTER TABLE `trafficSignals` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.694';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.693';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updatedAt` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.693';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` datetime NOT NULL DEFAULT '2026-08-14 03:43:21.693';