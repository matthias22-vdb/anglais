CREATE TABLE `class_memberships` (
	`user_id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`joined_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`class_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_class_memberships_class_id` ON `class_memberships` (`class_id`);--> statement-breakpoint
CREATE TABLE `classes` (
	`class_id` text PRIMARY KEY NOT NULL,
	`teacher_user_id` text NOT NULL,
	`name` text NOT NULL,
	`join_code` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_classes_teacher_user_id` ON `classes` (`teacher_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_classes_join_code` ON `classes` (`join_code`);