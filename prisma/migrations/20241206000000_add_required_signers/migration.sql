-- CreateTable
CREATE TABLE "required_signers" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "role" TEXT,
    "userId" TEXT,
    "signed" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "required_signers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "required_signers_contractId_idx" ON "required_signers"("contractId");

-- CreateIndex
CREATE INDEX "required_signers_email_idx" ON "required_signers"("email");

-- CreateIndex
CREATE INDEX "required_signers_documentNumber_idx" ON "required_signers"("documentNumber");

-- CreateIndex
CREATE INDEX "required_signers_userId_idx" ON "required_signers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "required_signers_contractId_email_key" ON "required_signers"("contractId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "required_signers_contractId_documentNumber_key" ON "required_signers"("contractId", "documentNumber");

-- AddForeignKey
ALTER TABLE "required_signers" ADD CONSTRAINT "required_signers_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
