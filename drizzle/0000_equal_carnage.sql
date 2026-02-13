CREATE TABLE `chats` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`type` text,
	`last_synced_at` integer,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`content` text,
	`type` text,
	`media_url` text,
	`status` text DEFAULT 'synced',
	`created_at` integer NOT NULL,
	`updated_at` integer
);
