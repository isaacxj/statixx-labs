CREATE TABLE `businesses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`legal_name` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`logo_key` text,
	`accent` text DEFAULT '#10B981' NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`tax_rate_bp` integer DEFAULT 0 NOT NULL,
	`terms_days` integer DEFAULT 30 NOT NULL,
	`payment_instructions_md` text DEFAULT '' NOT NULL,
	`number_prefix` text NOT NULL,
	`next_number` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`company` text,
	`email` text,
	`address` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
