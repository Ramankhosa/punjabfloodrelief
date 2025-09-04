-- CreateEnum
CREATE TYPE "public"."AlertLocationType" AS ENUM ('state', 'district', 'tehsil', 'village');

-- CreateEnum
CREATE TYPE "public"."AlertSeverity" AS ENUM ('info', 'warning', 'critical');

-- CreateTable
CREATE TABLE "public"."alerts" (
    "alert_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "location_type" "public"."AlertLocationType" NOT NULL,
    "state_code" TEXT,
    "district_code" TEXT,
    "tehsil_code" TEXT,
    "village_code" TEXT,
    "notes" TEXT,
    "severity" "public"."AlertSeverity" NOT NULL DEFAULT 'info',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("alert_id")
);

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."alert_categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."alert_statuses"("status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "public"."states"("state_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_district_code_fkey" FOREIGN KEY ("district_code") REFERENCES "public"."districts"("district_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_tehsil_code_fkey" FOREIGN KEY ("tehsil_code") REFERENCES "public"."tehsils"("tehsil_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_village_code_fkey" FOREIGN KEY ("village_code") REFERENCES "public"."villages"("village_code") ON DELETE SET NULL ON UPDATE CASCADE;
