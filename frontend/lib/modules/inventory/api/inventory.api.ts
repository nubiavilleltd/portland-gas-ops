import api from "@/lib/api";

export const inventoryApi = {
  getLocations: async () => {
    const { data } = await api.get("/api/inventory/locations");
    return data;
  },

  getKpis: async () => {
    const { data } = await api.get("/api/inventory/kpis");
    return data;
  },

  // ── Overview ────────────────────────────────────────────
  getOverview: async (
    params: {
      search?: string;
      inventory_tracking?: string;
      category_id?: string;
      stock_status?: string;
      page?: number;
      page_size?: number;
    } = {},
  ) => {
    const { data } = await api.get("/api/inventory/overview", { params });
    return data;
  },

  getProductAvailability: async (productId: string) => {
    const { data } = await api.get(
      `/api/inventory/products/${productId}/availability`,
    );
    return data;
  },

  // ── Individual items ────────────────────────────────────
  listItems: async (
    params: {
      product_id?: string;
      status?: string;
      page?: number;
      page_size?: number;
    } = {},
  ) => {
    const { data } = await api.get("/api/inventory/items", { params });
    return data;
  },

  getItem: async (id: string) => {
    const { data } = await api.get(`/api/inventory/items/${id}`);
    return data;
  },

  returnItem: async (
    id: string,
    input: { condition: string; notes?: string },
  ) => {
    const { data } = await api.post(
      `/api/inventory/items/${id}/return`,
      input,
    );
    return data;
  },

  // ── Stock quantity ──────────────────────────────────────
   listStock: async (
    params: { product_id?: string } = {},
  ) => {
    const { data } = await api.get("/api/inventory/stock", { params });
    return data;
  },

  getStock: async (id: string) => {
    const { data } = await api.get(`/api/inventory/stock/${id}`);
    return data;
  },

  // ── Movements ───────────────────────────────────────────
   listMovements: async (
    params: {
      product_id?: string;
      item_id?: string;
      page_size?: number;
    } = {},
  ) => {
    const { data } = await api.get("/api/inventory/movements", { params });
    return data;
  },

  // ── Check in ────────────────────────────────────────────
  checkInIndividualItems: async (input: {
    product_id: string;
    location_id: string;
    quantity: number;
    condition: string;
    notes?: string;
  }) => {
    const { data } = await api.post(
      "/api/inventory/check-in/individual-items",
      input,
    );
    return data;
  },

  checkInStockQuantity: async (input: {
    product_id: string;
    location_id: string;
    quantity: number;
    notes?: string;
  }) => {
    const { data } = await api.post(
      "/api/inventory/check-in/stock-quantity",
      input,
    );
    return data;
  },

  // ── Audit ───────────────────────────────────────────────
  getItemAudit: async (itemId: string) => {
    const { data } = await api.get(
      `/api/inventory/items/${itemId}/audit`,
    );
    return data;
  },

  // ── Available locations for stock-quantity products ─────
  getConsumableLocations: async (productId: string) => {
    const { data } = await api.get(
      `/api/inventory/products/${productId}/available-locations`,
    );
    return data;
  },
};