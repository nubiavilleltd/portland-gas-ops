import { useQuery } from "@tanstack/react-query";

import type {
  CustomerOnboarding,
  CustomerContact,
  CustomerVisit,
} from "./types";

const MOCK_CUSTOMER_ONBOARDING: CustomerOnboarding[] = [
  {
    id: "0",
    onboarding_number: "ONB-000000",
    company_email: "buafoods@email.com",
    customer_name: "BUA Foods Plc",
    entity_type: "company",
    category: "industrial",
    referrer: "Maggy",
    rc_number: "RC7788990",
    tin: "TIN-44556677",
    vat_number: "VAT-88990011",
    industry: "Food Manufacturing",
    sales_contact: "Chinedu Eze",
    contact_person: "Chinedu Eze",
    department: "Procurement Officer",
    email: "chinedu.eze@buafoods.com",
    phone: "+2348123456789",
    alternate_phone: "+2348091122334",
    role: "",
    position: "",
    country: "Nigeria",
    state: "Lagos",
    city: "Apapa",
    address_line1: "12 Creek Road",
    address_line2: "Warehouse Complex",
    postal_code: "101254",

    preferred_products: ["AGO", "PMS"],

    supply_method: "Bulk Delivery",
    estimated_monthly_demand: "450,000 Litres",

    internal_notes:
      "Customer onboarding saved as draft pending completion of supporting documents.",

    submitted_by: "Magdalene Princess",
    submitted_at: "2026-07-14",

    status: "draft",
    customer_status: "inactive",

    activities: [
      {
        id: "1",
        action: "Draft_created",
        performedBy: "Magdalene Princess",
        performedByRole: "Sales Executive",
        performedAt: "2026-07-14 08:45",
      },
      {
        id: "2",
        action: "Draft_created",
        performedBy: "Magdalene Princess",
        performedByRole: "Sales Executive",
        performedAt: "2026-07-14 09:10",
        comment: "Waiting for CAC and VAT documents before submission.",
      },
    ],

    attachments: [
      {
        id: "1",
        documentType: "business_logo",
        fileName: "BUA Logo.png",
        fileUrl: "#",
        uploadedBy: "Magdalene Princess",
        uploadedAt: "2026-07-14",
      },
    ],
  },
  {
    id: "1",
    onboarding_number: "ONB-000001",
    company_email: "dangote@email.com",
    customer_status: "inactive",
    customer_name: "Dangote Cement Plc",
    entity_type: "company",
    category: "industrial",
    referrer: "Maggy",
    role: "",
    position: "",
    rc_number: "RC1234567",
    tin: "TIN-90034566",
    vat_number: "VAT-56789345",
    industry: "Manufacturing",
    sales_contact: "Ahmed Musa",

    contact_person: "Ahmed Musa",
    department: "Procurement Manager",
    email: "ahmed.musa@dangote.com",
    phone: "+2348012345678",
    alternate_phone: "+2348098765432",

    country: "Nigeria",
    state: "Lagos",
    city: "Ikoyi",
    address_line1: "15 Alfred Rewane Road",
    address_line2: "3rd Floor",
    postal_code: "101233",

    preferred_products: ["AGO", "PMS", "Lubricants"],
    supply_method: "Bulk Supply",
    estimated_monthly_demand: "600,000 Litres",

    internal_notes:
      "Large industrial customer requiring dedicated account management.",

    submitted_by: "Magdalene Princess",
    submitted_at: "2026-07-13",

    status: "submitted",

    activities: [
      {
        id: "1",
        action: "Draft_created",
        performedBy: "Magdalene Princess",
        performedAt: "2026-07-13 09:00",
        performedByRole: "Sales Executive",
      },
      {
        id: "2",
        action: "Submitted",
        performedBy: "Magdalene Princess",
        performedByRole: "Sales Executive",
        performedAt: "2026-07-13 09:12",
      },
    ],

    attachments: [
      {
        id: "1",
        documentType: "cac_certificate",
        fileName: "CAC Certificate.pdf",
        fileUrl: "#",
        uploadedBy: "Magdalene Princess",
        uploadedAt: "2026-07-13",
      },
      {
        id: "2",
        documentType: "tin_certificate",
        fileName: "TIN Certificate.pdf",
        fileUrl: "#",
        uploadedBy: "Magdalene Princess",
        uploadedAt: "2026-07-13",
      },
      {
        id: "3",
        documentType: "vat_certificate",
        fileName: "VAT Certificate.pdf",
        fileUrl: "#",
        uploadedBy: "Magdalene Princess",
        uploadedAt: "2026-07-13",
      },
      {
        id: "4",
        documentType: "business_logo",
        fileName: "Logo.png",
        fileUrl: "#",
        uploadedBy: "Magdalene Princess",
        uploadedAt: "2026-07-13",
      },
    ],
  },

  {
    id: "2",
    onboarding_number: "ONB-000002",
    customer_status: "active",
    customer_name: "Nestle Nigeria Plc",
    entity_type: "company",
    category: "retail",
    referrer: "Princess",
    role: "",
    position: "",
    company_email: "nestlenigeria@email.com",
    rc_number: "RC5566778",
    tin: "TIN-12345678",
    vat_number: "VAT-66778899",
    industry: "Food & Beverage",
    sales_contact: "Grace Okafor",

    contact_person: "Grace Okafor",
    department: "Supply Chain Manager",
    email: "grace.okafor@nestle.com",
    phone: "+2348033334444",
    alternate_phone: "+2348055556666",

    country: "Nigeria",
    state: "Ogun",
    city: "Agbara",
    address_line1: "Industrial Estate",
    address_line2: "",
    postal_code: "112104",

    preferred_products: ["AGO", "LPFO"],

    supply_method: "Truck Delivery",
    estimated_monthly_demand: "900,000 Litres",

    internal_notes: "Priority customer. Monthly contract in progress.",

    submitted_by: "John Doe",
    submitted_at: "2026-07-11",

    status: "active",

    activities: [
      {
        id: "1",
        action: "Submitted",
        performedBy: "John Doe",
        performedByRole: "Sales Executive",
        performedAt: "2026-07-11 08:15",
      },
      {
        id: "2",
        action: "Acknowledged",
        performedBy: "CRM Administrator",
        performedByRole: "CRM Admin",
        performedAt: "2026-07-11 14:32",
      },
    ],

    attachments: [
      {
        id: "1",
        documentType: "cac_certificate",
        fileName: "CAC.pdf",
        fileUrl: "#",
        uploadedBy: "John Doe",
        uploadedAt: "2026-07-11",
      },
    ],
  },

  {
    id: "3",
    onboarding_number: "ONB-000003",
    customer_status: "inactive",
    customer_name: "ABC Logistics Ltd",
    entity_type: "company",
    category: "government",
    company_email: "nestlenigeria@email.com",
    referrer: "Maggy",
    sales_contact: "Samuel Ade",
    role: "",
    position: "",
    rc_number: "RC9001122",
    tin: "TIN-88112233",
    vat_number: "VAT-99112233",
    industry: "Transportation",

    contact_person: "Samuel Ade",
    department: "Managing Director",
    email: "samuel@abclogistics.com",
    phone: "+2347012345678",
    alternate_phone: "",

    country: "Nigeria",
    state: "Abuja",
    city: "Wuse",
    address_line1: "Plot 45 Aminu Kano Crescent",
    address_line2: "",
    postal_code: "900211",

    preferred_products: ["Diesel"],

    supply_method: "Retail Pickup",
    estimated_monthly_demand: "120,000 Litres",

    internal_notes: "Returned due to incomplete VAT documentation.",

    submitted_by: "Sarah James",
    submitted_at: "2026-07-10",

    status: "returned",

    activities: [
      {
        id: "1",
        action: "Submitted",
        performedBy: "Sarah James",
        performedByRole: "Sales Executive",
        performedAt: "2026-07-10 10:20",
      },
      {
        id: "2",
        action: "Returned",
        performedBy: "CRM Administrator",
        performedByRole: "CRM Admin",
        performedAt: "2026-07-10 15:18",
        comment: "VAT certificate missing.",
      },
    ],

    attachments: [],
  },
];
export function useCustomerOnboarding() {
  return useQuery({
    queryKey: ["crm", "customer-onboarding"],
    queryFn: async () => MOCK_CUSTOMER_ONBOARDING,
  });
}

