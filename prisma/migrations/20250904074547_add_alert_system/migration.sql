-- CreateTable
CREATE TABLE "public"."alert_categories" (
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "public"."alert_statuses" (
    "status_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_statuses_pkey" PRIMARY KEY ("status_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alert_categories_name_key" ON "public"."alert_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "alert_statuses_category_id_name_key" ON "public"."alert_statuses"("category_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "alert_statuses_category_id_value_key" ON "public"."alert_statuses"("category_id", "value");

-- AddForeignKey
ALTER TABLE "public"."alert_statuses" ADD CONSTRAINT "alert_statuses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."alert_categories"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;
