# Workflow Integration Guide

For developers building or migrating an approval process (leave, safety, invoices, etc.)
on the Portland Gas workflow engine.

---

## Why this system exists — the problem we solved

Before this system, each module (procurement, safety, etc.) sent emails by calling
`workflow_email.*` functions manually — from the router, after each action, every
time. This created two problems:

**Problem 1 — Duplicate emails.**
The workflow engine already sends emails internally when you call `engine.start()`,
`engine.approve()`, `engine.reject()`, or `engine.return_()`. If you also call
`workflow_email.*` manually from the router, the same person gets two emails for
every action.

**Problem 2 — Scattered email copy.**
The subject line for a work initiation request lived in `workflow_email.py`, the
button label lived somewhere else, and the body copy was hardcoded. If you wanted
to change the wording for your process, you had to edit shared files — which
affected every other module.

**The solution: a single contract + a single file per module.**

The engine now owns *when* emails are sent. You never call `workflow_email.*` yourself.
You only create one file — `your_module/email_content.py` — that answers: *what
should this email say?* Everything else is handled for you.

---

## The contract — what the engine sends automatically

When you call any engine method, it queues the appropriate emails. They fire only
*after* `db.commit()` succeeds. If the commit fails, no emails are sent.

```
engine.start()
    → queues: notify_submitted     (to the requester: "your request is in review")
    → queues: notify_step_assigned (to step 1 approver: "action required")

engine.approve()  [mid-flow step]
    → queues: notify_step_progress (to the requester: "step N approved, step N+1 next")
    → queues: notify_step_assigned (to next step's approver: "action required")

engine.approve()  [final step]
    → queues: notify_request_result("approved") (to the requester: "fully approved")

engine.reject()
    → queues: notify_request_result("rejected") (to the requester: "rejected")

engine.return_()
    → queues: notify_request_result("returned") (to the requester: "returned for revision")
```

**You do not call any of these. The engine calls them for you.**

---

## Division of labour — the three files

```
┌─────────────────────────────────────────────────────────────────┐
│  workflow_engine.py          WHEN                               │
│                                                                 │
│  "A step was approved. A request was submitted."                │
│  Decides when to send an email. Knows nothing about the         │
│  content. Queues the right notify_* function after commit.      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  workflow_email.py           HOW                                │
│                                                                 │
│  "Load the data. Figure out who to email. Ask the module what  │
│  to say. Build the email. Send it."                            │
│  Same mechanics for every request type. Never changes.         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  your_module/email_content.py    WHAT                          │
│                                                                 │
│  "Here is the subject. Here is the body. Here is the button."  │
│  You write this file. You own it entirely.                     │
│  It only answers questions — it never sends anything itself.   │
└─────────────────────────────────────────────────────────────────┘
```

**Rule of thumb:**
- If you are calling `workflow_email.*` from your router — **stop**. That is wrong.
  The engine already does this.
- If you are editing `workflow_email.py` for email copy — **stop**. That is wrong.
  Your module's copy lives in `your_module/email_content.py`.
- If you are editing `workflow_engine.py` for email reasons — **stop**. That is wrong.

---

## If you have existing code — the migration

> This section is for modules that already have manual `workflow_email.*` calls in
> their router (work_initiation, work_authorization, work_closeout). If you are
> starting fresh, skip to the next section.

### What the old code looks like

```python
# ❌ OLD — work_initiations/router.py (what NOT to do)

def create_work_initiation(data, db, current_user):
    record = work_initiation_service.create_work_initiation(db, data, current_user)
    workflow_email.notify_new_request(db, "work_initiation", record.id)  # ← DELETE THIS
    return WorkInitiationResponse.from_model(record)

def supervisor_review_work_initiation(work_initiation_id, data, db, current_user):
    record, approval_request_id = work_initiation_service.supervisor_review_work_initiation(...)
    if data.decision == approve:
        workflow_email.notify_step_assigned(db, approval_request_id)       # ← DELETE THIS
    elif data.decision == return_:
        workflow_email.notify_request_result(db, approval_request_id, "returned", ...)  # ← DELETE THIS
    else:
        workflow_email.notify_request_result(db, approval_request_id, "rejected", ...)  # ← DELETE THIS
    return WorkInitiationResponse.from_model(record)
```

### Why this causes duplicate emails

Inside `work_initiation_service.create_work_initiation()`, the service calls
`engine.start()`. The engine immediately registers `notify_submitted` and
`notify_step_assigned` to fire when the DB commits. The service then calls
`db.commit()`, and the two emails fire.

Then the router calls `workflow_email.notify_new_request()` — which calls
`notify_step_assigned()` **again**. The step 1 approver receives two identical emails.

