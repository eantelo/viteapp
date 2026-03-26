export const FEATURES = {
  CRM: "crm",
  PURCHASES: "purchases",
  SUPPLIERS: "suppliers",
  CATEGORIES: "categories",
} as const;

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES];
