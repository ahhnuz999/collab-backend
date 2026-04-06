ALTER TABLE "emergency_response" RENAME COLUMN "location" TO "origin_location";--> statement-breakpoint
ALTER TABLE "emergency_response" ADD COLUMN "destination_location" json NOT NULL;