import api from "@/lib/api";
import { InventoryAssignment } from "../../inventory/types/inventory.types";

export const fleetApi = {
  // ── Drivers ──────────────────────────────────────────────
  listDrivers: async (params: { status?: string } = {}) => {
    const { data } = await api.get("/api/fleet/drivers", { params });
    return data;
  },

  listAvailableDrivers: async () => {
    const { data } = await api.get("/api/fleet/drivers/available");
    return data;
  },

  getDriver: async (id: string | number) => {
    const { data } = await api.get(`/api/fleet/drivers/${id}`);
    return data;
  },

  createDriver: async (input: Record<string, unknown>) => {
    // const { data } = await api.post("/api/fleet/drivers", formData, {
    //   headers: { "Content-Type": "multipart/form-data" },
    // });
     const { data } = await api.post(`/api/fleet/drivers`, input);
    return data;
  },

  updateDriver: async (id: string | number, input: Record<string, unknown>) => {
    const { data } = await api.put(`/api/fleet/drivers/${id}`, input);
    return data;
  },

  suspendDriver: async (id: string) => {
  const { data } = await api.patch(`/api/fleet/drivers/${id}/suspend`);
  return data;
},
reinstateDriver: async (id: string) => {
  const { data } = await api.patch(`/api/fleet/drivers/${id}/reinstate`);
  return data;
},
setDriverOffDuty: async (id: string) => {
  const { data } = await api.patch(`/api/fleet/drivers/${id}/off-duty`);
  return data;
},
setDriverAvailable: async (id: string) => {
  const { data } = await api.patch(`/api/fleet/drivers/${id}/available`);
  return data;
},

  // ── Vehicles ─────────────────────────────────────────────
  listVehicles: async (params: { status?: string } = {}) => {
    const { data } = await api.get("/api/fleet/vehicles", { params });
    return data;
  },

  listAvailableVehicles: async () => {
    const { data } = await api.get("/api/fleet/vehicles/available");
    return data;
  },

  getVehicle: async (id: string | number) => {
    const { data } = await api.get(`/api/fleet/vehicles/${id}`);
    return data;
  },

  createVehicle: async (formData: FormData) => {
    const { data } = await api.post("/api/fleet/vehicles", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

 updateVehicle: async (id: string, formData: FormData) => {
  const { data } = await api.put(`/api/fleet/vehicles/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
},

activateVehicle: async (id: string) => {
  const { data } = await api.patch(`/api/fleet/vehicles/${id}/activate`);
  return data;
},
deactivateVehicle: async (id: string) => {
  const { data } = await api.patch(`/api/fleet/vehicles/${id}/deactivate`);
  return data;
},
sendVehicleForMaintenance: async (id: string) => {
  const { data } = await api.patch(`/api/fleet/vehicles/${id}/maintenance`);
  return data;
},
returnVehicleFromMaintenance: async (id: string) => {
  const { data } = await api.patch(`/api/fleet/vehicles/${id}/return-from-maintenance`);
  return data;
},



  // ── Trips ─────────────────────────────────────────────────
  listTrips: async (params: { status?: string } = {}) => {
    const { data } = await api.get("/api/fleet/trips", { params });
    return data;
  },

  getTrip: async (id: string | number) => {
    const { data } = await api.get(`/api/fleet/trips/${id}`);
    return data;
  },

  createTrip: async (input: {
    type: string;
    order_ids: string[];
    start_location: string;
    end_location: string;
    scheduled_date: string;
    notes?: string;
  }) => {
    const { data } = await api.post("/api/fleet/trips", input);
    return data;
  },

assignResources: async (tripId: string, driverId: string, vehicleId: string) => {
  const { data } = await api.post(`/api/fleet/trips/${tripId}/assign`, {
    driver_id: driverId,
    vehicle_id: vehicleId,
  });
  return data;
},

markReady: async (
    tripId: string,
    assignments: InventoryAssignment[],
) => {
    const { data } = await api.post(
        `/api/fleet/trips/${tripId}/mark-ready`,
        {
            assignments,
        },
    );

    return data;
},

  dispatch: async (tripId: string | number) => {
    const { data } = await api.post(`/api/fleet/trips/${tripId}/dispatch`);
    return data;
  },

  start: async (tripId: string | number) => {
    const { data } = await api.post(`/api/fleet/trips/${tripId}/start`);
    return data;
  },

  complete: async (tripId: string | number, proofNotes?: string) => {
    const { data } = await api.post(`/api/fleet/trips/${tripId}/complete`, {
      proof_notes: proofNotes,
    });
    return data;
  },

  cancel: async (tripId: string | number, reason?: string) => {
    const { data } = await api.post(`/api/fleet/trips/${tripId}/cancel`, { reason });
    return data;
  },

  addOrder: async (tripId: string | number, orderId: string) => {
    const { data } = await api.post(`/api/fleet/trips/${tripId}/orders`, {
      order_id: orderId,
    });
    return data;
  },

  removeOrder: async (tripId: string | number, orderId: string) => {
    const { data } = await api.delete(`/api/fleet/trips/${tripId}/orders/${orderId}`);
    return data;
  },

  getTripAudit: async (tripId: string | number) => {
    const { data } = await api.get(`/api/fleet/trips/${tripId}/audit`);
    return data;
  },
};