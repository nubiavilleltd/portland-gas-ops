export const PRODUCT_ROUTES = {
    list: () => "/admin/products",
    new: () => "/admin/products/new",
    detail: (id: string) => `/admin/products/${id}`,
    edit: (id: string) => `/admin/products/${id}/edit`,
} as const;