CREATE TABLE "managed_hosting" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"tier" text NOT NULL,
	"docker_image" text NOT NULL,
	"port" integer DEFAULT 3000 NOT NULL,
	"env_vars_encrypted" text,
	"coolify_app_id" text,
	"hosted_url" text,
	"status" text DEFAULT 'provisioning' NOT NULL,
	"stripe_subscription_id" text,
	"monthly_cost_paise" integer NOT NULL,
	"provisioned_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid,
	"purchase_id" uuid,
	"admin_id" uuid NOT NULL,
	"amount_paise" integer NOT NULL,
	"stripe_refund_id" text,
	"reason" text,
	"decision" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_bank_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"account_holder_name" text NOT NULL,
	"bank_name" text NOT NULL,
	"account_number_encrypted" text NOT NULL,
	"ifsc_code" text NOT NULL,
	"account_type" text DEFAULT 'savings' NOT NULL,
	"upi_id_encrypted" text,
	"pan_number_encrypted" text NOT NULL,
	"gst_number" text,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"verified_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "seller_bank_details_seller_id_unique" UNIQUE("seller_id")
);
--> statement-breakpoint
CREATE TABLE "seller_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" text,
	"settlement_status" text DEFAULT 'pending_details',
	"tos_accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"gross_payout_paise" integer NOT NULL,
	"tds_deducted_paise" integer DEFAULT 0 NOT NULL,
	"refund_deductions_paise" integer DEFAULT 0 NOT NULL,
	"net_payout_paise" integer NOT NULL,
	"bank_reference_number" text,
	"status" text DEFAULT 'processing' NOT NULL,
	"failure_reason" text,
	"initiated_by" uuid,
	"settled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "purchases" DROP CONSTRAINT "purchases_stripe_session_id_unique";--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "type" text DEFAULT 'hosted' NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "agent_type" text DEFAULT 'chat' NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "pricing_model" text DEFAULT 'subscription' NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "monthly_price_paise" integer;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "annual_price_paise" integer;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "stripe_price_id_monthly" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "stripe_price_id_annual" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "endpoint_url" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "sdk_secret_encrypted" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "sdk_version" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "agent_config" jsonb;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "is_featured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "feature_order" integer;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "rejected_at" timestamp;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "subscriber_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "suspension_note" text;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "seller_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "subscription_id" uuid;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "stripe_payment_id" text;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "currency" text DEFAULT 'inr';--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "type" text DEFAULT 'one_time' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "settlement_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "settlement_id" uuid;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "subscription_id" uuid;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "is_visible" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "managed_hosting" ADD CONSTRAINT "managed_hosting_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "managed_hosting" ADD CONSTRAINT "managed_hosting_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_bank_details" ADD CONSTRAINT "seller_bank_details_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_bank_details" ADD CONSTRAINT "seller_bank_details_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_settlements" ADD CONSTRAINT "seller_settlements_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_settlements" ADD CONSTRAINT "seller_settlements_initiated_by_users_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_settlement_id_seller_settlements_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."seller_settlements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "one_review_per_buyer_agent" ON "reviews" USING btree ("buyer_id","agent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "active_sub_idx" ON "subscriptions" USING btree ("buyer_id","agent_id") WHERE "subscriptions"."status" = 'active';--> statement-breakpoint
ALTER TABLE "agents" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "purchases" DROP COLUMN "stripe_session_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "stripe_account_id";