export function useCustomerOnboardingDetails(id: string) {
  return useQuery({
    queryKey: ["crm", "customer-onboarding", id],

    queryFn: async () =>
      MOCK_CUSTOMER_ONBOARDING.find((customer) => customer.id === id) ?? null,
  });
}

export const MOCK_CUSTOMER_CONTACTS: CustomerContact[] = [
  {
    id: "1",
    contact_number: "CNT-000001",

    customer_id: "1",
    customer_name: "Dangote Cement Plc",

    primary_contact: {
      id: "P1",
      status: "inactive",
      first_name: "Ahmed",
      last_name: "Musa",
      position: "",
      role: "",
      is_primary: true,
      email: "ahmed@dangote.com",
      phone: "+2348012345678",
      alternate_phone: "+2348099999999",
      department: "Procurement",
      preferred_channel: "Email",
    },

    additional_contacts: [
      // {
      //   id: "A1",
      //   first_name: "Fatima",
      //   last_name: "Ibrahim",
      //   is_primary: false,
      //   status: "active",
      //   email: "fatima@dangote.com",
      //   phone: "+2348011111111",
      //   alternate_phone: "",
      //   department: "Finance",
      //   preferred_channel: "Email",
      // },
      // {
      //   id: "A2",
      //   first_name: "Peter",
      //   last_name: "Okoro",
      //   is_primary: false,
      //   status: "active",
      //   email: "peter.okoro@dangote.com",
      //   phone: "+2348022222222",
      //   alternate_phone: "+2348033333333",
      //   department: "Operations",
      //   preferred_channel: "Phone",
      // },
    ],

    submitted_by: "Magdalene Princess",
    submitted_at: "2026-07-15",

    status: "inactive",

    attachments: [],

    activities: [
      {
        id: "1",
        action: "Submitted",
        performedBy: "Magdalene Princess",
        performedByRole: "Sales Executive",
        performedAt: "2026-07-15 09:10",
      },
      {
        id: "2",
        action: "Updated",
        performedBy: "CRM Administrator",
        performedByRole: "CRM Administrator",
        performedAt: "2026-07-15 11:45",
      },
    ],
  },

  {
    id: "2",
    contact_number: "CNT-000002",

    customer_id: "2",
    customer_name: "Nestle Nigeria Plc",

    primary_contact: {
      id: "P1",
      position: "",
      role: "",
      first_name: "Grace",
      last_name: "Okafor",
      status: "active",
      is_primary: true,
      email: "grace@nestle.com",

      phone: "+2348033334444",
      alternate_phone: "",

      department: "Supply Chain",

      preferred_channel: "Phone",
    },

    additional_contacts: [
      {
        id: "Z1",

        first_name: "Oluwaseun",
        last_name: "Ibrahim",
        is_primary: false,
        status: "active",
        email: "ibrahim@nestle.com",

        phone: "+2348011111111",
        alternate_phone: "",
        position: "",
        role: "",
        department: "Finance",

        preferred_channel: "Email",
      },
      {
        id: "Y1",
        position: "",
        role: "",
        first_name: "Omololu",
        last_name: "Ibrahim",
        is_primary: false,
        status: "active",
        email: "ibrahim@nestle.com",

        phone: "+2348011111111",
        alternate_phone: "",

        department: "Finance",

        preferred_channel: "Email",
      },
      {
        id: "F1",
        position: "",
        role: "",
        first_name: "Felix",
        last_name: "Ibrahim",
        is_primary: false,
        status: "active",
        email: "ibrahim@nestle.com",

        phone: "+2348011111111",
        alternate_phone: "",

        department: "Finance",

        preferred_channel: "Email",
      },
    ],

    submitted_by: "John Doe",
    submitted_at: "2026-07-12",

    status: "active",

    attachments: [],

    activities: [
      {
        id: "1",
        action: "Submitted",
        performedBy: "John Doe",
        performedByRole: "Sales Executive",
        performedAt: "2026-07-12 10:00",
      },
    ],
  },

  {
    id: "3",
    contact_number: "CNT-000002",

    customer_id: "3",
    customer_name: "Cadbury Nigeria Plc",

    primary_contact: {
      id: "P1",
      position: "",
      role: "",
      first_name: "Peace",
      last_name: "Okafor",
      status: "inactive",
      is_primary: true,
      email: "peace@cadbury.com",

      phone: "+2348033334444",
      alternate_phone: "",

      department: "Supply Chain",

      preferred_channel: "Phone",
    },

    additional_contacts: [],

    submitted_by: "John Doe",
    submitted_at: "2026-07-12",

    status: "inactive",

    attachments: [],

    activities: [
      {
        id: "1",
        action: "Submitted",
        performedBy: "John Doe",
        performedByRole: "Sales Executive",
        performedAt: "2026-07-12 10:00",
      },
    ],
  },
];

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

    queryFn: async () =>
      MOCK_CUSTOMER_ONBOARDING.filter(
        (customer) => customer.customer_status === "active",
      ),
  });
}

export function useCustomerDetails(id: string) {
  return useQuery({
    queryKey: ["crm", "customers", id],

    queryFn: async () =>
      MOCK_CUSTOMER_ONBOARDING.find(
        (customer) =>
          customer.id === id && customer.customer_status === "active",
      ),
  });
}

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