Same pattern for approve/reject/return: the service already commits and the engine
already fires the emails; the router fires them a second time.

### What to do — step by step

**Step 1 — Delete every `workflow_email.*` call from your router.**

```python
# ✅ NEW — work_initiations/router.py

def create_work_initiation(data, db, current_user):
    record = work_initiation_service.create_work_initiation(db, data, current_user)
    # No email call here. The engine queued it. It fires on commit.
    return WorkInitiationResponse.from_model(record)

def supervisor_review_work_initiation(work_initiation_id, data, db, current_user):
    record, approval_request_id = work_initiation_service.supervisor_review_work_initiation(...)
    # No email call here. engine.approve() / engine.return_() / engine.reject()
    # already queued the right email inside the service. It fires on commit.
    return WorkInitiationResponse.from_model(record)
```

Remove these calls from **every endpoint** in your router:
- `workflow_email.notify_new_request(...)`
- `workflow_email.notify_submitted(...)`
- `workflow_email.notify_step_assigned(...)`
- `workflow_email.notify_step_progress(...)`
- `workflow_email.notify_request_result(...)`

You do not need to import `workflow_email` in your router at all.

**Step 2 — Create your email content file.**

See "Adding your module" below.

**Step 3 — Register your module.**

See "Adding your module" below.

That is the full migration. No service changes. No engine changes. Just delete the
router calls, create one content file, add one line to the registry.

---

## If you are starting fresh — the simple path

You never call `workflow_email.*` from your module. Ever.

Your module does three things:

1. Call `engine.start()` when a request is submitted. The engine sends the emails.
2. Call `engine.approve()` / `engine.reject()` / `engine.return_()` when an approver
   acts. The engine sends the emails.
3. Create `your_module/email_content.py` to control what the emails say.

That is all.

---

## A concrete walkthrough — procurement request submitted

This traces every line of code when an employee submits a procurement request
and two emails go out: one to the employee, one to the first approver.

### 1. The service calls engine.start() then commits

```python
# procurement/service.py
def create_request(data, employee, db):
    req = ProcurementRequest(...)
    db.add(req)
    db.flush()

    engine = WorkflowEngine(db)
    engine.start(
        request_type="procurement",
        request_id=req.id,
        title=f"...",
        requester=employee,
    )
    db.commit()   # ← emails fire here
    return req
```

### 2. engine.start() registered two email callbacks

Inside `engine.start()`, before returning, these two lines run:

```python
# workflow_engine.py (inside engine.start())
self._queue_email(lambda db: workflow_email.notify_submitted(db, _ar_id))
self._queue_email(lambda db: workflow_email.notify_step_assigned(db, _ar_id))
```

`_queue_email` hooks into SQLAlchemy's `after_commit` event with `once=True`. The
moment `db.commit()` succeeds, both callbacks fire — each with a **fresh** database
session. The original request session is already committed and closed; the fresh
session is clean and safe to query.

If `db.commit()` fails (database error), the event never fires and no emails are
sent. Data and emails are always in sync.

### 3. notify_submitted runs — emails the requester

```python
# workflow_email.py
def notify_submitted(db, approval_request_id):
    ar        = db.query(ApprovalRequest)...   # the approval record
    requester = db.query(Employee)...          # "Jane Doe"
    title     = "Consumables — PRQ-0001"
    step      = StepContext(step_number=1, step_name="Operating Manager", total_steps=4)

    ctx = {"db": db, "ar": ar, "requester_name": "Jane Doe", "step": step, ...}

    # Ask procurement: "what should this email's subject line say?"
    override = _call_hook("procurement", "on_submitted", ctx)
    #   → looks up _CONTENT_REGISTRY["procurement"]
    #   → imports app.procurement.email_content
    #   → calls on_submitted(ctx)
    #   → returns {"subject": "Purchase Request Submitted — PRQ-0001"}

    subject = override.get("subject") or "Procurement Request Submitted"
    # → "Purchase Request Submitted — PRQ-0001"

    html = email_service._render("request_submitted.html", { ... })
    email_service._send("jane.doe@portlandgas.com", subject, html)
```

### 4. Your content file answered the question

```python
# procurement/email_content.py
def on_submitted(ctx):
    req = _get_req(ctx["db"], ctx["ar"].request_id)
    return {
        "subject": f"Purchase Request Submitted — {req.reference}",
    }
```

That is it. One function. Returns a dict. The rest is handled for you.

### 5. notify_step_assigned runs — emails the approver

`workflow_email.py` looks up who the step 1 approver is (from `ApprovalStepAssignment`),
builds a `ctx` dict, calls `_call_hook("procurement", "on_step_assigned", ctx)`, and
sends the result. Your content file provides the intro copy and button label. The
plumbing is invisible to you.

