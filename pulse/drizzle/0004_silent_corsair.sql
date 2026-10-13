CREATE TABLE `status_page_monitors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`status_page_id` integer NOT NULL,
	`monitor_id` integer NOT NULL,
	`display_name` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`status_page_id`) REFERENCES `status_pages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`monitor_id`) REFERENCES `monitors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `status_page_monitors_page_monitor` ON `status_page_monitors` (`status_page_id`,`monitor_id`);--> statement-breakpoint
CREATE TABLE `status_pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`accent` text DEFAULT '#f43f5e' NOT NULL,
	`logo_key` text,
	`intro_md` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `status_pages_slug_unique` ON `status_pages` (`slug`);