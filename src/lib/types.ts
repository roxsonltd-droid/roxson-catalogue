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
  code: string;
  seriesEn: string;
  seriesBg: string;
  descEn: string;
  descBg: string;
  materialEn: string;
  materialBg: string;
  diameterMin: number | null;
  diameterMax: number | null;
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
  searchText: string;
  order: number;
  categoryId: number;
};

export type CatalogueData = {
  categories: CategoryData[];
  products: ProductData[];
};
