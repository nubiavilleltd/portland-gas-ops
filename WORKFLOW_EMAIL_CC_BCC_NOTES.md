# Workflow Email CC/BCC Feature - Research Notes

> **Status:** On Hold - Will revisit later
> **Created:** 2026-08-05

---

## Problem Statement

Need to add CC and BCC functionality to workflow emails. Use cases identified:

1. **Admin-configured CC/BCC** - Set during workflow step creation
2. **Requester-added CC** - User adds CC when submitting a request
3. **Auto-CC for "Raise for Others"** - When raising a request for someone else, CC them on emails

---

## Current Architecture

### Email System
- Uses **Brevo API** (supports CC/BCC natively, just not implemented)
- Single recipient per email currently
- Entry point: `email_service._send(to_email, subject, html)`

### Key Files
- `/backend/app/shared/services/email_service.py` - `_send()` function
- `/backend/app/shared/services/workflow_email.py` - All notify_* functions
- `/backend/app/shared/models/approval.py` - WorkflowStep model
- `/backend/app/shared/services/workflow_engine.py` - Assignee resolution logic

### Workflow Steps Structure
```python
class WorkflowStep(Base):
    id, workflow_id, step_number, step_name
    assignee_type  # role | specific | requester_pick | requester_operations_manager | requester_hod | requester_skip_level
    role, employee_id, group_id  # based on assignee_type
    can_approve, can_reject, can_return
```

### "Raise for Others" Pattern (Leave)
- `LeaveRequest.requester_id` = who is submitting
- `LeaveRequest.employee_id` = who the leave is FOR
- Separate notification track in `/backend/app/hr/leave_notifications.py`

---

## Recommended Approach

### Phase 1: Quick Win - Auto-CC for "Raise for Others"
- When `request_type === "others"`, auto-CC the employee being raised for
- Low effort, solves immediate pain point
- No UI changes needed

### Phase 2: Step-Level CC/BCC (Admin Configures)
**Schema changes to WorkflowStep:**
```python
cc_employee_ids = Column(Text, nullable=True)  # JSON array or comma-separated
cc_roles = Column(Text, nullable=True)         # JSON array or comma-separated
bcc_emails = Column(Text, nullable=True)       # comma-separated for external
```

**Update email_service._send():**
```python
def _send(to_email, subject, html, cc_emails=None, bcc_emails=None, attachments=None):
    payload = {
        "sender": {...},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html,
    }
    if cc_emails:
        payload["cc"] = [{"email": e} for e in cc_emails]
    if bcc_emails:
        payload["bcc"] = [{"email": e} for e in bcc_emails]
```

**Update workflow_email.py notify functions:**
- Query step config for CC/BCC settings
- Resolve email addresses from roles/employee_ids
- Pass cc_emails and bcc_emails to email service

**Admin UI:**
- Add CC/BCC fields to workflow step form in `/admin/workflows/[id]`

### Phase 3 (Optional): Per-Request CC
- Add optional CC field to request submission forms
- Store CC list on request models
- More complex, consider later

---

## Implementation Checklist (When Ready)

- [ ] Update `email_service._send()` to accept cc_emails and bcc_emails
- [ ] Add CC/BCC columns to WorkflowStep model
- [ ] Create migration for new columns
- [ ] Update workflow step schemas
- [ ] Update `workflow_email.py` notify functions to resolve CCs
- [ ] Update workflow step admin UI (frontend)
- [ ] Test with Brevo API
- [ ] Auto-CC for "raise for others" in leave requests

---

## Notes

- Brevo API payload supports `"cc"` and `"bcc"` arrays natively
- No template changes needed - Brevo handles recipient display
- Can reuse existing assignee resolution logic for CC resolution
