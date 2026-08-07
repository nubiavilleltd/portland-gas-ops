export const PRODUCT_KEYS = {
  all: ["products"] as const,

  lists: () => [...PRODUCT_KEYS.all, "list"] as const,
  picker: () => [...PRODUCT_KEYS.all, "picker"] as const,

  list: (filters?: {
    search?: string;
    status?: string;
    productType?: string;
  }) => [...PRODUCT_KEYS.lists(), filters] as const,

  details: () => [...PRODUCT_KEYS.all, "detail"] as const,

  detail: (productId: string) =>
    [...PRODUCT_KEYS.details(), productId] as const,
} as const;