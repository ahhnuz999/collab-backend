CREATE TYPE "public"."request_status" AS ENUM('pending', 'assigned', 'rejected', 'in_progress');--> statement-breakpoint
CREATE TYPE "public"."status_update" AS ENUM('accepted', 'arrived', 'on_route', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('ambulance', 'police', 'rescue_team', 'fire_truck');--> statement-breakpoint
CREATE TYPE "public"."service_status" AS ENUM('available', 'assigned', 'off_duty');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TYPE "public"."org_status" AS ENUM('not_active', 'active', 'not_verified');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TABLE "emergency_contact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"is_comman_contact" boolean DEFAULT false NOT NULL,
	"phone_number" varchar(15) NOT NULL,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"service_type" "service_type" NOT NULL,
	"request_status" "request_status" DEFAULT 'pending' NOT NULL,
	"request_time" timestamp DEFAULT now(),
	"dispatch_time" timestamp,
	"arrival_time" timestamp,
	"description" varchar(255),
	"location" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_response" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emergency_request_id" uuid,
	"service_provider_id" uuid,
	"status_update" "status_update" DEFAULT 'accepted',
	"location" json NOT NULL,
	"assigned_at" timestamp,
	"responded_at" timestamp DEFAULT now(),
	"updateDescription" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"serviceProvider_id" uuid NOT NULL,
	"message" varchar(510),
	"service_ratings" integer GENERATED ALWAYS AS IDENTITY (sequence name "feedback_service_ratings_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 5 START WITH 1 CACHE 1),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_provider" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"age" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone_number" bigint NOT NULL,
	"primary_address" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"service_type" "service_type" NOT NULL,
	"is_verified" boolean DEFAULT false,
	"profile_picture" varchar(255),
	"organization_id" uuid NOT NULL,
	"current_location" json DEFAULT '{"latitude":"","longitude":""}'::json,
	"service_status" "service_status" DEFAULT 'available' NOT NULL,
	"verification_token" varchar(255),
	"token_expiry" timestamp,
	"reset_password_token" varchar(255),
	"reset_password_token_expiry" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_provider_id_unique" UNIQUE("id"),
	CONSTRAINT "service_provider_email_unique" UNIQUE("email"),
	CONSTRAINT "service_provider_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"age" integer NOT NULL,
	"phone_number" bigint NOT NULL,
	"email" varchar(255) NOT NULL,
	"primary_address" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"is_verified" boolean DEFAULT false,
	"role" "role" DEFAULT 'user',
	"profile_picture" varchar(255),
	"verification_token" varchar(255),
	"token_expiry" timestamp,
	"current_location" json DEFAULT '{"latitude":"","longitude":""}'::json,
	"reset_password_token" varchar(255),
	"reset_password_token_expiry" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_id_unique" UNIQUE("id"),
	CONSTRAINT "user_phone_number_unique" UNIQUE("phone_number"),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"service_category" "service_type" NOT NULL,
	"general_number" bigint NOT NULL,
	"org_status" "org_status" DEFAULT 'not_verified' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"service_provider_id" uuid,
	"message" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"priority" "priority" DEFAULT 'low',
	"source" varchar(100) NOT NULL,
	"metadata" json,
	"deliveryStatus" varchar(50) DEFAULT 'pending',
	"is_read" boolean DEFAULT false,
	"do_not_disturb" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "emergency_request" ADD CONSTRAINT "emergency_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_response" ADD CONSTRAINT "emergency_response_emergency_request_id_emergency_request_id_fk" FOREIGN KEY ("emergency_request_id") REFERENCES "public"."emergency_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_response" ADD CONSTRAINT "emergency_response_service_provider_id_service_provider_id_fk" FOREIGN KEY ("service_provider_id") REFERENCES "public"."service_provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_serviceProvider_id_service_provider_id_fk" FOREIGN KEY ("serviceProvider_id") REFERENCES "public"."service_provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_provider" ADD CONSTRAINT "service_provider_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_service_provider_id_service_provider_id_fk" FOREIGN KEY ("service_provider_id") REFERENCES "public"."service_provider"("id") ON DELETE no action ON UPDATE no action;