ALTER TABLE "agents" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "performance_avg_ms" real;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "performance_p95_ms" real;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "performance_error_rate" real;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "performance_tested_at" timestamp;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "performance_pass" boolean;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "suspended_at" timestamp;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "suspension_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;