-- CreateEnum
CREATE TYPE "public"."OrgType" AS ENUM ('government', 'ngo', 'independent');

-- CreateEnum
CREATE TYPE "public"."GroupStatus" AS ENUM ('submitted', 'pending_review', 'verified', 'rejected', 'needs_more_info');

-- CreateEnum
CREATE TYPE "public"."DocType" AS ENUM ('rep_id', 'org_cert');

-- CreateTable
CREATE TABLE "public"."users" (
    "user_id" TEXT NOT NULL,
    "primary_login" TEXT NOT NULL,
    "email" TEXT,
    "phone_e164" TEXT,
    "password_hash" TEXT NOT NULL,
    "roles" TEXT[],
    "phone_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "device_fingerprint" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "public"."password_resets" (
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("token_hash")
);

-- CreateTable
CREATE TABLE "public"."relief_groups" (
    "group_id" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "org_type" "public"."OrgType" NOT NULL,
    "registration_number" TEXT,
    "home_district_code" TEXT,
    "home_tehsil_code" TEXT,
    "home_lat" DOUBLE PRECISION,
    "home_lon" DOUBLE PRECISION,
    "contact_email" TEXT,
    "contact_phone_e164" TEXT NOT NULL,
    "intended_operations" TEXT[],
    "service_area" JSONB,
    "status" "public"."GroupStatus" NOT NULL DEFAULT 'submitted',
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relief_groups_pkey" PRIMARY KEY ("group_id")
);

-- CreateTable
CREATE TABLE "public"."group_representatives" (
    "group_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rep_name" TEXT NOT NULL,
    "rep_phone_e164" TEXT NOT NULL,
    "otp_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "doc_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "public"."DocType" NOT NULL,
    "file_url" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("doc_id")
);

-- CreateTable
CREATE TABLE "public"."otp_requests" (
    "id" TEXT NOT NULL,
    "phone_e164" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "log_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reliefGroupGroup_id" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_primary_login_key" ON "public"."users"("primary_login");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_e164_key" ON "public"."users"("phone_e164");

-- CreateIndex
CREATE UNIQUE INDEX "group_representatives_group_id_user_id_key" ON "public"."group_representatives"("group_id", "user_id");

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."relief_groups" ADD CONSTRAINT "relief_groups_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_representatives" ADD CONSTRAINT "group_representatives_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."relief_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_representatives" ADD CONSTRAINT "group_representatives_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."relief_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_reliefGroupGroup_id_fkey" FOREIGN KEY ("reliefGroupGroup_id") REFERENCES "public"."relief_groups"("group_id") ON DELETE SET NULL ON UPDATE CASCADE;
