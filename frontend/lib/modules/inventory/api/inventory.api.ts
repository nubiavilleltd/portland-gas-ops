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

  listItems: async (params: { product_id?: string; status?: string } = {}) => {
    const { data } = await api.get("/api/inventory/items", { params });
    return data;
  },

  getItem: async (id: string) => {
    const { data } = await api.get(`/api/inventory/items/${id}`);
    return data;
  },

  returnItem: async (id: string, input: { condition: string; notes?: string }) => {
    const { data } = await api.post(`/api/inventory/items/${id}/return`, input);
    return data;
  },

  listStock: async () => {
    const { data } = await api.get("/api/inventory/stock");
    return data;
  },
  
  getStock: async (id: string) => {
    const { data } = await api.get(`/api/inventory/stock/${id}`);
    return data;
  },

  listMovements: async (params: { product_id?: string; item_id?: string } = {}) => {
    const { data } = await api.get("/api/inventory/movements", { params });
    return data;
  },

  checkInTracked: async (input: {
    product_id:  string;
    location_id: string;
    quantity:    number;
    condition:   string;
    notes?:      string;
  }) => {
    const { data } = await api.post("/api/inventory/check-in/tracked", input);
    return data;
  },

  checkInConsumable: async (input: {
    product_id:  string;
    location_id: string;
    quantity:    number;
    notes?:      string;
  }) => {
    const { data } = await api.post("/api/inventory/check-in/consumable", input);
    return data;
  },

  getItemAudit: async (itemId: string) => {
    const { data } = await api.get(`/api/inventory/items/${itemId}/audit`);
    return data;
  },
};