-- CreateTable
CREATE TABLE "public"."services" (
    "service_id" TEXT NOT NULL,
    "broad_category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("service_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "services_broad_category_subcategory_key" ON "public"."services"("broad_category", "subcategory");
