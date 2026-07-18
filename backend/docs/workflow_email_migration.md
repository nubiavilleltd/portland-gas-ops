# Workflow Email Notifications — Engine-Owned Architecture

**For:** Safety module developer  
**Context:** Procurement and shared workflow routers have already been updated. This brief explains what changed and what action is needed in the safety routers.

---

## What Changed

Email notifications are now fired **automatically by the Workflow Engine** at every state transition, rather than being called manually in each module's router.

### Specifically, `WorkflowEngine` now calls:

| Trigger | Email sent |
|---|---|
| `start()` — request submitted | `notify_submitted()` → requester gets "Request Submitted" email |
| `start()` — workflow begins | `notify_step_assigned()` → step 1 approver gets "Action Required" email |
| `approve()` — mid-flow step | `notify_step_progress()` → requester gets "Step N approved, Step N+1 pending" |
| `approve()` — mid-flow step | `notify_step_assigned()` → next approver gets "Action Required" email |
| `approve()` — final step | `notify_request_result("approved")` → requester gets "Request Approved" email |
| `reject()` | `notify_request_result("rejected")` → requester gets "Request Rejected" email |
| `return_()` | `notify_request_result("returned")` → requester gets "Request Returned" email |

---

## Why This Approach

**Industry standard for workflow systems** — the engine is the single source of truth for state transitions, so it should also own the side effects (notifications). This means:

- **No module can forget notifications** — if a new module type is added, it gets emails for free
- **No duplicate code** — every module was copying the same `notify_step_assigned` / `notify_request_result` pattern
- **Consistent behaviour** — every request type (procurement, safety, assets, etc.) sends the same lifecycle emails

---

## Impact on the Safety Routers

The safety routers (`work_initiations`, `work_authorizations`, `work_closeouts`) currently call `workflow_email.*` functions manually. **Those calls now fire twice** — once from the router, once from the engine.

### What needs to be removed from each safety router:

- `workflow_email.notify_new_request(...)` — replaced by engine's `start()` hook
- `workflow_email.notify_step_assigned(...)` — replaced by engine's `approve()` hook
- `workflow_email.notify_step_progress(...)` — replaced by engine's `approve()` hook
- `workflow_email.notify_request_result(...)` — replaced by engine's `approve()` / `reject()` / `return_()` hooks

After removing those calls, the `from app.shared.services import workflow_email` import in each router can also be removed if it is no longer used.

---

## How Per-Module Email Customisation Still Works

The engine calls into `workflow_email.py`, which has two dispatch functions that accept `request_type` as a parameter. You can add a branch for any request type to customise the email copy without touching the engine at all.

### `approval_required_copy_for_step()` — customise the "Action Required" email

```python
# workflow_email.py

def approval_required_copy_for_step(
    request_type: str,
    request_title: str,
    step_name: str,
    step_number: int,
) -> dict[str, str | None]:

    # Example: custom copy for work_initiation supervisor step
    if request_type == "work_initiation" and step_number == 1:
        return {
            "intro_message": f"You were selected as the supervisor for {request_title}.",
            "action_message": "Click below to view the work details and take action.",
            "button_label": "View Details & Take Action",
        }

    # Add your own block here:
    if request_type == "work_authorization":
        return {
            "intro_message": "A Work Authorization request requires your review.",
            "action_message": None,
            "button_label": "Review & Authorise",
        }

    # Default fallback — used by all other request types
    return {
        "intro_message": None,
        "action_message": None,
        "button_label": "Review & Approve",
    }
```

### `approved_result_message_for_request_type()` — customise the "Request Approved" email body

```python
def approved_result_message_for_request_type(request_type: str, action: str) -> str | None:
    if action != "approved":
        return None

    if request_type == "work_initiation":
        return (
            "Your Work Initiation has been fully approved. You can now raise "
            "a Work Authorization request from the Safety Work Authorization page."
        )

    # Add your own block here for work_authorization, work_closeout, etc.

    return None  # Default: no custom message
```

These functions are the **only place** you need to touch to change email content for a specific module. No changes to templates, no changes to the engine.

---

## Summary of Action Required

In each of the three safety routers, remove the manual `workflow_email.*` calls (and the import if it becomes unused). The engine will handle all notifications from that point on, with any custom copy already in place via the dispatch functions above.

No changes to email templates, no changes to the engine, and no loss of customisation capability.
