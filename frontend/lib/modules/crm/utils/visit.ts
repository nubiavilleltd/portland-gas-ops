// lib/modules/crm/utils/visit.ts

import { UpdateCustomerVisitPayload } from "../types";

/**
 * Database limits based on customer_visits table
 *
 * visit_type       VARCHAR(50)
 * location         VARCHAR(255)
 * purpose          TEXT
 * participants     TEXT
 * comment          TEXT
 * etc.
 */

const VISIT_TYPE_MAX = 50;
const LOCATION_MAX = 255;

// Keep reasonable frontend limits for TEXT fields.
// The DB allows much more, but there's usually no reason for a user
// to paste extremely large amounts of text into these fields.
const PURPOSE_MAX = 5000;
const PARTICIPANTS_MAX = 2000;
const VISIT_OBJECTIVE_MAX = 1000;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function isValidDate(value: string): boolean {
  if (!value) return false;

  const date = new Date(value);

  return !Number.isNaN(date.getTime());
}

function isValidDateOnly(value: string): boolean {
  if (!value) return false;

  // Expect YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime());
}

function isValidUUID(value: string): boolean {
  if (!value) return false;

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function hasExceededLimit(
  value: string | null | undefined,
  max: number,
): boolean {
  return !!value && value.trim().length > max;
}

// -----------------------------------------------------------------------------
// Create / Schedule Visit
// -----------------------------------------------------------------------------

export function validateVisit(form: VisitForm) {
  const errors: Record<string, string> = {};

  // ---------------------------------------------------------------------------
  // Customer
  // ---------------------------------------------------------------------------

  if (!form.customerId?.trim()) {
    errors.customerId = "Customer is required.";
  } else if (!isValidUUID(form.customerId.trim())) {
    errors.customerId = "Invalid customer.";
  }

  // ---------------------------------------------------------------------------
  // Contact person
  // ---------------------------------------------------------------------------

  if (!form.contact_person?.trim()) {
    errors.contact_person = "Contact person is required.";
  } else if (!isValidUUID(form.contact_person.trim())) {
    errors.contact_person = "Invalid contact person.";
  }

  // ---------------------------------------------------------------------------
  // Visit type
  // ---------------------------------------------------------------------------

  if (!form.visitType?.trim()) {
    errors.visitType = "Visit type is required.";
  } else if (form.visitType.trim().length > VISIT_TYPE_MAX) {
    errors.visitType = `Visit type cannot exceed ${VISIT_TYPE_MAX} characters.`;
  }

  // ---------------------------------------------------------------------------
  // Visit objective
  // ---------------------------------------------------------------------------
  //
  // This field is NOT currently present in your database table.
  // Validate it if you still use it in the UI, but do not send it
  // in buildVisit Payload unless your backend explicitly expects it.

  if (hasExceededLimit(form.visitObjective, VISIT_OBJECTIVE_MAX)) {
    errors.visitObjective = `Visit objective cannot exceed ${VISIT_OBJECTIVE_MAX} characters.`;
  }

  // ---------------------------------------------------------------------------
  // Related visit
  // ---------------------------------------------------------------------------

  if (form.visitType === "Follow-up") {
    if (!form.relatedVisitId?.trim()) {
      errors.relatedVisitId = "Related visit is required for a follow-up.";
    } else if (!isValidUUID(form.relatedVisitId.trim())) {
      errors.relatedVisitId = "Invalid related visit.";
    }
  }

  // If this isn't a follow-up, there shouldn't be a related visit.
  if (form.visitType !== "Follow-up" && form.relatedVisitId?.trim()) {
    errors.relatedVisitId =
      "Related visit should only be selected for follow-up visits.";
  }

  // ---------------------------------------------------------------------------
  // Visit date
  // ---------------------------------------------------------------------------

  if (!form.visitDateTime?.trim()) {
    errors.visitDateTime = "Visit date & time is required.";
  } else if (!isValidDate(form.visitDateTime)) {
    errors.visitDateTime = "Enter a valid visit date and time.";
  }

  // ---------------------------------------------------------------------------
  // Purpose - TEXT
  // ---------------------------------------------------------------------------

  if (form.visitType !== "Courtesy" && !form.purpose.trim()) {
    errors.purpose = "Purpose of visit is required.";
  } else if (form.purpose.trim().length > PURPOSE_MAX) {
    errors.purpose = `Purpose of visit cannot exceed ${PURPOSE_MAX} characters.`;
  }

  // ---------------------------------------------------------------------------
  // Participants - TEXT
  // ---------------------------------------------------------------------------

  if (form.participants?.trim()) {
    if (form.participants.trim().length > PARTICIPANTS_MAX) {
      errors.participants = `Participants cannot exceed ${PARTICIPANTS_MAX} characters.`;
    }
  }

  // ---------------------------------------------------------------------------
  // Reminder date
  // ---------------------------------------------------------------------------

  if (form.reminderDate?.trim()) {
    if (!isValidDateOnly(form.reminderDate)) {
      errors.reminderDate = "Enter a valid reminder date.";
    }
  }

  // ---------------------------------------------------------------------------
  // Follow-up
  // ---------------------------------------------------------------------------

  if (form.followUpRequired) {
    if (!form.followUpDate?.trim()) {
      errors.followUpDate = "Expected follow-up date is required.";
    } else if (!isValidDateOnly(form.followUpDate)) {
      errors.followUpDate = "Enter a valid follow-up date.";
    }

    // Make sure follow-up isn't before the visit.
    if (
      form.followUpDate &&
      form.visitDateTime &&
      isValidDateOnly(form.followUpDate) &&
      isValidDate(form.visitDateTime)
    ) {
      const visitDate = new Date(form.visitDateTime);
      const followUpDate = new Date(`${form.followUpDate}T00:00:00`);

      if (followUpDate < visitDate) {
        errors.followUpDate = "Follow-up date cannot be before the visit date.";
      }
    }
  } else if (form.followUpDate?.trim()) {
    errors.followUpDate =
      "Follow-up date should only be provided when follow-up is required.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// -----------------------------------------------------------------------------
// Create payload
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Visit completion / update
// -----------------------------------------------------------------------------

export function validateVisitCompletion(form: {
  outcome: string;
  nextAction: string;
  status: string;
  comment: string;

  customerFeedback: string;
  discussionPoints?: string;
  recommendations?: string;

  opportunityCreated: boolean;
  opportunityValue: string;
  opportunityNotes?: string;
}) {
  const errors: Record<string, string> = {};

  const TEXT_MAX = 5000;
  const OPPORTUNITY_NOTES_MAX = 5000;

  // ---------------------------------------------------------------------------
  // Completed
  // ---------------------------------------------------------------------------

  if (form.status === "Completed") {
    if (!form.outcome.trim()) {
      errors.outcome = "Outcome is required.";
    } else if (form.outcome.trim().length > TEXT_MAX) {
      errors.outcome = `Outcome cannot exceed ${TEXT_MAX} characters.`;
    }

    if (!form.nextAction.trim()) {
      errors.nextAction = "Next action is required.";
    } else if (form.nextAction.trim().length > TEXT_MAX) {
      errors.nextAction = `Next action cannot exceed ${TEXT_MAX} characters.`;
    }

    if (!form.customerFeedback.trim()) {
      errors.customerFeedback = "Customer feedback is required.";
    } else if (form.customerFeedback.trim().length > TEXT_MAX) {
      errors.customerFeedback = `Customer feedback cannot exceed ${TEXT_MAX} characters.`;
    }
  }

  // ---------------------------------------------------------------------------
  // Follow-up Required
  // ---------------------------------------------------------------------------

  if (form.status === "Follow-up Required") {
    if (!form.outcome.trim()) {
      errors.outcome = "Outcome is required.";
    } else if (form.outcome.trim().length > TEXT_MAX) {
      errors.outcome = `Outcome cannot exceed ${TEXT_MAX} characters.`;
    }

    if (!form.nextAction.trim()) {
      errors.nextAction = "Next action is required.";
    } else if (form.nextAction.trim().length > TEXT_MAX) {
      errors.nextAction = `Next action cannot exceed ${TEXT_MAX} characters.`;
    }

    if (!form.customerFeedback.trim()) {
      errors.customerFeedback = "Customer feedback is required.";
    } else if (form.customerFeedback.trim().length > TEXT_MAX) {
      errors.customerFeedback = `Customer feedback cannot exceed ${TEXT_MAX} characters.`;
    }
  }

  // ---------------------------------------------------------------------------
  // Cancelled
  // ---------------------------------------------------------------------------

  if (form.status === "Cancelled") {
    if (!form.comment.trim()) {
      errors.comment = "Cancellation reason is required.";
    } else if (form.comment.trim().length > TEXT_MAX) {
      errors.comment = `Cancellation reason cannot exceed ${TEXT_MAX} characters.`;
    }
  }

  // ---------------------------------------------------------------------------
  // Optional fields
  // ---------------------------------------------------------------------------

  if (form.discussionPoints?.trim()) {
    if (form.discussionPoints.trim().length > TEXT_MAX) {
      errors.discussionPoints = `Discussion points cannot exceed ${TEXT_MAX} characters.`;
    }
  }

  if (form.recommendations?.trim()) {
    if (form.recommendations.trim().length > TEXT_MAX) {
      errors.recommendations = `Recommendations cannot exceed ${TEXT_MAX} characters.`;
    }
  }

  // ---------------------------------------------------------------------------
  // Opportunity
  // ---------------------------------------------------------------------------

  if (form.opportunityCreated) {
    const value = form.opportunityValue.trim();

    if (!value) {
      errors.opportunityValue = "Opportunity value is required.";
    } else if (!/^\d+(\.\d{1,2})?$/.test(value)) {
      errors.opportunityValue =
        "Opportunity value must be a valid amount with up to 2 decimal places.";
    } else if (Number(value) <= 0) {
      errors.opportunityValue = "Opportunity value must be greater than zero.";
    } else if (Number(value) > 9999999999999999.99) {
      errors.opportunityValue = "Opportunity value is too large.";
    }

    if (!form.opportunityNotes?.trim()) {
      errors.opportunityNotes = "Opportunity notes are required.";
    } else if (form.opportunityNotes.trim().length > OPPORTUNITY_NOTES_MAX) {
      errors.opportunityNotes = `Opportunity notes cannot exceed ${OPPORTUNITY_NOTES_MAX} characters.`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export type VisitForm = {
  customerId: string;
  contact_person: string;
  visitType: string;
  visitObjective: string;
  relatedVisitId: string;
  visitDateTime: string;
  purpose: string;
  participants: string;
  reminderDate: string;
  followUpRequired: boolean;
  followUpDate: string;
};

export function buildVisitPayload(form: {
  customerId: string;
  contact_person: string;
  visitType: string;
  visitObjective: string;
  relatedVisitId: string;
  visitDateTime: string;
  // location: string;
  purpose: string;
  participants: string;
  reminderDate: string;
  followUpRequired: boolean;
  followUpDate: string;
}) {
  return {
    customer_id: form.customerId,
    contact_person: form.contact_person,

    visit_type: form.visitType,
    visit_objective: form.visitObjective,
    related_visit_id:
      form.visitType === "Follow-up" ? form.relatedVisitId || null : null,
    visit_date: form.visitDateTime,
    // location: form.location.trim(),
    purpose: form.purpose.trim(),
    participants: form.participants,
    reminder_date: form.reminderDate || null,

    follow_up_required: form.followUpRequired,
    follow_up_date: form.followUpRequired ? form.followUpDate || null : null,
  };
}

export function buildVisitUpdatePayload(form: {
  outcome: string;
  nextAction: string;
  status: string;
  comment: string;

  customerFeedback: string;
  discussionPoints: string;
  recommendations: string;

  opportunityCreated: boolean;
  opportunityValue: string;
  opportunityNotes: string;
}): UpdateCustomerVisitPayload {
  return {
    status: form.status,

    outcome: form.outcome.trim(),

    next_action: form.nextAction.trim(),

    comment: form.comment.trim(),

    customer_feedback: form.customerFeedback.trim(),

    customer_comments: form.discussionPoints.trim(),

    recommendation: form.recommendations.trim(),

    opportunity_identified: form.opportunityCreated,

    opportunity_value: form.opportunityCreated
      ? Number(form.opportunityValue || 0)
      : null,

    opportunity_notes: form.opportunityCreated
      ? form.opportunityNotes.trim()
      : null,
  };
}
