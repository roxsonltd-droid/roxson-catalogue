CREATE TYPE "InquiryActivityType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'NOTE_ADDED', 'NEXT_ACTION_UPDATED', 'QUOTE_CREATED', 'QUOTE_UPDATED', 'QUOTE_FINALIZED', 'QUOTE_EMAILED');

ALTER TABLE "Inquiry"
ADD COLUMN "nextAction" TEXT,
ADD COLUMN "nextActionAt" TIMESTAMP(3),
ADD COLUMN "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "InquiryNote" (
    "id" SERIAL NOT NULL,
    "inquiryId" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "author" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InquiryNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InquiryActivity" (
    "id" SERIAL NOT NULL,
    "inquiryId" INTEGER NOT NULL,
    "type" "InquiryActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "actor" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InquiryActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Inquiry_nextActionAt_idx" ON "Inquiry"("nextActionAt");
CREATE INDEX "Inquiry_lastActivityAt_idx" ON "Inquiry"("lastActivityAt");
CREATE INDEX "InquiryNote_inquiryId_createdAt_idx" ON "InquiryNote"("inquiryId", "createdAt");
CREATE INDEX "InquiryActivity_inquiryId_createdAt_idx" ON "InquiryActivity"("inquiryId", "createdAt");
CREATE INDEX "InquiryActivity_type_idx" ON "InquiryActivity"("type");

ALTER TABLE "InquiryNote" ADD CONSTRAINT "InquiryNote_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InquiryActivity" ADD CONSTRAINT "InquiryActivity_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
