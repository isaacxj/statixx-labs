CREATE TABLE `line_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`section_id` integer NOT NULL,
	`position` integer NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`qty_milli` integer DEFAULT 1000 NOT NULL,
	`unit_price_cents` integer DEFAULT 0 NOT NULL,
	`recurring` text DEFAULT 'none' NOT NULL,
	`optional` integer DEFAULT false NOT NULL,
	`selected` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE cascade
);
