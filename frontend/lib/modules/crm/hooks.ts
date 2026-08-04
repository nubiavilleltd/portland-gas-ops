import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

import type {
  CustomerOnboarding,
  CustomerContact,
  CustomerVisit,
} from "./types";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getCustomerActivities } from "./api";

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

export const MOCK_CUSTOMER_CONTACTS: CustomerContact[] = [];

export function useCustomerContactDetails(id: string) {
  return useQuery({
    queryKey: ["crm", "customer-contact", id],
    queryFn: async () =>
      MOCK_CUSTOMER_CONTACTS.find((contact) => contact.id === id) ?? null,
  });
}

export function useCustomerContacts() {
  return useQuery({
    queryKey: ["crm", "customer-contacts"],
    queryFn: async () => MOCK_CUSTOMER_CONTACTS,
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ["crm", "customers"],
    queryFn: async () => {
      const { data } = await api.get("api/crm");
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

// ==============CUSTOMER VISITS
export const customerVisits: CustomerVisit[] = [
  {
    id: "1",
    visit_number: "VIS-000001",
    customer_id: "1",
    customer_name: "Dangote Cement Plc",
    contact_person: "Ahmed Musa",

    visit_type: "Sales",
    related_visit_status: "",
    visit_date: "2026-07-24",
    visit_time: "10:00 AM",
    start_time: "10:00 AM",
    end_time: "",
    duration: "",

    location: "Victoria Island, Lagos",

    visit_objective: "New Business",
    purpose: "Discuss annual AGO supply agreement and pricing.",

    outcome: "",
    next_action: "",
    comment: "",

    visit_result: "",

    follow_up_required: false,
    follow_up_date: "",

    recommendation: "",

    opportunity_identified: false,
    opportunity_value: undefined,
    interested_products: [],

    customer_feedback: "",
    customer_comments: "",

    participants: ["Magdalene Edozie", "Peter Johnson"],

    reminder_date: "2026-07-23",

    attachments: [],

    status: "Scheduled",

    created_by: "Magdalene Edozie",
    created_at: "2026-07-20",

    activities: [
      {
        id: "1",
        action: "Visit Scheduled",
        performedBy: "Magdalene Edozie",
        performedByRole: "Sales Executive",
        performedAt: "2026-07-20 09:10 AM",
      },
    ],
  },

  {
    id: "2",
    visit_number: "VIS-000002",
    customer_id: "2",
    customer_name: "Nestle Nigeria Plc",
    contact_person: "Grace Okafor",

    visit_type: "Follow-up",

    related_visit_id: "1",
    related_visit_number: "VIS-000001",
    related_visit_type: "Sales",
    related_visit_date: "2026-07-24",
    related_visit_status: "Completed",

    visit_date: "2026-07-18",
    visit_time: "02:30 PM",
    start_time: "02:30 PM",
    end_time: "04:15 PM",
    duration: "1 hr 45 mins",

    location: "Agbara Industrial Estate, Ogun",

    visit_objective: "Contract Renewal",
    purpose: "Review fuel supply performance and discuss contract renewal.",

    outcome:
      "Customer expressed satisfaction with deliveries and requested revised pricing for the next quarter.",

    next_action:
      "Prepare revised commercial proposal and schedule negotiation meeting.",

    comment:
      "Meeting was productive. Procurement team requested proposal before month end.",

    visit_result: "Successful",

    follow_up_required: true,
    follow_up_date: "2026-08-01",

    recommendation: "Prepare Quotation",

    opportunity_identified: true,
    opportunity_value: 25000000,
    interested_products: ["AGO", "Lubricants"],

    customer_feedback: "Satisfied",
    customer_comments:
      "Current service has improved significantly compared to last quarter.",

    participants: ["John Doe", "Mary Johnson"],

    reminder_date: "2026-07-31",

    attachments: [
      {
        id: "1",
        name: "Meeting Minutes.pdf",
        url: "#",
      },
      {
        id: "2",
        name: "Pricing Request.pdf",
        url: "#",
      },
    ],

    status: "Completed",

    created_by: "John Doe",
    created_at: "2026-07-15",

    activities: [
      {
        id: "1",
        action: "Visit Scheduled",
        performedBy: "John Doe",
        performedByRole: "Sales Executive",
        performedAt: "2026-07-15 11:15 AM",
      },
      {
        id: "2",
        action: "Visit Completed",
        performedBy: "John Doe",
        performedByRole: "Sales Executive",
        performedAt: "2026-07-18 04:45 PM",
        comment: "Customer interested in expanding monthly purchase volume.",
      },
    ],
  },

  {
    id: "3",
    visit_number: "VIS-000003",
    customer_id: "3",
    customer_name: "Cadbury Nigeria Plc",
    contact_person: "Peace Okafor",

    visit_type: "Complaint",
    related_visit_status: "",

    visit_date: "2026-07-16",
    visit_time: "11:00 AM",
    start_time: "11:00 AM",
    end_time: "12:30 PM",
    duration: "1 hr 30 mins",

    location: "Ikeja, Lagos",

    visit_objective: "Complaint Resolution",
    purpose: "Resolve complaints regarding delayed AGO deliveries.",

    outcome:
      "Customer accepted the explanation but requested improved delivery visibility.",

    next_action:
      "Arrange logistics meeting and provide weekly delivery reports.",

    comment: "Operations team should monitor deliveries for the next 30 days.",

    visit_result: "Partially Successful",

    follow_up_required: true,
    follow_up_date: "2026-07-28",

    recommendation: "Continue Engagement",

    opportunity_identified: false,
    opportunity_value: undefined,
    interested_products: [],

    customer_feedback: "Neutral",
    customer_comments:
      "Customer expects noticeable service improvements before renewing orders.",

    participants: ["Sarah James", "Logistics Manager"],

    reminder_date: "2026-07-27",

    attachments: [
      {
        id: "1",
        name: "Complaint Report.pdf",
        url: "#",
      },
    ],

    status: "Completed",

    created_by: "Sarah James",
    created_at: "2026-07-13",

    activities: [
      {
        id: "1",
        action: "Visit Scheduled",
        performedBy: "Sarah James",
        performedByRole: "Sales Executive",
        performedAt: "2026-07-13 08:40 AM",
      },
      {
        id: "2",
        action: "Visit Conducted",
        performedBy: "Sarah James",
        performedByRole: "Sales Executive",
        performedAt: "2026-07-16 12:20 PM",
      },
      {
        id: "3",
        action: "Follow-up Required",
        performedBy: "CRM Administrator",
        performedByRole: "CRM Administrator",
        performedAt: "2026-07-16 03:15 PM",
        comment:
          "Operations team to provide revised delivery schedule within 48 hours.",
      },
    ],
  },

  {
    id: "4",
    visit_number: "VIS-000004",
    customer_id: "4",
    customer_name: "ABC Logistics Ltd",
    contact_person: "Samuel Ade",

    visit_type: "Courtesy",

    visit_date: "2026-07-14",
    visit_time: "09:30 AM",
    related_visit_status: "",

    location: "Wuse II, Abuja",

    visit_objective: "Relationship Management",
    purpose: "Relationship management visit and introduction of new products.",

    outcome:
      "Visit cancelled at customer's request due to an internal management meeting.",

    next_action: "Reschedule visit for the first week of August.",

    comment:
      "Customer requested a new date because of an executive strategy meeting.",

    visit_result: "Cancelled",

    follow_up_required: true,
    follow_up_date: "2026-08-03",

    recommendation: "Schedule Follow-up",

    opportunity_identified: false,
    opportunity_value: undefined,
    interested_products: [],

    customer_feedback: "",
    customer_comments: "",

    participants: ["Magdalene Edozie"],

    reminder_date: "2026-08-01",

    attachments: [],

    status: "Cancelled",

    created_by: "Magdalene Edozie",
    created_at: "2026-07-10",

    activities: [
      {
        id: "1",
        action: "Visit Scheduled",
        performedBy: "Magdalene Edozie",
        performedByRole: "Sales Executive",
        performedAt: "2026-07-10 02:10 PM",
      },
      {
        id: "2",
        action: "Visit Cancelled",
        performedBy: "Samuel Ade",
        performedByRole: "Customer",
        performedAt: "2026-07-13 05:40 PM",
        comment:
          "Customer requested a new date because of an executive strategy meeting.",
      },
    ],
  },

  {
    id: "5",
    visit_number: "VIS-000005",
    customer_id: "2",
    customer_name: "Nestle Nigeria Plc",
    contact_person: "Oluwaseun Ibrahim",

    visit_type: "Collection",
    related_visit_status: "",

    visit_date: "2026-07-27",
    visit_time: "01:00 PM",
    start_time: "01:00 PM",
    end_time: "",
    duration: "",

    location: "Agbara Industrial Estate, Ogun",

    visit_objective: "Payment Collection",
    purpose: "Collect signed supply agreement and outstanding documents.",

    outcome: "",
    next_action: "",
    comment: "",

    visit_result: "",

    follow_up_required: false,
    follow_up_date: "",

    recommendation: "",

    opportunity_identified: false,
    opportunity_value: undefined,
    interested_products: [],

    customer_feedback: "",
    customer_comments: "",

    participants: ["John Doe"],

    reminder_date: "2026-07-26",

    attachments: [],

    status: "Scheduled",

    created_by: "John Doe",
    created_at: "2026-07-22",

    activities: [
      {
        id: "1",
        action: "Visit Scheduled",
        performedBy: "John Doe",
        performedByRole: "Sales Executive",
        performedAt: "2026-07-22 10:00 AM",
      },
    ],
  },
];

export function useCustomerVisits() {
  return useQuery({
    queryKey: ["customer-visits"],
    queryFn: async () => customerVisits,
  });
}

export function useCustomerContactsByCustomer(customerId?: string) {
  return useQuery({
    queryKey: ["crm", "customer-contacts", customerId],
    enabled: !!customerId,
    queryFn: async () =>
      MOCK_CUSTOMER_CONTACTS.find(
        (contact) => contact.customer_id === customerId,
      ),
  });
}

export function useCustomerVisitDetails(id: string) {
  return useQuery({
    queryKey: ["customer-visit", id],
    queryFn: async () =>
      customerVisits.find((visit) => visit.id === id) ?? null,
  });
}
