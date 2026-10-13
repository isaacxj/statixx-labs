CREATE TABLE `alert_recipients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `alert_recipients_email_unique` ON `alert_recipients` (`email`);--> statement-breakpoint
ALTER TABLE `incidents` ADD `down_alerted_at` text;--> statement-breakpoint
ALTER TABLE `incidents` ADD `recovered_alerted_at` text;