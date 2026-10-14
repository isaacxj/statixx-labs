CREATE TABLE `rollups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`monitor_id` integer NOT NULL,
	`hour` text NOT NULL,
	`checks` integer NOT NULL,
	`failures` integer NOT NULL,
	`avg_latency_ms` integer,
	`max_latency_ms` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`monitor_id`) REFERENCES `monitors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rollups_monitor_hour` ON `rollups` (`monitor_id`,`hour`);