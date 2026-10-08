CREATE TABLE `proposals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` integer NOT NULL,
	`client_id` integer NOT NULL,
	`number` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`valid_until` text,
	`discount_bp` integer DEFAULT 0 NOT NULL,
	`tax_rate_bp` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`share_token` text,
	`sent_at` text,
	`first_viewed_at` text,
	`view_count` integer DEFAULT 0 NOT NULL,
	`accepted_at` text,
	`accepted_by_name` text,
	`accepted_ip` text,
	`declined_at` text,
	`decline_reason` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `proposals_number_unique` ON `proposals` (`number`);