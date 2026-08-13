import type { CustomerForm } from "../types";

const MAX_LENGTHS = {
  customerName: 200,
  companyEmail: 150,
  rcNumber: 50,
  tin: 50,
  vatNumber: 50,
  industry: 100,
  contactPerson: 150,
  department: 100,
  email: 150,
  phone: 30,
  alternatePhone: 30,
  country: 100,
  state: 100,
  city: 100,
  addressLine1: 255,
  addressLine2: 255,
  postalCode: 20,
  supplyMethod: 100,
  estimatedMonthlyDemand: 100,
  position: 100,
  role: 100,
  preferredChannel: 20,
  referrerId: 150,
} as const;

const ENTITY_TYPES = ["company", "individual"] as const;
const CUSTOMER_CATEGORIES = [
  "retail",
  "industrial",
  "government",
  "distributor",
] as const;

const CUSTOMER_TYPES = ["potential", "purchasing"] as const;

const REFERRER_TYPES = [
  "employee",
  "customer",
  "partner",
  "consultant",
  "marketing",
] as const;

const PREFERRED_CHANNELS = ["email", "phone", "sms", "whatsapp"] as const;

function isTooLong(value: string | null | undefined, max: number): boolean {
  return !!value && value.trim().length > max;
}

function isOneOf<T extends readonly string[]>(
  value: string,
  options: T,
): boolean {
  return options.includes(value);
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePhoneNumber(phone: string): boolean {
  const value = phone.trim();

  if (!value) {
    return false;
  }

  // Only allow digits, spaces, +, -, and parentheses.
  if (!/^[+]?[0-9\s()\-]+$/.test(value)) {
    return false;
  }

  // + can only appear at the beginning.
  if (value.includes("+") && !value.startsWith("+")) {
    return false;
  }

  // Only one +.
  if ((value.match(/\+/g) || []).length > 1) {
    return false;
  }

  // Count actual digits.
  const digitsOnly = value.replace(/\D/g, "");

  // Database allows 30 characters, but we also require
  // a sensible phone number containing 10-15 digits.
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return false;
  }

  return value.length <= MAX_LENGTHS.phone;
}

export function validatePostalCode(postalCode: string): boolean {
  const value = postalCode.trim();

  // Optional field.
  if (!value) {
    return true;
  }

  // Database allows 20 chars, but postal codes should be digits only.
  return /^\d{1,20}$/.test(value);
}

