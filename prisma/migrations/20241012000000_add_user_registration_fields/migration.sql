-- Add new fields for enhanced user registration

-- Standard UID field (new)
ALTER TABLE "users" ADD COLUMN "uid" VARCHAR UNIQUE;

-- Personal information
ALTER TABLE "users" ADD COLUMN "fullName" VARCHAR;
ALTER TABLE "users" ADD COLUMN "documentType" VARCHAR DEFAULT 'DNI';
ALTER TABLE "users" ADD COLUMN "documentNumber" VARCHAR UNIQUE;
ALTER TABLE "users" ADD COLUMN "phoneNumber" VARCHAR;
ALTER TABLE "users" ADD COLUMN "photoUrl" VARCHAR;

-- Authentication provider
ALTER TABLE "users" ADD COLUMN "provider" VARCHAR DEFAULT 'email';

-- Verification status
ALTER TABLE "users" ADD COLUMN "emailVerified" BOOLEAN DEFAULT false;
ALTER TABLE "users" ADD COLUMN "phoneVerified" BOOLEAN DEFAULT false;
ALTER TABLE "users" ADD COLUMN "verified" BOOLEAN DEFAULT false;
ALTER TABLE "users" ADD COLUMN "verifiedAt" TIMESTAMP;
ALTER TABLE "users" ADD COLUMN "verificationId" VARCHAR;
ALTER TABLE "users" ADD COLUMN "verificationProvider" VARCHAR;

-- Google-specific metadata
ALTER TABLE "users" ADD COLUMN "googleName" VARCHAR;
ALTER TABLE "users" ADD COLUMN "accountCreatedAt" TIMESTAMP;
ALTER TABLE "users" ADD COLUMN "accountAgeInDays" INTEGER;
ALTER TABLE "users" ADD COLUMN "trustScore" INTEGER DEFAULT 50;

-- Device fingerprint
ALTER TABLE "users" ADD COLUMN "deviceIp" VARCHAR;
ALTER TABLE "users" ADD COLUMN "deviceUserAgent" VARCHAR;
ALTER TABLE "users" ADD COLUMN "deviceId" VARCHAR;

-- Fraud detection
ALTER TABLE "users" ADD COLUMN "suspiciousRegistration" BOOLEAN DEFAULT false;
ALTER TABLE "users" ADD COLUMN "nameSimilarity" DECIMAL;

-- Additional timestamp
ALTER TABLE "users" ADD COLUMN "lastLoginAt" TIMESTAMP;

-- Create index on new fields
CREATE INDEX "users_uid_idx" ON "users"("uid");
CREATE INDEX "users_documentNumber_idx" ON "users"("documentNumber");

