import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

import type { CustomerContact, CustomerVisit } from "./types";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomerActivities, createCustomerContacts } from "./api";
import {
  CreateCustomerContactPayload,
  UpdateCustomerVisitPayload,
} from "./types";

export function useCRMActivityByCustomer(customerId?: string) {
  const query = useQuery({
    queryKey: ["crm", "activity", customerId],
    queryFn: () => getCustomerActivities(customerId!),
    enabled: !!customerId,
  });

  return {
    entries: query.data ?? [],
    ...query,
  };
}
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("api/crm", payload);
      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["crm", "customers"],
      });
    },
  });
}

export function useCustomerOnboarding() {
  return useQuery({
    queryKey: ["crm", "customer-onboarding"],
    queryFn: async () => {
      const { data } = await api.get("/api/crm");
      return data;
    },
  });
}

export function useCreateCustomerContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      data,
    }: {
      customerId: string;
      data: CreateCustomerContactPayload;
    }) => createCustomerContacts(customerId, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customer-contacts"],
      });

      queryClient.invalidateQueries({
        queryKey: ["customers"],
      });
    },
  });
}

export function useActivateCustomerContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId: string) => {
      const response = await api.patch(
        `api/crm/contacts/${contactId}/activate`,
      );

      return response.data;
    },

    onSuccess: (contact) => {
      queryClient.invalidateQueries({
        queryKey: ["crm", "contacts"],
      });

      queryClient.invalidateQueries({
        queryKey: ["crm", "customer-contacts"],
      });

      queryClient.invalidateQueries({
        queryKey: ["crm", "customer-contacts", contact.customer_id],
      });

      queryClient.invalidateQueries({
        queryKey: ["crm", "activity", contact.customer_id],
      });
    },
  });
}

export function useDeactivateCustomerContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId: string) => {
      const response = await api.patch(
        `api/crm/contacts/${contactId}/deactivate`,
      );

      return response.data;
    },

    onSuccess: (contact) => {
      queryClient.invalidateQueries({
        queryKey: ["crm", "contacts"],
      });

      queryClient.invalidateQueries({
        queryKey: ["crm", "customer-contacts"],
      });

      queryClient.invalidateQueries({
        queryKey: ["crm", "customer-contacts", contact.customer_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["crm", "activity", contact.customer_id],
      });
    },
  });
}

export function useCustomerOnboardingDetails(id: string) {
  return useQuery({
    queryKey: ["crm", "customers", id],

    queryFn: async () => {
      const response = await api.get(`api/crm/${id}`);

      return response.data;
    },

    enabled: Boolean(id),
  });
}

export function useCustomerContactDetails(customerId: string) {
  return useQuery({
    queryKey: ["crm", "customer-contacts", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data } = await api.get<CustomerContact[]>(
        `api/crm/${customerId}/contacts`,
      );

      return data;
    },
  });
}

export function useCustomerContacts() {
  return useQuery({
    queryKey: ["crm", "contacts"],
    queryFn: async () => {
      const { data } = await api.get("api/crm/contacts");
      return data;
    },
  });
}

export async function updateCustomerContacts(
  customerId: string,
  data: CreateCustomerContactPayload,
) {
  const response = await api.patch(`api/crm/${customerId}/contacts`, data);

  return response.data;
}

export function useUpdateCustomerContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      data,
    }: {
      customerId: string;
      data: CreateCustomerContactPayload;
    }) => updateCustomerContacts(customerId, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["customer-contacts", variables.customerId],
      });

      queryClient.invalidateQueries({
        queryKey: ["customer-contacts"],
      });
      queryClient.invalidateQueries({
        queryKey: ["crm", "activity", variables.customerId],
      });
    },
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ["crm", "customers"],
    queryFn: async () => {
      const { data } = await api.get("/api/crm");
      return data;
    },
  });
}

export function useCustomerDetails(id: string) {
  return useQuery({
    queryKey: ["crm", "customers", id],
    enabled: !!id,

    queryFn: async () => {
      const response = await api.get(`api/crm/${id}`);
      return response.data;
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, any>;
    }) => {
      const response = await api.patch(`api/crm/${id}`, data);
      return response.data;
    },

    onSuccess: (customer) => {
      queryClient.invalidateQueries({
        queryKey: ["crm", "customers"],
      });

      queryClient.invalidateQueries({
        queryKey: ["crm", "customers", customer.id],
      });

      queryClient.invalidateQueries({
        queryKey: ["crm", "activity", customer.id],
      });
    },
  });
}

export function useActivateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`api/crm/${id}/activate`);
      return response.data;
    },

    onSuccess: (customer) => {
      queryClient.invalidateQueries({
        queryKey: ["crm", "customers"],
      });
      queryClient.invalidateQueries({
        queryKey: ["crm", "customers", customer.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["crm", "activity", customer.id],
      });

      queryClient.invalidateQueries({
        queryKey: ["crm", "dashboard"],
      });
    },
  });
}
export function useDeactivateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`api/crm/${id}/deactivate`);

      return response.data;
    },

    onSuccess: (customer) => {
      queryClient.invalidateQueries({
        queryKey: ["crm", "customers"],
      });
      queryClient.invalidateQueries({
        queryKey: ["crm", "customers", customer.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["crm", "activity", customer.id],
      });

      queryClient.invalidateQueries({
        queryKey: ["crm", "dashboard"],
      });
    },
  });
}

// ==============CUSTOMER VISITS ======
export function useCustomerVisits() {
  return useQuery({
    queryKey: ["crm", "customer-visits"],
    queryFn: async () => {
      const { data } = await api.get("api/crm/visits");
      return data as CustomerVisit[];
    },
  });
}

export function useCustomerVisitDetails(id?: string) {
  return useQuery({
    queryKey: ["crm", "customer-visit", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get(`api/crm/visits/${id}`);
      return data as CustomerVisit;
    },
  });
}

export function useCreateCustomerVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const { data } = await api.post("api/crm/visits", payload);
      return data;
    },

    onSuccess: (visit) => {
      queryClient.invalidateQueries({
        queryKey: ["crm", "customer-visits"],
      });

      queryClient.invalidateQueries({
        queryKey: ["crm", "activity", visit.customer_id],
      });

      queryClient.invalidateQueries({
        queryKey: ["crm", "dashboard"],
      });
    },
  });
}

export function useUpdateCustomerVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCustomerVisitPayload;
    }) => updateCustomerVisit(id, data),

    onSuccess: (visit) => {
      queryClient.invalidateQueries({
        queryKey: ["crm", "customer-visits"],
      });

      queryClient.invalidateQueries({
        queryKey: ["crm", "customer-visit", visit.id],
      });

      queryClient.invalidateQueries({
        queryKey: ["crm", "activity", visit.customer_id],
      });
    },
  });
}

export async function updateCustomerVisit(
  id: string,
  data: UpdateCustomerVisitPayload,
) {
  const response = await api.patch(`api/crm/visits/${id}`, data);

  return response.data;
}
