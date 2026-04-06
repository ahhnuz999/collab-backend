ALTER TABLE "public"."emergency_request" ALTER COLUMN "request_status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."request_status";--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('pending', 'assigned', 'rejected', 'in_progress', 'completed');--> statement-breakpoint
ALTER TABLE "public"."emergency_request" ALTER COLUMN "request_status" SET DATA TYPE "public"."request_status" USING "request_status"::"public"."request_status";