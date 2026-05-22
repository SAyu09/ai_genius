ALTER TABLE "agents" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "pricing_config" jsonb;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD COLUMN "gamification_tier" text DEFAULT 'Novice Creator' NOT NULL;