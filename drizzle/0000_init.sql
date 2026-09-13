CREATE TYPE "public"."lead_status" AS ENUM('new', 'in_progress', 'proposal', 'won', 'lost', 'spam');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text DEFAULT 'Admin' NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"visitor_id" text NOT NULL,
	"type" text NOT NULL,
	"name" text,
	"path" text,
	"data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"author_id" uuid,
	"kind" text DEFAULT 'note' NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" serial NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"telegram" text,
	"company" text,
	"services" text[] DEFAULT '{}'::text[] NOT NULL,
	"budget" text,
	"timeline" text,
	"message" text,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"locale" text,
	"visitor_id" text,
	"session_id" text,
	"channel" text,
	"utm" jsonb,
	"page" text,
	"country" text,
	"city" text,
	"device" text,
	"user_agent" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"visitor_id" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"duration" integer DEFAULT 0 NOT NULL,
	"pageviews" integer DEFAULT 0 NOT NULL,
	"events" integer DEFAULT 0 NOT NULL,
	"max_scroll" integer DEFAULT 0 NOT NULL,
	"referrer" text,
	"referrer_host" text,
	"channel" text DEFAULT 'direct' NOT NULL,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	"landing_path" text,
	"locale" text,
	"country" text,
	"city" text,
	"device" text,
	"browser" text,
	"os" text,
	"screen" text,
	"ip_hash" text,
	"converted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitors" (
	"id" text PRIMARY KEY NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"visits" integer DEFAULT 1 NOT NULL,
	"pageviews" integer DEFAULT 0 NOT NULL,
	"country" text,
	"city" text,
	"device" text,
	"browser" text,
	"os" text,
	"language" text,
	"lead_id" uuid
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_author_id_admins_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_session_id_index" ON "events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "events_created_at_index" ON "events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "events_type_name_index" ON "events" USING btree ("type","name");--> statement-breakpoint
CREATE INDEX "lead_notes_lead_id_index" ON "lead_notes" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "leads_created_at_index" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "leads_status_index" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sessions_started_at_index" ON "sessions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "sessions_last_seen_at_index" ON "sessions" USING btree ("last_seen_at");--> statement-breakpoint
CREATE INDEX "sessions_visitor_id_index" ON "sessions" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "sessions_channel_index" ON "sessions" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "visitors_last_seen_at_index" ON "visitors" USING btree ("last_seen_at");