---

## What the email looks like vs. where each part comes from

```
┌──────────────────────────────────────────────────────────────┐
│  Portland Gas Limited          [logo]                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Hi John Smith,              ← approver_name  (workflow_email loads this)
│                                                              │
│  A purchase request from     ← intro_message  (YOUR email_content.py)
│  Jane Doe requires your                                      │
│  approval. Vendor: XYZ Ltd.                                  │
│  Estimated amount: ₦500,000.                                 │
│                                                              │
│  Click the button to open    ← action_message (YOUR email_content.py)
│  the request and review it.                                  │
│                                                              │
│  ┌──────────────────────────┐                               │
│  │  Review Purchase Request  │ ← button_label (YOUR email_content.py)
│  └──────────────────────────┘                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

`workflow_email.py` always decides **who** receives the email.
Your content file always decides **what** the email says.

---

## Adding your module — step by step

### Step 1 — Register your request_type

Open `app/shared/services/workflow_email.py` and add one line to `_CONTENT_REGISTRY`:

```python
_CONTENT_REGISTRY: dict[str, str] = {
    "procurement":        "app.procurement.email_content",
    "work_initiation":    "app.safety.work_initiation_email_content",   # ← yours
    "work_authorization": "app.safety.work_authorization_email_content", # ← yours
    "leave":              "app.leave.email_content",                     # ← yours
}
```

### Step 2 — Create your content file

Create `app/your_module/email_content.py`. Use this as your starting template:

```python
"""
<YourModule> email content.

Hooks receive a `ctx` dict. See docs/workflow_integration_guide.md
for available ctx keys per hook.

IMPORTANT: Never call workflow_email or email_service here.
Just return a dict. The sending is handled for you.
"""
import logging
logger = logging.getLogger(__name__)


def _get_req(db, request_id):
    """Load your module's record. Add eager-loads as needed."""
    from app.your_module.models import YourRequest
    return db.query(YourRequest).filter(YourRequest.id == request_id).first()


def on_submitted(ctx) -> dict | None:
    try:
        req = _get_req(ctx["db"], ctx["ar"].request_id)
        if not req:
            return None
        return {
            "subject": f"Your Request Submitted — {req.reference}",
        }
    except Exception:
        logger.exception("on_submitted failed")
        return None


def on_step_assigned(ctx) -> dict | None:
    try:
        req = _get_req(ctx["db"], ctx["ar"].request_id)
        if not req:
            return None
        step = ctx["step"]
        return {
            "intro_message": (
                f"A request from {ctx['requester_name']} requires your approval "
                f"at step {step.step_number}: {step.step_name}."
            ),
            "button_label": "Review Request",
        }
    except Exception:
        logger.exception("on_step_assigned failed")
        return None


# Add on_step_progress, on_approved, on_rejected, on_returned as needed.
# Return None from any hook to use the generic default for that email.
```

### Step 3 — Implement only what you need

You do not have to implement all six hooks. If you skip a hook, the generic fallback
sends a reasonable default email. Start with `on_step_assigned` (most visible to
approvers) and add others as needed.

### Step 4 — Use lazy imports inside functions

Always import your models **inside** the function, not at the top of the file.
This prevents circular import errors:

```python
# ✅ Correct
def on_submitted(ctx):
    from app.leave.models import LeaveRequest   # ← inside the function
    req = ...

# ❌ Wrong
from app.leave.models import LeaveRequest       # ← top of file, causes circular import
```

### Step 5 — Test

Submit a request of your type and check the server logs. Even if Brevo is not
configured, you will see:

```
WARNING email_service: BREVO_API_KEY not set — email not sent.
         To: approver@portlandgas.com | Subject: Work Initiation Submitted — WI-2026-0001
```

That confirms your hook ran and returned the right subject.

---

## The six hooks and what they control

Every hook receives a `ctx` dict and returns a dict of overrides (or `None`).

| Hook | Who receives the email | What you can override |
|---|---|---|
| `on_submitted` | Requester | `subject` |
| `on_step_assigned` | Current step's approver | `subject`, `intro_message`, `action_message`, `button_label` |
| `on_step_progress` | Requester (step N just approved) | `subject`, `approver_name` |
| `on_approved` | Requester (final approval) | `subject`, `result_message` |
| `on_rejected` | Requester | `subject`, `result_message` |
| `on_returned` | Requester | `subject`, `result_message` |

`workflow_email.py` always controls **who** receives the email.
Your content file always controls **what** the email says.

### ctx keys available in each hook

```
on_submitted:     db, ar, requester_name, step, request_title
on_step_assigned: db, ar, approver_name, requester_name, step, request_title
on_step_progress: db, ar, completed_step, next_step, approver_name, request_title
on_approved:      db, ar, request_title
on_rejected:      db, ar, request_title, comment
on_returned:      db, ar, request_title, comment
```

`ar` is the `ApprovalRequest` object. Use `ar.request_id` to load your module's
own record from the database.

---

## StepContext

`step`, `completed_step`, and `next_step` are all `StepContext` objects:

```python
@dataclass
class StepContext:
    step_number:  int   # e.g. 3
    step_name:    str   # e.g. "Procurement Officer"
    total_steps:  int   # e.g. 4
