-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'REVIEWING', 'QUOTED', 'NEGOTIATING', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "DiameterUnit" AS ENUM ('MM', 'INCH');

-- CreateEnum
CREATE TYPE "TechnicalDataStatus" AS ENUM ('UNREVIEWED', 'NEEDS_VERIFICATION', 'VERIFIED');

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "num" INTEGER NOT NULL DEFAULT 0,
    "titleEn" TEXT NOT NULL,
    "titleBg" TEXT NOT NULL,
    "blurbEn" TEXT NOT NULL,
    "blurbBg" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "supplierCode" TEXT,
    "seriesEn" TEXT NOT NULL,
    "seriesBg" TEXT NOT NULL,
    "descEn" TEXT NOT NULL,
    "descBg" TEXT NOT NULL,
    "materialEn" TEXT NOT NULL DEFAULT '',
    "materialBg" TEXT NOT NULL DEFAULT '',
    "diameterMin" DOUBLE PRECISION,
    "diameterMax" DOUBLE PRECISION,
    "diameterUnit" "DiameterUnit" NOT NULL DEFAULT 'INCH',
    "unit" TEXT NOT NULL DEFAULT 'm',
    "moq" DOUBLE PRECISION,
    "packLength" DOUBLE PRECISION,
    "layout" TEXT NOT NULL DEFAULT 'ruler',
    "coreEn" TEXT NOT NULL DEFAULT '',
    "coreBg" TEXT NOT NULL DEFAULT '',
    "insulationEn" TEXT NOT NULL DEFAULT '',
    "insulationBg" TEXT NOT NULL DEFAULT '',
    "jacketEn" TEXT NOT NULL DEFAULT '',
    "jacketBg" TEXT NOT NULL DEFAULT '',
    "applicationEn" TEXT NOT NULL DEFAULT '',
    "applicationBg" TEXT NOT NULL DEFAULT '',
    "standardEn" TEXT NOT NULL DEFAULT '',
    "standardBg" TEXT NOT NULL DEFAULT '',
    "standardHighlight" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT NOT NULL,
    "datasheetUrl" TEXT,
    "searchText" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "technicalDataStatus" "TechnicalDataStatus" NOT NULL DEFAULT 'UNREVIEWED',
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" SERIAL NOT NULL,
    "company" TEXT,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT,
    "message" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryItem" (
    "id" SERIAL NOT NULL,
    "inquiryId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "diameter" DOUBLE PRECISION,
    "diameterUnit" "DiameterUnit" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'm',
    "notes" TEXT,

    CONSTRAINT "InquiryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE INDEX "Product_technicalDataStatus_idx" ON "Product"("technicalDataStatus");

-- CreateIndex
CREATE INDEX "Inquiry_status_idx" ON "Inquiry"("status");

-- CreateIndex
CREATE INDEX "Inquiry_createdAt_idx" ON "Inquiry"("createdAt");

-- CreateIndex
CREATE INDEX "Inquiry_email_idx" ON "Inquiry"("email");

-- CreateIndex
CREATE INDEX "InquiryItem_inquiryId_idx" ON "InquiryItem"("inquiryId");

-- CreateIndex
CREATE INDEX "InquiryItem_productId_idx" ON "InquiryItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryItem" ADD CONSTRAINT "InquiryItem_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryItem" ADD CONSTRAINT "InquiryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
