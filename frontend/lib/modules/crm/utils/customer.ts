import type { CustomerForm } from "../types";

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[0-9\s\-()]{10,15}$/;

  return phoneRegex.test(phone.trim());
}

export function validateCustomer(form: CustomerForm) {
  const errors: Record<string, string> = {};

  // Customer Information
  if (!form.customerName.trim()) {
    errors.customerName = "Customer name is required.";
  }
  if (!form.entityType) {
    errors.entityType = "Entity type is required.";
  }
  if (!form.position) {
    errors.position = "Entity type is required.";
  }
  if (!form.role) {
    errors.role = "Entity type is required.";
  }
  if (!form.preferredChannel) {
    errors.preferredChannel = "Entity type is required.";
  }
  if (!form.category) {
    errors.category = "Customer category is required.";
  }

  if (!form.companyEmail.trim()) {
    errors.companyEmail = "Company email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.companyEmail)) {
    errors.companyEmail = "Enter a valid company email.";
  }

  // Business Information (Company only)
  if (form.entityType === "company") {
    if (!form.rcNumber.trim()) {
      errors.rcNumber = "RC Number is required.";
    }

    // Optional format validation
    if (form.tin && !/^[A-Za-z0-9-]+$/.test(form.tin)) {
      errors.tin = "Invalid TIN.";
    }

    if (form.vatNumber && !/^[A-Za-z0-9-]+$/.test(form.vatNumber)) {
      errors.vatNumber = "Invalid VAT Number.";
    }
  }

  // Primary Contact
  if (!form.department.trim()) {
    errors.department = "Department is required.";
  }

  // Primary Contact
  if (!form.contactPerson.trim()) {
    errors.contactPerson = "Contact person is required.";
  }

  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email.";
  }

  if (!form.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (!validatePhoneNumber(form.phone)) {
    errors.phone = "Enter a valid phone number.";
  }

  if (form.alternatePhone?.trim()) {
    if (!validatePhoneNumber(form.alternatePhone)) {
      errors.alternatePhone = "Enter a valid alternate phone number.";
    }

    if (form.alternatePhone === form.phone) {
      errors.alternatePhone =
        "Alternate phone cannot be the same as primary phone.";
    }
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
    errors.addressLine1 = "Address is required.";
  }

  // Account Management
  if (!form.customerType) {
    errors.customerType = "Customer type is required.";
  }

  if (!form.salesContact) {
    errors.salesContact = "Sales contact is required.";
  }

  if (!form.referrerType) {
    errors.referrerType = "Referrer type is required.";
  }
  if (!form.industry) {
    errors.industry = "Industry is required.";
  }
  if (!form.referrerId.trim()) {
    errors.referrerId = "Referrer is required.";
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
    customer_name: form.customerName,

    entity_type: form.entityType,
    category: form.category,

    company_email: form.companyEmail,

    rc_number: form.rcNumber || null,
    tin: form.tin || null,
    vat_number: form.vatNumber || null,
    industry: form.industry || null,

    customer_type: form.customerType,

    sales_contact: form.salesContact,
    referrer_type: form.referrerType || null,
    referrer_id: form.referrerId || null,

    contact_person: form.contactPerson,
    department: form.department || null,

    email: form.email,
    phone: form.phone,
    alternate_phone: form.alternatePhone || null,

    country: form.country,
    state: form.state || null,
    city: form.city || null,

    address_line1: form.addressLine1,
    address_line2: form.addressLine2 || null,
    postal_code: form.postalCode || null,

    preferred_products: form.preferredProducts,
    position: form.position,
    role: form.role,
    preferred_channel: form.preferredChannel,

    supply_method: form.supplyMethod || null,
    estimated_monthly_demand: form.estimatedMonthlyDemand || null,

    internal_notes: form.internalNotes || null,

    status,
  };
}
