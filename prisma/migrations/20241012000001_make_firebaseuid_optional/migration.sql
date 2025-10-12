-- Make firebaseUid optional for backward compatibility
ALTER TABLE "users" ALTER COLUMN "firebaseUid" DROP NOT NULL;

