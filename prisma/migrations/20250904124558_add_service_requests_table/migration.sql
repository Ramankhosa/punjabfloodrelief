-- CreateEnum
CREATE TYPE "public"."ServiceRequestStatus" AS ENUM ('submitted', 'under_review', 'assigned', 'in_progress', 'completed', 'cancelled', 'rejected');

-- CreateEnum
CREATE TYPE "public"."ServicePriority" AS ENUM ('low', 'normal', 'high', 'critical');

-- CreateTable
CREATE TABLE "public"."service_requests" (
    "request_id" TEXT NOT NULL,
    "request_number" TEXT NOT NULL,
    "requester_name" TEXT NOT NULL,
    "requester_phone" TEXT NOT NULL,
    "requester_alt_phone" TEXT,
    "village_id" TEXT NOT NULL,
    "village_name" TEXT NOT NULL,
    "tehsil_id" TEXT NOT NULL,
    "tehsil_name" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,
    "district_name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "location_accuracy" DOUBLE PRECISION,
    "location_source" TEXT,
    "requested_services" TEXT[],
    "service_details" JSONB,
    "additional_notes" TEXT,
    "language" TEXT NOT NULL DEFAULT 'pa',
    "network_quality" TEXT NOT NULL DEFAULT 'good',
    "client_timestamp" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."ServiceRequestStatus" NOT NULL DEFAULT 'submitted',
    "priority" "public"."ServicePriority" NOT NULL DEFAULT 'normal',
    "assigned_to_group" TEXT,
    "assigned_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "admin_notes" TEXT,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_requests_request_number_key" ON "public"."service_requests"("request_number");

-- AddForeignKey
ALTER TABLE "public"."service_requests" ADD CONSTRAINT "service_requests_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("village_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_requests" ADD CONSTRAINT "service_requests_tehsil_id_fkey" FOREIGN KEY ("tehsil_id") REFERENCES "public"."tehsils"("tehsil_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_requests" ADD CONSTRAINT "service_requests_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("district_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_requests" ADD CONSTRAINT "service_requests_assigned_to_group_fkey" FOREIGN KEY ("assigned_to_group") REFERENCES "public"."relief_groups"("group_id") ON DELETE SET NULL ON UPDATE CASCADE;
