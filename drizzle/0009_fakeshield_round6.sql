CREATE TABLE `fs_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`type` enum('info','success','warning','error') NOT NULL DEFAULT 'info',
	`read` boolean NOT NULL DEFAULT false,
	`link` text,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `fs_notifications_id` PRIMARY KEY(`id`)
);

CREATE TABLE `fs_threat_indicators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mediaId` int NOT NULL,
	`source` varchar(128) NOT NULL,
	`indicatorType` varchar(128) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`details` text,
	`createdAt` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `fs_threat_indicators_id` PRIMARY KEY(`id`)
);

CREATE TABLE `fs_api_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`endpoint` varchar(255) NOT NULL,
	`method` varchar(10) NOT NULL,
	`statusCode` int,
	`responseTime` int,
	`ipAddress` varchar(64),
	`createdAt` datetime NOT NULL DEFAULT (now()),
	CONSTRAINT `fs_api_usage_id` PRIMARY KEY(`id`)
);
