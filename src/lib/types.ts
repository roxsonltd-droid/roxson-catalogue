export type CategoryData = {
  id: number;
  slug: string;
  num: number;
  titleEn: string;
  titleBg: string;
  blurbEn: string;
  blurbBg: string;
};

export type ProductData = {
  id: number;
  sku: string;
  slug: string;
  supplierCode: string | null;
  seriesEn: string;
  seriesBg: string;
  descEn: string;
  descBg: string;
  materialEn: string;
  materialBg: string;
  diameterMin: number | null;
  diameterMax: number | null;
  diameterUnit: "MM" | "INCH";
  unit: string;
  moq: number | null;
  packLength: number | null;
  layout: "ruler" | "layers" | "table";
  coreEn: string;
  coreBg: string;
  insulationEn: string;
  insulationBg: string;
  jacketEn: string;
  jacketBg: string;
  applicationEn: string;
  applicationBg: string;
  standardEn: string;
  standardBg: string;
  standardHighlight: boolean;
  imageUrl: string;
  datasheetUrl: string | null;
  searchText: string;
  order: number;
  isActive: boolean;
  technicalDataStatus: "UNREVIEWED" | "NEEDS_VERIFICATION" | "VERIFIED";
  categoryId: number;
};

export type CatalogueData = {
  categories: CategoryData[];
  products: ProductData[];
};

export type InquiryDraftItem = {
  productId: number;
  sku: string;
  supplierCode: string | null;
  diameter: number | null;
  diameterUnit: ProductData["diameterUnit"];
  quantity: number;
  unit: string;
};
