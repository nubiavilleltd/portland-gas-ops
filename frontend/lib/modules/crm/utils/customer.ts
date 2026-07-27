import type { CustomerForm } from "../types";

export function validateCustomer(form: CustomerForm) {
  const errors: Record<string, string> = {};

  // Customer Information
  if (!form.customerName.trim()) {
    errors.customer_name = "Customer name is required.";
  }

  if (!form.entityType) {
    errors.entity_type = "Entity type is required.";
  }

  if (!form.category) {
    errors.category = "Customer category is required.";
  }

  if (!form.companyEmail.trim()) {
    errors.company_email = "Company email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.companyEmail)) {
    errors.company_email = "Enter a valid company email.";
  }

  // Business Information (Company only)
  if (form.entityType === "company") {
    if (!form.rcNumber.trim()) {
      errors.rc_number = "RC Number is required.";
    }

    // Optional format validation
    if (form.tin && !/^[A-Za-z0-9-]+$/.test(form.tin)) {
      errors.tin = "Invalid TIN.";
    }

    if (form.vatNumber && !/^[A-Za-z0-9-]+$/.test(form.vatNumber)) {
      errors.vat_number = "Invalid VAT Number.";
    }
  }

  // Primary Contact
  if (!form.contactPerson.trim()) {
    errors.contact_person = "Contact person is required.";
  }

  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email.";
  }

  if (!form.phone.trim()) {
    errors.phone = "Phone number is required.";
  }

  // Address
  if (!form.country.trim()) {
    errors.country = "Country is required.";
  }

  if (!form.state.trim()) {
    errors.state = "State is required.";
  }

  if (!form.city.trim()) {
    errors.city = "City is required.";
  }

  if (!form.addressLine1.trim()) {
    errors.address_line1 = "Address is required.";
  }

  // Account Management
  if (!form.customerType) {
    errors.customer_type = "Customer type is required.";
  }

  if (!form.salesContact) {
    errors.sales_contact = "Sales contact is required.";
  }

  if (!form.referrerType) {
    errors.referrer_type = "Referrer type is required.";
  }

  if (!form.referrerId.trim()) {
    errors.referrer_id = "Referrer is required.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildCustomerPayload(
  form: CustomerForm,
  status: "draft" | "active" | "inactive",
) {
  return {
    customerName: form.customerName,
    entity_type: form.entityType,
    category: form.category,
    company_email: form.companyEmail,

    rc_number: form.rcNumber || null,
    tin: form.tin || null,
    vat_number: form.vatNumber || null,
    industry: form.industry || null,

    customer_type: form.customerType,
    sales_contact: String(form.salesContact),

    referrer_type: form.referrerType,
    referrer_id: form.referrerId,

    contact: {
      first_name: form.contactPerson,
      department: form.department,
      email: form.email,
      phone: form.phone,
      alternate_phone: form.alternatePhone || null,
    },

    address: {
      country: form.country,
      state: form.state,
      city: form.city,
      address_line1: form.addressLine1,
      address_line2: form.addressLine2 || null,
      postal_code: form.postalCode || null,
    },

    commercial: {
      preferred_products: form.preferredProducts,
      supply_method: form.supplyMethod,
      estimated_monthly_demand: form.estimatedMonthlyDemand,
    },

    internal_notes: form.internalNotes,
    status,
  };
}
