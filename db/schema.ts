import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["student", "teacher", "admin"] }).notNull().default("student"),
  username: text("username"),
  passwordHash: text("password_hash"),
  passwordSalt: text("password_salt"),
  passwordIterations: integer("password_iterations").notNull().default(0),
  mustChangePassword: integer("must_change_password", { mode: "boolean" }).notNull().default(false),
  failedLoginCount: integer("failed_login_count").notNull().default(0),
  lockedUntil: text("locked_until"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("idx_users_username").on(table.username),
]);

export const sessions = sqliteTable("sessions", {
  sessionHash: text("session_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => users.userId),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_sessions_user_id").on(table.userId),
  index("idx_sessions_expires_at").on(table.expiresAt),
]);

export const studentProgress = sqliteTable("student_progress", {
  userId: text("user_id").primaryKey().references(() => users.userId),
  questionsAnswered: integer("questions_answered").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  wrongAnswers: integer("wrong_answers").notNull().default(0),
  grade: real("grade").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  errorRate: real("error_rate").notNull().default(0),
  monthlyJson: text("monthly_json").notNull().default("{}"),
  stateJson: text("state_json").notNull().default("{}"),
  lastActiveAt: text("last_active_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const classes = sqliteTable("classes", {
  classId: text("class_id").primaryKey(),
  teacherUserId: text("teacher_user_id").notNull(),
  name: text("name").notNull(),
  joinCode: text("join_code").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_classes_teacher_user_id").on(table.teacherUserId),
  uniqueIndex("idx_classes_join_code").on(table.joinCode),
]);

export const classMemberships = sqliteTable("class_memberships", {
  userId: text("user_id").primaryKey().references(() => users.userId),
  classId: text("class_id").notNull().references(() => classes.classId),
  joinedAt: text("joined_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_class_memberships_class_id").on(table.classId),
]);
