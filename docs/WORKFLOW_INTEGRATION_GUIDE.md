# Workflow Engine — Integration Guide

A step-by-step guide for backend and frontend developers who want to add approval workflows to a new module (e.g. Leave, Assets, Work Initiation).

---

## Table of Contents

1. [What the engine does (and doesn't do)](#1-what-the-engine-does-and-doesnt-do)
2. [Database setup — workflow admin](#2-database-setup--workflow-admin)
3. [Backend integration — service.py](#3-backend-integration--servicepy)
4. [Backend integration — router.py](#4-backend-integration--routerpy)
5. [Email notifications](#5-email-notifications)
6. [Frontend — approval panel on the detail page](#6-frontend--approval-panel-on-the-detail-page)
7. [Frontend — requester-pick approvers on the request form](#7-frontend--requester-pick-approvers-on-the-request-form)
8. [Frontend — audit trail](#8-frontend--audit-trail)
9. [Assignee types reference](#9-assignee-types-reference)
10. [Request type registration](#10-request-type-registration)
11. [Checklist — new module](#11-checklist--new-module)

---

## 1. What the engine does (and doesn't do)

The `WorkflowEngine` is **module-agnostic**. It knows nothing about procurement, leave, or assets. It only knows about steps, assignees, and actions.

### What the engine handles automatically

| Engine responsibility | How |
|-----------------------|-----|
| Resolve who approves each step | `_resolve_assignee()` — supports 6 assignee types |
| Advance the step counter when approved | `engine.approve()` |
| Set `overall_status` to `approved / rejected / returned` | On final action |
| Write to `approval_history` and `workflow_audit_trail` | On every action |
| Create in-app notifications | On every action |
| Update the `all_requests` unified dashboard row | On every action |
| Pre-create requester-pick assignments at submission | `engine.start()` |

### What you (the module developer) must handle

The engine does **not** know what "approved" means for your module. You own:

- Your module's own status field (e.g. `leave_request.status`)
- Any side effects on final approval (e.g. issue a PO, block calendar dates)
- Deciding what happens at each step beyond "approve / reject / return"
- Email notifications (call `workflow_email` helpers **after** `db.commit()`)

The engine gives you two hooks:

```python
engine.approve(..., on_final_approval=lambda: my_service.finalize(request_id))
engine.reject(..., on_rejected=lambda: my_service.set_rejected(request_id))
engine.return_(..., on_returned=lambda: my_service.set_returned(request_id))
```

Use these callbacks to update your own table's status column.

---

## 2. Database setup — workflow admin

Before any code works, an admin must create the workflow configuration through the admin UI (or directly via the API). This is a one-time setup per module.

### Step 1 — Create a workflow

`POST /api/workflow/` with:
```json
{
  "name": "Leave Request Approval",
  "description": "3-step approval for all leave requests",
  "is_active": true,
  "reset_on_return": false
}
```

### Step 2 — Add steps

`POST /api/workflow/{workflow_id}/steps/` for each step:

```json
{ "step_number": 1, "step_name": "Line Manager", "assignee_type": "requester_operations_manager" }
{ "step_number": 2, "step_name": "HR Manager",   "assignee_type": "role", "role": "admin" }
{ "step_number": 3, "step_name": "HOD Approval",  "assignee_type": "requester_hod" }
```

> **Tip:** Steps are re-numbered automatically if you add/remove them. The engine always sorts by `step_number` ascending.

### Step 3 — (Optional) Create an approver group for requester-pick steps

If a step should let the requester pick from a specific list (e.g. only procurement officers), create a group:

```
POST /api/workflow/groups/         → { "name": "Procurement Officers" }
POST /api/workflow/groups/{id}/members/  → { "employee_id": "..." }  (repeat for each member)
```

Then on the step:
```json
{ "step_number": 1, "step_name": "Select Approver", "assignee_type": "requester_pick", "group_id": "<group_id>" }
```

If no `group_id` is set on a `requester_pick` step, the requester can pick **any** employee.

### Step 4 — Assign the workflow to a request type

```
POST /api/workflow/assignments/
{ "request_type": "leave", "workflow_id": "<workflow_id>" }
```

Only one workflow can be assigned per `request_type` at a time. This is what `engine.start("leave", ...)` looks up.

---

## 3. Backend integration — service.py

The only engine call you make at submission is `engine.start()`. Workflow actions (approve/reject/return) are handled generically by `/api/workflow/requests/{id}/…` endpoints — you don't need to add those to your router.

### Submitting a new request

```python
# app/leave/service.py

from app.shared.services.workflow_engine import WorkflowEngine

class LeaveService:

    def create_request(self, data: LeaveCreate, employee: Employee) -> LeaveRequest:
        req = LeaveRequest(
            raised_by=employee.id,
            start_date=data.start_date,
            end_date=data.end_date,
            status="pending",   # your module's own status
        )
        self.repo.add(req)
        self.repo.db.flush()  # get req.id before engine.start()

        # Hand off to the workflow engine
        engine = WorkflowEngine(self.repo.db)
        engine.start(
            request_type="leave",          # must match the workflow assignment
            request_id=req.id,             # your record's UUID
            title=f"Leave — {employee.user.full_name}",
            requester=employee,
            picked_approvers=data.picked_approvers or None,  # only needed for requester_pick steps
        )

        return req
        # Caller (router) commits the transaction
```

### Resubmitting a returned request

When a request is returned and the employee fixes and resubmits it, call `engine.start()` again. The engine creates a new `ApprovalRequest` row with `attempt_number + 1` and resets the workflow from step 1. The old history rows are preserved.

```python
def resubmit_request(self, request_id: str, employee: Employee) -> LeaveRequest:
    req = self._get_or_404(request_id)
    if req.status != "returned":
        bad_request("INVALID_STATUS", "Only returned requests can be resubmitted")

    req.status = "pending"

    engine = WorkflowEngine(self.repo.db)
    engine.start(
        request_type="leave",
        request_id=req.id,
        title=f"Leave — {employee.user.full_name}",
        requester=employee,
    )
    return req
```

### Handling final-approval side effects

If your module needs to do something when the **last step** is approved (e.g. block the dates, send a calendar invite, change a status), use the `on_final_approval` callback. This is called inside the engine **before** `db.commit()`.

For procurement, the last step (step 4) also issues a PO, so the router wires this manually:

```python
# From procurement/router.py — approve-and-issue-po endpoint

def approve_and_issue_po(request_id, body, db, current_user):
    employee = get_employee_by_user_id(current_user.id, db)
    engine = WorkflowEngine(db)
    svc = ProcurementService(ProcurementRepository(db))

    all_req = db.query(AllRequest).filter(...).first()
    approval_request_id = all_req.approval_request_id

    # Approve step 4 — engine advances to step 5 (not final)
    engine.approve(approval_request_id, employee, comment=None)

    # Our module logic: set status so issue_po_internal's guard passes
    proc_req = svc._get_or_404(request_id)
    proc_req.status = "approved"
    db.flush()

    # Now issue the PO (sets status to "awaiting_confirmation")
    svc.issue_po_internal(request_id, body, issuer_employee=employee)

    db.commit()

    # Email AFTER commit
    workflow_email.notify_step_assigned(db, approval_request_id)
    return proc_req
```

For a simpler module with a normal final step:

```python
# From procurement/router.py — confirm-delivery endpoint

def confirm_delivery(request_id, db, current_user):
    employee = get_employee_by_user_id(current_user.id, db)
    engine = WorkflowEngine(db)
    svc = ProcurementService(ProcurementRepository(db))

    all_req = db.query(AllRequest).filter(...).first()
    approval_request_id = all_req.approval_request_id

    def on_final_approval():
        svc.confirm_delivery_internal(request_id)  # marks PO delivered, status = "completed"

    engine.approve(approval_request_id, employee, comment=None, on_final_approval=on_final_approval)

    db.commit()

    workflow_email.notify_request_result(db, approval_request_id, "approved")
    return svc._get_or_404(request_id)
```

### Standard approve / reject / return

For modules that don't need special logic at each step, the shared workflow router (`/api/workflow/requests/{id}/approve`) handles it generically. The `on_final_approval` callback in the shared router calls nothing — it just marks the `all_requests` row as approved. **If your module needs to update its own status field on final approval, you must wire a dedicated endpoint** (like procurement's `confirm-delivery`).

If you do want the generic endpoints to also update your module's status, pass callbacks into the engine from your own router endpoint. Example for a leave module that just needs to flip a status:

```python
# In your module's router — only needed if you want to hook into the generic action

@router.post("/{request_id}/approve")
def approve_leave(request_id, db, current_user):
    employee = get_employee_by_user_id(current_user.id, db)
    engine = WorkflowEngine(db)
    svc = LeaveService(LeaveRepository(db))

    all_req = db.query(AllRequest).filter(
        AllRequest.request_type == "leave",
        AllRequest.request_id == request_id,
    ).first()

    def on_final():
        req = svc._get_or_404(request_id)
        req.status = "approved"

    engine.approve(all_req.approval_request_id, employee, on_final_approval=on_final)
    db.commit()
    workflow_email.notify_request_result(db, all_req.approval_request_id, "approved")
    return svc._get_or_404(request_id)
```

> **Note:** Most modules just use the generic `/api/workflow/requests/{id}/approve` endpoint from the My Approvals page and only add module-specific endpoints for steps that do more than "advance the workflow". Procurement's step 4 (Issue PO) is the exception, not the rule.

---

## 4. Backend integration — router.py

### Minimum required in your router

1. **Submit / create** — calls `engine.start()` via your service, then emails step 1 assignee
2. **Get detail** — enrich with `next_actor_name` / `current_step_name` for the frontend
3. **List** — enrich with next-actor info using a single JOIN query

### Sending the step-1 email after submission

```python
@router.post("/", response_model=LeaveResponse, status_code=201)
def create_leave(data: LeaveCreate, db=Depends(get_db), current_user=Depends(get_current_user)):
    employee = get_employee_by_user_id(current_user.id, db)
    req = _svc(db).create_request(data, employee)
    db.commit()
    db.refresh(req)

    # Email the step-1 approver AFTER commit
    from app.shared.services.workflow_email import notify_new_request
    notify_new_request(db, "leave", req.id)

    return req
```

### Enriching the detail response with next-actor info

```python
@router.get("/{request_id}", response_model=LeaveResponse)
def get_leave(request_id, db=Depends(get_db), current_user=Depends(get_current_user)):
    req = _svc(db).get_request(request_id, current_user)
    result = LeaveResponse.model_validate(req)

    if req.status == "pending":
        info = _next_actors(db, [request_id]).get(request_id)
        if info:
            result.next_actor_name = info["name"]
            result.current_step_name = info["step_name"]

    return result
```

### The `_next_actors()` helper (copy this into your router)

This performs a single JOIN across 6 tables to get the name and step name of whoever holds the ball right now — no N+1.

```python
from sqlalchemy import and_

def _next_actors(db: Session, request_ids: list[str]) -> dict[str, dict]:
    """Returns { request_id: {"name": str, "step_name": str} } for all pending IDs."""
    if not request_ids:
        return {}

    from app.shared.models.approval import (
        AllRequest, ApprovalRequest, ApprovalStepAssignment,
        ApprovalOverallStatus, WorkflowStep,
    )
    from app.employees.models import Employee as EmpModel
    from app.shared.models.user import User as UserModel

    rows = (
        db.query(
            AllRequest.request_id,
            UserModel.first_name,
            UserModel.last_name,
            WorkflowStep.step_name,
        )
        .join(ApprovalRequest, ApprovalRequest.id == AllRequest.approval_request_id)
        .join(
            ApprovalStepAssignment,
            and_(
                ApprovalStepAssignment.approval_request_id == ApprovalRequest.id,
                ApprovalStepAssignment.step_number == ApprovalRequest.current_step_number,
            ),
        )
        .join(EmpModel, EmpModel.id == ApprovalStepAssignment.assigned_to)
        .join(UserModel, UserModel.id == EmpModel.user_id)
        .join(
            WorkflowStep,
            and_(
                WorkflowStep.workflow_id == ApprovalRequest.workflow_id,
                WorkflowStep.step_number == ApprovalRequest.current_step_number,
            ),
        )
        .filter(
            AllRequest.request_type == "leave",            # ← change to your request_type
            AllRequest.request_id.in_(request_ids),
            ApprovalRequest.overall_status == ApprovalOverallStatus.pending,
        )
        .all()
    )

    result: dict[str, dict] = {}
    for row in rows:
        name = " ".join(p for p in [row.first_name, row.last_name] if p) or "—"
        result[row.request_id] = {"name": name, "step_name": row.step_name}
    return result
```

### Adding `next_actor_name` to your schema

In `schemas.py`, add optional fields to both your list and detail response models:

```python
class LeaveListItem(BaseModel):
    id: str
    # ... your fields ...
    next_actor_name: Optional[str] = None
    current_step_name: Optional[str] = None

    class Config:
        from_attributes = True
```

---

## 5. Email notifications

All email helpers live in `app/shared/services/workflow_email.py`. They always swallow exceptions — email failures never block the API response.

**Rule: always call email helpers AFTER `db.commit()`.**

### The three helpers

```python
from app.shared.services import workflow_email

# 1. After submission — emails step-1 approver
#    Pass request_type + request_id; it looks up the approval_request_id itself
workflow_email.notify_new_request(db, "leave", req.id)

# 2. After a mid-flow approve — emails the NEXT step's approver
#    (only use this when you call engine.approve() from your own endpoint)
workflow_email.notify_step_assigned(db, approval_request_id)

# 3. After final approve / reject / return — emails the requester
workflow_email.notify_request_result(db, approval_request_id, "approved")
workflow_email.notify_request_result(db, approval_request_id, "rejected", comment="Missing docs")
workflow_email.notify_request_result(db, approval_request_id, "returned",  comment="Dates overlap")
```

### If you add a new email template

The underlying `email_service` has `send_approval_required` and `send_approval_result` which already cover the standard workflow notifications. If your module needs a custom email (e.g. "Your PO has been issued"), add a function to `app/shared/services/email_service.py`:

```python
def send_po_issued(to_email: str, requester_name: str, po_number: str, action_url: str) -> None:
    """Email the requester when their PO has been issued."""
    subject = f"Purchase Order Issued — {po_number}"
    html = render_template("po_issued.html", {
        "requester_name": requester_name,
        "po_number": po_number,
        "action_url": action_url,
    })
    _send(to_email, subject, html)
```

Then call it from your router (after `db.commit()`):

```python
from app.shared.services import email_service

db.commit()
try:
    email_service.send_po_issued(
        to_email=requester.user.email,
        requester_name=requester.user.full_name,
        po_number=po.po_number,
        action_url=email_service.get_request_url("procurement", req.id),
    )
except Exception:
    logger.exception("PO issued email failed")
```

### Adding your request type to email links

`email_service.get_request_url(request_type, request_id)` builds the deep-link URL in the email. Register your module's path there:

```python
# app/shared/services/email_service.py

def get_request_url(request_type: str, request_id: str) -> str:
    paths = {
        "procurement":    f"/procurement/{request_id}",
        "asset":          f"/assets/requests/{request_id}",
        "leave":          f"/leave/{request_id}",          # ← add yours
        "work_initiation":f"/safety/work-initiation/{request_id}",
    }
    path = paths.get(request_type, f"/requests/{request_id}")
    return f"{settings.FRONTEND_URL}{path}"
```

Also register a human-readable label:

```python
def get_request_type_label(request_type: str) -> str:
    labels = {
        "procurement":    "Purchase & Service Request",
        "asset":          "Asset Request",
        "leave":          "Leave Request",               # ← add yours
        "work_initiation":"Work Initiation",
    }
    return labels.get(request_type, request_type.replace("_", " ").title())
```

---

## 6. Frontend — approval panel on the detail page

The `<ApprovalPanel>` component is the single UI for all approval actions. It handles the comment box, loading states, and button variants. You just wire in the callbacks.

### Basic pattern

```tsx
// app/(app)/leave/[id]/page.tsx

import ApprovalPanel from "@/components/ui/ApprovalPanel";
import { useMyApprovals, useAuditTrail } from "@/lib/modules/workflow/queries";
import {
  useWorkflowApprove,
  useWorkflowReject,
  useWorkflowReturn,
} from "@/lib/modules/workflow/mutations";

export default function LeaveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: req } = useLeaveRequest(id);
  const toast = useToast();

  // Find if the current user is the assigned approver for this request
  const { data: myApprovals = [] } = useMyApprovals();
  const myApprovalEntry = myApprovals.find(
    (a) => a.request_type === "leave" && a.request_id === id
  );
  const approvalRequestId = myApprovalEntry?.approval_request_id ?? null;

  // Generic workflow mutations — work for every module
  const workflowApprove = useWorkflowApprove();
  const workflowReject  = useWorkflowReject();
  const workflowReturn  = useWorkflowReturn();

  const isBusy = workflowApprove.isPending || workflowReject.isPending || workflowReturn.isPending;

  async function handleAction(action: "approve" | "reject" | "return", comment: string) {
    if (!approvalRequestId) return;
    try {
      if (action === "approve") {
        await workflowApprove.mutateAsync({ approvalRequestId, comment: comment || undefined });
        toast.success("Request approved");
      } else if (action === "reject") {
        await workflowReject.mutateAsync({ approvalRequestId, comment: comment || undefined });
        toast.success("Request rejected");
      } else {
        await workflowReturn.mutateAsync({ approvalRequestId, comment: comment || undefined });
        toast.success("Returned for revision");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, LEAVE_ERRORS));
    }
  }

  return (
    <AppLayout pageTitle="Leave Request">
      {/* ... your request detail UI ... */}

      {/* Approval panel — only shows if the current user is the assigned approver */}
      {approvalRequestId && req?.status === "pending" && (
        <ApprovalPanel
          title="Approval Decision"
          description="Review the request and make your decision."
          showReturn
          showReject
          showApprove
          onReturn={(comment)  => handleAction("return",  comment)}
          onReject={(comment)  => handleAction("reject",  comment)}
          onApprove={(comment) => handleAction("approve", comment)}
          returnLoading={workflowReturn.isPending}
          rejectLoading={workflowReject.isPending}
          approveLoading={workflowApprove.isPending}
          disabled={isBusy}
        />
      )}
    </AppLayout>
  );
}
```

### Customising the panel for a special step

If a specific step requires custom UI (e.g. a checkbox, a dropdown, or a different button label), use the `extraFields` and `approveLabel` props:

```tsx
{/* Example: step 5 goods-received confirmation — procurement */}
{approvalRequestId && req.status === "awaiting_confirmation" && (
  <ApprovalPanel
    title="Goods Received Confirmation"
    description="Confirm that all goods have been received to close this request."
    showReturn={false}
    showReject={false}
    showApprove
    approveLabel="Confirm Goods Received"
    onApprove={async () => {
      if (!goodsConfirmed) {
        toast.error("Please check the box first.");
        return;
      }
      await confirmDelivery.mutateAsync(id);
      toast.success("Goods confirmed — request completed");
    }}
    approveLoading={confirmDelivery.isPending}
    disabled={isBusy}
    extraFields={
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={goodsConfirmed}
          onChange={(e) => setGoodsConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-brand-border accent-brand-purple"
        />
        <span className="text-sm">
          I confirm the goods/services have been received in full.
        </span>
      </label>
    }
  />
)}
```

### How to know which step the user is on

Use `myApprovalEntry.current_step_number` from `useMyApprovals()`:

```tsx
const ISSUE_PO_STEP = 4;

// Show a different button label on step 4
approveLabel={myApprovalEntry?.current_step_number === ISSUE_PO_STEP ? "Issue PO" : "Approve"}

// Conditionally call a different mutation on step 4
onApprove={async (comment) => {
  if (myApprovalEntry?.current_step_number === ISSUE_PO_STEP) {
    await approveAndIssuePO.mutateAsync({ id });
  } else {
    await handleAction("approve", comment);
  }
}}
```

### Next-actor display

Show who holds the ball next in your header card:

```tsx
{req.next_actor_name && (
  <p className="text-xs text-brand-text-secondary mt-1">
    Next Actor:{" "}
    <span className="font-medium text-brand-text-primary">{req.next_actor_name}</span>
    {req.current_step_name && (
      <span className="text-brand-text-secondary"> · {req.current_step_name}</span>
    )}
  </p>
)}
```

---

## 7. Frontend — requester-pick approvers on the request form

When a workflow step has `assignee_type: "requester_pick"`, the requester must choose an approver at submission time. Two reusable pieces handle this entirely.

### The hook — `useApproverPicker`

```tsx
// app/(app)/leave/new/page.tsx

import { useApproverPicker } from "@/lib/modules/workflow/useApproverPicker";
import WorkflowApproversSection from "@/components/ui/WorkflowApproversSection";

export default function NewLeaveRequestPage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit") ?? undefined;  // present when resubmitting

  // One line — handles everything: loading, state, validation, pre-fill on resubmit
  const approverPicker = useApproverPicker("leave", editId);

  async function onSubmit(formData: LeaveFormValues) {
    // Validate that all required picks are made
    const err = approverPicker.validate();
    if (err) {
      toast.error(err);
      return;
    }

    await createLeave.mutateAsync({
      ...formData,
      picked_approvers: approverPicker.picksPayload,  // { "1": "emp_uuid", "3": "emp_uuid" }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* ... your form fields ... */}

      {/* Drop this in — it renders nothing if there are no requester_pick steps */}
      <WorkflowApproversSection {...approverPicker} />

      <button type="submit">Submit Request</button>
    </form>
  );
}
```

That's it. The hook and component handle:

- Fetching the active workflow for `"leave"`
- Filtering to only `requester_pick` steps (auto-resolved steps like `requester_operations_manager` are invisible)
- Showing a group-restricted picker if `group_id` is set on the step, otherwise showing all employees
- Pre-filling pickers from the previous attempt when `editId` is provided (resubmit flow)
- Validating that all picks are made before submit
- Building `picksPayload` in the format the backend expects: `{ "1": "employee_id" }`

### What `picksPayload` looks like

```json
{ "1": "a1b2c3d4-...", "3": "e5f6a7b8-..." }
```

The keys are step numbers (as strings for JSON), the values are employee UUIDs. The backend `engine.start()` receives this as `picked_approvers: dict[int, str]`.

### Backend: receiving picked_approvers in your schema

```python
# schemas.py
class LeaveCreate(BaseModel):
    start_date: date
    end_date:   date
    reason:     Optional[str] = None
    # Required for requester_pick steps — { step_number: employee_id }
    picked_approvers: dict[int, str] = Field(default_factory=dict)
```

---

## 8. Frontend — audit trail

Every action (submitted, approved, rejected, returned) is written to `workflow_audit_trail` automatically. Display it with the `<AuditTrail>` component.

```tsx
import AuditTrail from "@/components/forms/AuditTrail";
import { useAuditTrail } from "@/lib/modules/workflow/queries";
import { formatDateTime } from "@/lib/utils";

// In your detail page:
const { data: auditTrail = [] } = useAuditTrail("leave", id);

// In JSX:
<AuditTrail
  title="Approval History"
  description="A full record of every action on this request."
  emptyMessage="No actions recorded yet."
  items={auditTrail.map((entry) => ({
    action:   entry.action.charAt(0).toUpperCase() + entry.action.slice(1).replace(/_/g, " "),
    actor:    entry.actor_name ?? "System",
    role:     entry.actor_role ?? "",
    dateTime: formatDateTime(entry.acted_at),
    comment:  entry.comment ?? "",
  }))}
/>
```

---

## 9. Assignee types reference

| `assignee_type` | Who gets assigned | Configuration needed |
|-----------------|-------------------|----------------------|
| `specific` | One named employee, always | Set `employee_id` on the step |
| `role` | First active user with that system role | Set `role` on the step (e.g. `"admin"`) |
| `requester_pick` | Requester chooses at submission | Optionally set `group_id` to restrict the pool |
| `requester_operations_manager` | Requester's direct line manager | Employee must have `operating_manager_id` set |
| `requester_skip_level` | Requester's manager's manager | Both requester and their manager need a manager set |
| `requester_hod` | Top of the management chain (no manager above) | At least one manager in the chain |

---

## 10. Request type registration

When you add a new module, register its `request_type` string in two places:

### Backend — `workflow_engine.py`

```python
# app/shared/services/workflow_engine.py

_REQUEST_TYPE_PREFIX = {
    "procurement":    "REQ-PROC",
    "asset":          "REQ-ASSET",
    "leave":          "REQ-LEAVE",   # ← add yours
    "work_initiation":"REQ-WI",
}
```

This controls the reference number prefix shown on the All Requests dashboard (e.g. `REQ-LEAVE-2026-A1B2C3`).

### Frontend — approvals page `PROCESS_CONFIG`

```tsx
// app/(app)/approvals/page.tsx

const PROCESS_CONFIG: Record<string, { label: string; badge: string }> = {
  procurement:      { label: "Procurement",    badge: "bg-purple-100 text-purple-700" },
  asset:            { label: "Asset Request",  badge: "bg-blue-100 text-blue-700" },
  leave:            { label: "Leave Request",  badge: "bg-green-100 text-green-700" },   // ← add yours
  work_initiation:  { label: "Work Initiation", badge: "bg-orange-100 text-orange-700" },
};
```

### Frontend — email deep-link and label

See [Section 5 — Adding your request type to email links](#5-email-notifications).

---

## 11. Checklist — new module

Work through this list top to bottom:

**Admin setup (one time)**
- [ ] Create workflow via admin UI (`POST /api/workflow/`)
- [ ] Add steps with correct `assignee_type`
- [ ] Create approver groups if any steps use `requester_pick` with a restricted pool
- [ ] Assign workflow to your `request_type` (`POST /api/workflow/assignments/`)

**Backend**
- [ ] Add `request_type` prefix to `_REQUEST_TYPE_PREFIX` in `workflow_engine.py`
- [ ] Register `request_type` in `email_service.get_request_url()` and `get_request_type_label()`
- [ ] Add `next_actor_name: Optional[str] = None` and `current_step_name: Optional[str] = None` to your list and detail schema models
- [ ] Call `engine.start()` inside your service's create/resubmit methods
- [ ] Add `notify_new_request(db, request_type, req.id)` in your router **after** `db.commit()`
- [ ] Copy `_next_actors()` helper into your router, change `request_type` filter
- [ ] Enrich list and detail responses with `_next_actors()` results
- [ ] Wire `on_final_approval` / `on_rejected` / `on_returned` callbacks if your module needs custom status transitions on those events

**Frontend**
- [ ] Add your `request_type` to `PROCESS_CONFIG` in `app/(app)/approvals/page.tsx`
- [ ] Add your `request_type` to `requestHref()` in `app/(app)/approvals/page.tsx`
- [ ] Add `next_actor_name` and `current_step_name` to your TypeScript type
- [ ] Add `<ApprovalPanel>` to your detail page, wired to `useWorkflowApprove/Reject/Return`
- [ ] Show `next_actor_name` in the header card when `status === "pending"`
- [ ] Add `<AuditTrail>` with `useAuditTrail(requestType, id)`
- [ ] On the request form: add `useApproverPicker` + `<WorkflowApproversSection>` + pass `picksPayload` to the create mutation
- [ ] Add `picked_approvers: dict[int, str]` to your backend create schema
