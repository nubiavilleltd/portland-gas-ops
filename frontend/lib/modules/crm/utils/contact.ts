import type {
  ContactForm,
  ContactPerson,
  CustomerContact,
} from "@/lib/modules/crm";

export function validateContacts(customerId: string, contacts: ContactForm[]) {
  const errors: Record<string, string> = {};

  if (!customerId) {
    errors.customerId = "Customer is required.";
  }

  contacts.forEach((contact, index) => {
    if (!contact.firstName.trim()) {
      errors[`firstName-${index}`] = "First name is required.";
    }

    if (!contact.lastName.trim()) {
      errors[`lastName-${index}`] = "Last name is required.";
    }

    if (!contact.email.trim()) {
      errors[`email-${index}`] = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      errors[`email-${index}`] = "Enter a valid email.";
    }

    if (!contact.phone.trim()) {
      errors[`phone-${index}`] = "Phone number is required.";
    }

    if (!contact.department.trim()) {
      errors[`department-${index}`] = "Department is required.";
    }

    if (!contact.position.trim()) {
      errors[`position-${index}`] = "Position is required.";
    }

    if (!contact.role.trim()) {
      errors[`role-${index}`] = "Role is required.";
    }

    if (!contact.preferred_channel.trim()) {
      errors[`preferred_channel-${index}`] = "Preferred channel is required.";
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildContactsPayload(contacts: ContactForm[]) {
  return {
    additional_contacts: contacts.map((contact) => ({
      first_name: contact.firstName,
      last_name: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      alternate_phone: contact.alternatePhone,
      department: contact.department,
      position: contact.position,
      role: contact.role,
      preferred_channel: contact.preferred_channel,
    })),
  };
}

export function validateContacts2(
  primary: CustomerContact,
  additional: ContactPerson[],
) {
  const errors: Record<string, string> = {};

  // -------------------------
  // Primary Contact
  // -------------------------
  if (!primary.first_name?.trim())
    errors.primaryFirstName = "First name is required";

  if (!primary.last_name?.trim())
    errors.primaryLastName = "Last name is required";

  if (!primary.email?.trim()) {
    errors.primaryEmail = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primary.email)) {
    errors.primaryEmail = "Enter a valid email";
  }

  if (!primary.phone?.trim()) errors.primaryPhone = "Phone number is required";

  if (!primary.department?.trim())
    errors.primaryDepartment = "Department is required";

  if (!primary.position?.trim())
    errors.primaryPosition = "Position is required";

  if (!primary.role?.trim()) errors.primaryRole = "Role is required";

  if (!primary.preferred_channel?.trim())
    errors.primaryPreferredChannel = "Preferred channel is required";

  // -------------------------
  // Additional Contacts
  // -------------------------
  additional.forEach((contact, index) => {
    if (!contact.first_name?.trim())
      errors[`additional_${index}_firstName`] = "First name is required";

    if (!contact.last_name?.trim())
      errors[`additional_${index}_lastName`] = "Last name is required";

    if (!contact.email?.trim()) {
      errors[`additional_${index}_email`] = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      errors[`additional_${index}_email`] = "Enter a valid email";
    }

    if (!contact.phone?.trim())
      errors[`additional_${index}_phone`] = "Phone number is required";

    if (!contact.department?.trim())
      errors[`additional_${index}_department`] = "Department is required";

    if (!contact.position?.trim())
      errors[`additional_${index}_position`] = "Position is required";

    if (!contact.role?.trim())
      errors[`additional_${index}_role`] = "Role is required";

    if (!contact.preferred_channel?.trim())
      errors[`additional_${index}_preferred_channel`] =
        "Preferred channel is required";
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildUpdateContactsPayload(form: CustomerContact) {
  return {
    primary_contact: {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone,
      alternate_phone: form.alternate_phone,
      department: form.department,
      position: form.position,
      role: form.role,
      preferred_channel: form.preferred_channel,
    },

    additional_contacts: form.additional_contacts.map((contact) => ({
      id: contact.id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      alternate_phone: contact.alternate_phone,
      department: contact.department,
      position: contact.position,
      role: contact.role,
      preferred_channel: contact.preferred_channel,
    })),
  };
}
