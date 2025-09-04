/*
  Warnings:

  - You are about to drop the column `reliefGroupGroup_id` on the `audit_logs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."audit_logs" DROP CONSTRAINT "audit_logs_reliefGroupGroup_id_fkey";

-- AlterTable
ALTER TABLE "public"."audit_logs" DROP COLUMN "reliefGroupGroup_id",
ADD COLUMN     "relief_group_id" TEXT;

-- AlterTable
ALTER TABLE "public"."relief_groups" ADD COLUMN     "review_notes" TEXT,
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by_user_id" TEXT;

-- AddForeignKey
ALTER TABLE "public"."relief_groups" ADD CONSTRAINT "relief_groups_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_relief_group_id_fkey" FOREIGN KEY ("relief_group_id") REFERENCES "public"."relief_groups"("group_id") ON DELETE SET NULL ON UPDATE CASCADE;
