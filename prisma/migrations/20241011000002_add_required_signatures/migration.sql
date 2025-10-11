-- AddColumn
ALTER TABLE "contracts" ADD COLUMN "requiredSignatures" INTEGER NOT NULL DEFAULT 2;