export function validateCustomer(form: CustomerForm) {
  const errors: Record<string, string> = {};

  // ============================================================
  // CUSTOMER INFORMATION
  // ============================================================

  const customerName = form.customerName.trim();

  if (!customerName) {
    errors.customerName = "Customer name is required.";
  } else if (customerName.length > MAX_LENGTHS.customerName) {
    errors.customerName = `Customer name cannot exceed ${MAX_LENGTHS.customerName} characters.`;
  }

  if (!form.entityType) {
    errors.entityType = "Entity type is required.";
  } else if (!isOneOf(form.entityType, ENTITY_TYPES)) {
    errors.entityType = "Select a valid entity type.";
  }

  if (!form.category) {
    errors.category = "Customer category is required.";
  } else if (!isOneOf(form.category, CUSTOMER_CATEGORIES)) {
    errors.category = "Select a valid customer category.";
  }

  const companyEmail = form.companyEmail.trim();

  if (!companyEmail) {
    errors.companyEmail = "Company email is required.";
  } else if (companyEmail.length > MAX_LENGTHS.companyEmail) {
    errors.companyEmail = `Company email cannot exceed ${MAX_LENGTHS.companyEmail} characters.`;
  } else if (!validateEmail(companyEmail)) {
    errors.companyEmail = "Enter a valid company email address.";
  }

  // ============================================================
  // BUSINESS INFORMATION
  // ============================================================

  if (form.entityType === "company") {
    const rcNumber = form.rcNumber.trim();

    if (!rcNumber) {
      errors.rcNumber = "RC Number is required for companies.";
    } else if (rcNumber.length > MAX_LENGTHS.rcNumber) {
      errors.rcNumber = `RC Number cannot exceed ${MAX_LENGTHS.rcNumber} characters.`;
    }

    const tin = form.tin.trim();

    if (tin && tin.length > MAX_LENGTHS.tin) {
      errors.tin = `TIN cannot exceed ${MAX_LENGTHS.tin} characters.`;
    } else if (tin && !/^[A-Za-z0-9-]+$/.test(tin)) {
      errors.tin = "TIN can only contain letters, numbers, and hyphens.";
    }

    const vatNumber = form.vatNumber.trim();

    if (vatNumber && vatNumber.length > MAX_LENGTHS.vatNumber) {
      errors.vatNumber = `VAT Number cannot exceed ${MAX_LENGTHS.vatNumber} characters.`;
    } else if (vatNumber && !/^[A-Za-z0-9-]+$/.test(vatNumber)) {
      errors.vatNumber =
        "VAT Number can only contain letters, numbers, and hyphens.";
    }
  }

  // Industry is currently required by your form logic.
  const industry = form.industry.trim();

  if (!industry) {
    errors.industry = "Industry is required.";
  } else if (industry.length > MAX_LENGTHS.industry) {
    errors.industry = `Industry cannot exceed ${MAX_LENGTHS.industry} characters.`;
  }

  // ============================================================
  // PRIMARY CONTACT
  // ============================================================

  const contactPerson = form.contactPerson.trim();

  if (!contactPerson) {
    errors.contactPerson = "Contact person is required.";
  } else if (contactPerson.length > MAX_LENGTHS.contactPerson) {
    errors.contactPerson = `Contact person cannot exceed ${MAX_LENGTHS.contactPerson} characters.`;
  }

  const department = form.department.trim();

  if (!department) {
    errors.department = "Department is required.";
  } else if (department.length > MAX_LENGTHS.department) {
    errors.department = `Department cannot exceed ${MAX_LENGTHS.department} characters.`;
  }

  const email = form.email.trim();

  if (!email) {
    errors.email = "Email is required.";
  } else if (email.length > MAX_LENGTHS.email) {
    errors.email = `Email cannot exceed ${MAX_LENGTHS.email} characters.`;
  } else if (!validateEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  const phone = form.phone.trim();

  if (!phone) {
    errors.phone = "Phone number is required.";
  } else if (phone.length > MAX_LENGTHS.phone) {
    errors.phone = `Phone number cannot exceed ${MAX_LENGTHS.phone} characters.`;
  } else if (!validatePhoneNumber(phone)) {
    errors.phone = "Enter a valid phone number with 10-15 digits.";
  }
  if (form.alternatePhone) {
    const alternatePhone = form.alternatePhone.trim();

    if (alternatePhone) {
      if (alternatePhone.length > MAX_LENGTHS.alternatePhone) {
        errors.alternatePhone = `Alternate phone cannot exceed ${MAX_LENGTHS.alternatePhone} characters.`;
      } else if (!validatePhoneNumber(alternatePhone)) {
        errors.alternatePhone =
          "Enter a valid alternate phone number with 10-15 digits.";
      } else if (alternatePhone === phone) {
        errors.alternatePhone =
          "Alternate phone cannot be the same as primary phone.";
      }
    }
  }
  const position = form.position.trim();

  if (position && position.length > MAX_LENGTHS.position) {
    errors.position = `Position cannot exceed ${MAX_LENGTHS.position} characters.`;
  }

  const role = form.role.trim();

  if (!role) {
    errors.role = "Role is required.";
  } else if (role.length > MAX_LENGTHS.role) {
    errors.role = `Role cannot exceed ${MAX_LENGTHS.role} characters.`;
  }

  if (!form.preferredChannel) {
    errors.preferredChannel = "Preferred channel is required.";
  } else if (!isOneOf(form.preferredChannel, PREFERRED_CHANNELS)) {
    errors.preferredChannel = "Select a valid preferred channel.";
  } else if (form.preferredChannel.length > MAX_LENGTHS.preferredChannel) {
    errors.preferredChannel = `Preferred channel cannot exceed ${MAX_LENGTHS.preferredChannel} characters.`;
  }

  // ============================================================
  // ADDRESS
  // ============================================================

  const country = form.country.trim();

  if (!country) {
    errors.country = "Country is required.";
  } else if (country.length > MAX_LENGTHS.country) {
    errors.country = `Country cannot exceed ${MAX_LENGTHS.country} characters.`;
  }

  const state = form.state.trim();

  if (!state) {
    errors.state = "State is required.";
  } else if (state.length > MAX_LENGTHS.state) {
    errors.state = `State cannot exceed ${MAX_LENGTHS.state} characters.`;
  }

  const city = form.city.trim();

  if (!city) {
    errors.city = "City is required.";
  } else if (city.length > MAX_LENGTHS.city) {
    errors.city = `City cannot exceed ${MAX_LENGTHS.city} characters.`;
  }

  const addressLine1 = form.addressLine1.trim();

  if (!addressLine1) {
    errors.addressLine1 = "Address is required.";
  } else if (addressLine1.length > MAX_LENGTHS.addressLine1) {
    errors.addressLine1 = `Address cannot exceed ${MAX_LENGTHS.addressLine1} characters.`;
  }

  const addressLine2 = form.addressLine2.trim();

  if (addressLine2.length > MAX_LENGTHS.addressLine2) {
    errors.addressLine2 = `Address Line 2 cannot exceed ${MAX_LENGTHS.addressLine2} characters.`;
  }

  const postalCode = form.postalCode.trim();

  if (postalCode && !validatePostalCode(postalCode)) {
    errors.postalCode =
      "Postal code must contain digits only and cannot exceed 20 digits.";
  }

  // ============================================================
  // ACCOUNT MANAGEMENT
  // ============================================================

  if (!form.customerType) {
    errors.customerType = "Customer type is required.";
  } else if (!isOneOf(form.customerType, CUSTOMER_TYPES)) {
    errors.customerType = "Select a valid customer type.";
  }

  if (!form.salesContact) {
    errors.salesContact = "Sales contact is required.";
  }

  if (!form.referrerType) {
    errors.referrerType = "Referrer type is required.";
  } else if (!isOneOf(form.referrerType, REFERRER_TYPES)) {
    errors.referrerType = "Select a valid referrer type.";
  }

  const referrerId = form.referrerId.trim();

  if (!referrerId) {
    errors.referrerId = "Referrer is required.";
  } else if (referrerId.length > MAX_LENGTHS.referrerId) {
    errors.referrerId = `Referrer cannot exceed ${MAX_LENGTHS.referrerId} characters.`;
  }

  // ============================================================
  // COMMERCIAL INFORMATION
  // ============================================================

  const supplyMethod = form.supplyMethod.trim();

  if (supplyMethod && supplyMethod.length > MAX_LENGTHS.supplyMethod) {
    errors.supplyMethod = `Supply method cannot exceed ${MAX_LENGTHS.supplyMethod} characters.`;
  }

  const estimatedDemand = form.estimatedMonthlyDemand.trim();

  if (
    estimatedDemand &&
    estimatedDemand.length > MAX_LENGTHS.estimatedMonthlyDemand
  ) {
    errors.estimatedMonthlyDemand = `Estimated monthly demand cannot exceed ${MAX_LENGTHS.estimatedMonthlyDemand} characters.`;
  }

  // ============================================================
  // INTERNAL NOTES
  // ============================================================

  // TEXT has no meaningful VARCHAR-style limit here.
  // We still reject absurdly large input on the frontend.
  if (form.internalNotes.length > 10000) {
    errors.internalNotes = "Internal notes cannot exceed 10,000 characters.";
  }

  // ============================================================
  // RESULT
  // ============================================================

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
    industry:
      form.industry === "other" ? form.otherIndustry.trim() : form.industry,
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
