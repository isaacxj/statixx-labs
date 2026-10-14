CREATE TABLE `incident_updates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`incident_id` integer NOT NULL,
	`status` text NOT NULL,
	`body_md` text NOT NULL,
	`at` text DEFAULT (datetime('now')) NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON UPDATE no action ON DELETE no action
);
