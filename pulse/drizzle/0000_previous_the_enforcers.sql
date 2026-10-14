CREATE TABLE `checks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`monitor_id` integer NOT NULL,
	`at` text NOT NULL,
	`ok` integer NOT NULL,
	`status_code` integer,
	`latency_ms` integer,
	`error` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`monitor_id`) REFERENCES `monitors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `monitors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`client` text DEFAULT '' NOT NULL,
	`url` text NOT NULL,
	`method` text DEFAULT 'GET' NOT NULL,
	`interval_sec` integer DEFAULT 300 NOT NULL,
	`timeout_ms` integer DEFAULT 10000 NOT NULL,
	`expected_status` integer DEFAULT 200 NOT NULL,
	`keyword` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`consecutive_failures` integer DEFAULT 0 NOT NULL,
	`last_checked_at` text,
	`next_check_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
