CREATE TABLE `businesses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`legal_name` text,
	`address` text,
	`logo_key` text,
	`accent` text DEFAULT '#8B5CF6' NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`tax_rate_bp` integer DEFAULT 0 NOT NULL,
	`default_terms_md` text DEFAULT '' NOT NULL,
	`number_prefix` text NOT NULL,
	`next_number` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`company` text,
	`email` text,
	`phone` text,
	`address` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
