CREATE TABLE `fs_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','investigator','admin') NOT NULL DEFAULT 'user',
	`verificationStatus` enum('pending','verified','rejected','suspended') NOT NULL DEFAULT 'pending',
	`createdAt` datetime NOT NULL DEFAULT (now()),
	`updatedAt` datetime NOT NULL DEFAULT (now()),
	`lastSignedIn` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `fs_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `fs_users_openId_unique` UNIQUE(`openId`),
	CONSTRAINT `fs_users_email_unique` UNIQUE(`email`)
);

CREATE TABLE `fs_user_passwords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`passwordHash` text NOT NULL,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	`updatedAt` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `fs_user_passwords_id` PRIMARY KEY(`id`),
	CONSTRAINT `fs_user_passwords_userId_unique` UNIQUE(`userId`)
);

CREATE TABLE `fs_media_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`originalName` varchar(300) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`size` int NOT NULL,
	`storageKey` varchar(300) NOT NULL,
	`url` text NOT NULL,
	`sha256Hash` varchar(64),
	`type` enum('image','video','audio','text') NOT NULL,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `fs_media_files_id` PRIMARY KEY(`id`)
);

CREATE TABLE `fs_analysis_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mediaId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('queued','preprocessing','analyzing','generating_report','completed','failed') NOT NULL DEFAULT 'queued',
	`progress` int DEFAULT 0,
	`errorMessage` text,
	`startedAt` datetime,
	`completedAt` datetime,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `fs_analysis_jobs_id` PRIMARY KEY(`id`)
);

CREATE TABLE `fs_analysis_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`mediaId` int NOT NULL,
	`authenticityScore` float NOT NULL,
	`manipulationProbability` float NOT NULL,
	`riskLevel` enum('low','moderate','high','critical') NOT NULL,
	`confidence` float NOT NULL,
	`modelVersion` varchar(64),
	`summary` text,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `fs_analysis_results_id` PRIMARY KEY(`id`)
);

CREATE TABLE `fs_analysis_signals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resultId` int NOT NULL,
	`type` varchar(128) NOT NULL,
	`score` float NOT NULL,
	`description` text,
	`evidenceLocation` text,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `fs_analysis_signals_id` PRIMARY KEY(`id`)
);

CREATE TABLE `fs_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`status` enum('open','closed','archived') NOT NULL DEFAULT 'open',
	`createdAt` datetime NOT NULL DEFAULT (now()),
	`updatedAt` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `fs_cases_id` PRIMARY KEY(`id`)
);

CREATE TABLE `fs_case_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`mediaId` int NOT NULL,
	`notes` text,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `fs_case_evidence_id` PRIMARY KEY(`id`)
);

CREATE TABLE `fs_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(200) NOT NULL,
	`resourceType` varchar(64),
	`resourceId` varchar(64),
	`ipAddress` varchar(64),
	`metadata` text,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `fs_audit_logs_id` PRIMARY KEY(`id`)
);

CREATE TABLE `fs_abuse_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`resultId` int NOT NULL,
	`reason` text NOT NULL,
	`status` enum('pending','reviewed','resolved') NOT NULL DEFAULT 'pending',
	`createdAt` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `fs_abuse_reports_id` PRIMARY KEY(`id`)
);
