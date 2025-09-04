-- AlterTable
ALTER TABLE "public"."relief_groups" ADD COLUMN     "home_village_code" TEXT;

-- CreateTable
CREATE TABLE "public"."states" (
    "state_code" TEXT NOT NULL,
    "state_name" TEXT NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("state_code")
);

-- CreateTable
CREATE TABLE "public"."districts" (
    "district_code" TEXT NOT NULL,
    "district_name" TEXT NOT NULL,
    "state_code" TEXT NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("district_code")
);

-- CreateTable
CREATE TABLE "public"."tehsils" (
    "tehsil_code" TEXT NOT NULL,
    "tehsil_name" TEXT NOT NULL,
    "district_code" TEXT NOT NULL,

    CONSTRAINT "tehsils_pkey" PRIMARY KEY ("tehsil_code")
);

-- CreateTable
CREATE TABLE "public"."villages" (
    "village_code" TEXT NOT NULL,
    "village_name" TEXT NOT NULL,
    "tehsil_code" TEXT NOT NULL,
    "district_code" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,

    CONSTRAINT "villages_pkey" PRIMARY KEY ("village_code")
);

-- CreateIndex
CREATE INDEX "districts_state_code_idx" ON "public"."districts"("state_code");

-- CreateIndex
CREATE INDEX "districts_district_name_idx" ON "public"."districts"("district_name");

-- CreateIndex
CREATE INDEX "tehsils_district_code_idx" ON "public"."tehsils"("district_code");

-- CreateIndex
CREATE INDEX "tehsils_tehsil_name_idx" ON "public"."tehsils"("tehsil_name");

-- CreateIndex
CREATE INDEX "villages_tehsil_code_idx" ON "public"."villages"("tehsil_code");

-- CreateIndex
CREATE INDEX "villages_district_code_idx" ON "public"."villages"("district_code");

-- CreateIndex
CREATE INDEX "villages_village_name_idx" ON "public"."villages"("village_name");

-- AddForeignKey
ALTER TABLE "public"."relief_groups" ADD CONSTRAINT "relief_groups_home_district_code_fkey" FOREIGN KEY ("home_district_code") REFERENCES "public"."districts"("district_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."relief_groups" ADD CONSTRAINT "relief_groups_home_tehsil_code_fkey" FOREIGN KEY ("home_tehsil_code") REFERENCES "public"."tehsils"("tehsil_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."relief_groups" ADD CONSTRAINT "relief_groups_home_village_code_fkey" FOREIGN KEY ("home_village_code") REFERENCES "public"."villages"("village_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."districts" ADD CONSTRAINT "districts_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "public"."states"("state_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tehsils" ADD CONSTRAINT "tehsils_district_code_fkey" FOREIGN KEY ("district_code") REFERENCES "public"."districts"("district_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."villages" ADD CONSTRAINT "villages_tehsil_code_fkey" FOREIGN KEY ("tehsil_code") REFERENCES "public"."tehsils"("tehsil_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."villages" ADD CONSTRAINT "villages_district_code_fkey" FOREIGN KEY ("district_code") REFERENCES "public"."districts"("district_code") ON DELETE RESTRICT ON UPDATE CASCADE;
