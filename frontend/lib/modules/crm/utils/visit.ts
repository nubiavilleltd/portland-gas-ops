// lib/modules/crm/utils/visit.ts
import { UpdateCustomerVisitPayload } from "../types";

export type VisitForm = {
  customerId: string;
  contact_person: string;
  visitType: string;
  visitObjective: string;
  relatedVisitId: string;
  visitDateTime: string;
  location: string;
  purpose: string;
  participants: string;
  reminderDate: string;
  followUpRequired: boolean;
  followUpDate: string;
};

export function validateVisit(form: VisitForm) {
  const errors: Record<string, string> = {};

  if (!form.customerId) {
    errors.customerId = "Customer is required.";
  }

  if (!form.visitType) {
    errors.visitType = "Visit type is required.";
  }

  if (!form.contact_person) {
    errors.contact_person = "Contact person is required.";
  }

  if (!form.visitDateTime) {
    errors.visitDateTime = "Visit date & time is required.";
  }

  if (!form.location.trim()) {
    errors.location = "Location is required.";
  }

  if (!form.purpose.trim()) {
    errors.purpose = "Purpose of visit is required.";
  }

  if (form.visitType === "Follow-up" && !form.relatedVisitId) {
    errors.relatedVisitId = "Related visit is required.";
  }

  if (form.followUpRequired && !form.followUpDate) {
    errors.followUpDate = "Expected follow-up date is required.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildVisitPayload(form: {
  customerId: string;
  contact_person: string;
  visitType: string;
  visitObjective: string;
  relatedVisitId: string;
  visitDateTime: string;
  location: string;
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
    location: form.location.trim(),
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

export function validateVisitCompletion(form: {
  outcome: string;
  nextAction: string;
  status: string;
  comment: string;
  customerFeedback: string;
  opportunityCreated: boolean;
  opportunityValue: string;
}) {
  const errors: Record<string, string> = {};

  if (form.status === "Completed") {
    if (!form.outcome.trim()) {
      errors.outcome = "Outcome is required.";
    }

    if (!form.nextAction.trim()) {
      errors.nextAction = "Next action is required.";
    }

    if (!form.customerFeedback.trim()) {
      errors.customerFeedback = "Customer feedback is required.";
    }
  }

  if (form.status === "Cancelled") {
    if (!form.comment.trim()) {
      errors.comment = "Cancellation reason is required.";
    }
  }

  if (form.status === "Follow-up Required") {
    if (!form.outcome.trim()) {
      errors.outcome = "Outcome is required.";
    }

    if (!form.nextAction.trim()) {
      errors.nextAction = "Next action is required.";
    }

    if (!form.customerFeedback.trim()) {
      errors.customerFeedback = "Customer feedback is required.";
    }
  }

  // if (form.opportunityCreated) {
  //   if (!form.opportunityValue.trim()) {
  //     errors.opportunityValue = "Opportunity value is required.";
  //   } else if (Number(form.opportunityValue) <= 0) {
  //     errors.opportunityValue = "Opportunity value must be greater than zero.";
  //   }
  // }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
