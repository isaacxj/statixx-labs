CREATE TABLE `retainers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`client_id` integer NOT NULL,
	`title` text NOT NULL,
	`cadence` text DEFAULT 'monthly' NOT NULL,
	`anchor_day` integer NOT NULL,
	`starts_on` text NOT NULL,
	`ends_on` text,
	`next_run_on` text,
	`active` integer DEFAULT true NOT NULL,
	`items_json` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