```

Common patterns:

```python
step.step_number == 1                        # first step
step.step_number == step.total_steps         # last step (final action)
step.step_number == step.total_steps - 1     # second-to-last step
"finance" in step.step_name.lower()          # step name contains "finance"
```

### Example — procurement uses step position for email branching

The same `on_step_assigned` function handles ALL steps in the procurement workflow.
It uses `step.step_number` and `step.total_steps` to write different copy for each:

```python
def on_step_assigned(ctx):
    step = ctx["step"]

    # Second-to-last step = Procurement Officer issues a PO
    if step.step_number == step.total_steps - 1:
        return {
            "intro_message": "...requires you to issue a Purchase Order...",
            "button_label":  "Review & Issue PO",
        }

    # Last step = confirm delivery
    if step.step_number == step.total_steps:
        return {
            "intro_message": "...please confirm goods have been received.",
            "button_label":  "Confirm Delivery",
        }

    # Any other step = regular approval
    return {
        "intro_message": "A purchase request requires your approval...",
        "button_label":  "Review Purchase Request",
    }
```

This works regardless of how many steps are in the workflow. You can add or remove
steps in the admin panel without touching this file, as long as the relative
position of special steps stays consistent.

---

## What happens if you return None

Returning `None` from a hook is always safe. The system has three fallback levels:

```
Your hook returns None
    → dispatcher tries generic_email_content.py
        → generic returns None
            → workflow_email.py uses its own built-in defaults
```

You only need to override what matters to your module. You can return a partial
dict too — only the keys you include are overridden:

```python
def on_submitted(ctx):
    return {"subject": f"Leave Request Submitted — {get_ref(ctx)}"}
    # body and button use generic defaults
```

---

## Checklist — migrating existing code

Use this to audit your module before committing.

**In your router:**
- [ ] No import of `workflow_email`
- [ ] No call to `workflow_email.notify_new_request(...)`
- [ ] No call to `workflow_email.notify_submitted(...)`
- [ ] No call to `workflow_email.notify_step_assigned(...)`
- [ ] No call to `workflow_email.notify_step_progress(...)`
- [ ] No call to `workflow_email.notify_request_result(...)`

**In your service:**
- [ ] `engine.start()` is called before `db.commit()` (not after)
- [ ] `engine.approve()` / `engine.reject()` / `engine.return_()` are called before `db.commit()`
- [ ] No manual `workflow_email.*` calls here either

**New file — your email content:**
- [ ] `app/your_module/email_content.py` created
- [ ] Registered in `_CONTENT_REGISTRY` in `workflow_email.py`
- [ ] All model imports are inside functions, not at the top of the file
- [ ] Every hook that can fail is wrapped in `try/except` returning `None`

---

## Checklist — starting fresh

**In your service:**
- [ ] Call `engine.start()` when submitting, before `db.commit()`
- [ ] Call `engine.approve()` / `engine.reject()` / `engine.return_()` on approver actions, before `db.commit()`
- [ ] No `workflow_email.*` anywhere in your service or router

**New file — your email content:**
- [ ] `app/your_module/email_content.py` created
- [ ] Registered in `_CONTENT_REGISTRY` in `workflow_email.py`
- [ ] All model imports are inside functions
- [ ] Every hook wrapped in `try/except`

---

## Quick reference — what each file owns

| Question | File |
|---|---|
| When does an email get triggered? | `workflow_engine.py` |
| Who receives the email? | `workflow_email.py` |
| What does the email say? | `your_module/email_content.py` |
| What is the fallback if my module has no content file? | `generic_email_content.py` |
| Where do I register my module? | `_CONTENT_REGISTRY` in `workflow_email.py` |
| Where is the HTML template? | `app/templates/email/` |
| Do I call workflow_email from my router? | **No. Never.** |
| Do I call workflow_email from my service? | **No. Never.** |

---

## Reference implementation

`app/procurement/email_content.py` is the first and most complete example.
Read it alongside this guide. It shows:

- How to load your module's record inside a hook (`_get_req`)
- How to branch by step position (`total_steps - 1` for Issue PO)
- How to include dynamic values like reference numbers and vendor names
- How to handle exceptions safely so email failures never crash the API
