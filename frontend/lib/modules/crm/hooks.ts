import { useQuery } from "@tanstack/react-query";

import type { CustomerOnboarding } from "./types";

const MOCK_CUSTOMER_ONBOARDING: CustomerOnboarding[] = [
  {
    id: "0",
    onboarding_number: "ONB-000000",

    customer_name: "BUA Foods Plc",
    entity_type: "company",
    category: "industrial",

    rc_number: "RC7788990",
    tin: "TIN-44556677",
    vat_number: "VAT-88990011",
    industry: "Food Manufacturing",

    contact_person: "Chinedu Eze",
    designation: "Procurement Officer",
    email: "chinedu.eze@buafoods.com",
    phone: "+2348123456789",
    alternate_phone: "+2348091122334",

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
    customer_status: "inactive",
    customer_name: "Dangote Cement Plc",
    entity_type: "company",
    category: "industrial",

    rc_number: "RC1234567",
    tin: "TIN-90034566",
    vat_number: "VAT-56789345",
    industry: "Manufacturing",

    contact_person: "Ahmed Musa",
    designation: "Procurement Manager",
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

    rc_number: "RC5566778",
    tin: "TIN-12345678",
    vat_number: "VAT-66778899",
    industry: "Food & Beverage",

    contact_person: "Grace Okafor",
    designation: "Supply Chain Manager",
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

    status: "acknowledged",

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

    rc_number: "RC9001122",
    tin: "TIN-88112233",
    vat_number: "VAT-99112233",
    industry: "Transportation",

    contact_person: "Samuel Ade",
    designation: "Managing Director",
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
      MOCK_CUSTOMER_ONBOARDING.find((customer) => customer.id === id),
  });
}
