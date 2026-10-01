CREATE TABLE `student_progress` (
	`user_id` text PRIMARY KEY NOT NULL,
	`questions_answered` integer DEFAULT 0 NOT NULL,
	`correct_answers` integer DEFAULT 0 NOT NULL,
	`wrong_answers` integer DEFAULT 0 NOT NULL,
	`grade` real DEFAULT 0 NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`streak` integer DEFAULT 0 NOT NULL,
	`error_rate` real DEFAULT 0 NOT NULL,
	`monthly_json` text DEFAULT '{}' NOT NULL,
	`last_active_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
