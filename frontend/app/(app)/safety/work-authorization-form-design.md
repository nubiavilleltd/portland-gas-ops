# Work Authorization Form — Design Implementation Brief

## Project Context

This document describes the **design-only implementation** for the **Work Authorization Form**.

The codebase is **Next.js + FastAPI**, but this phase is only concerned with the **frontend form design and mock data flow**.

Do **not** implement real backend logic yet.

---

## 1. Scope for This Phase

### Build now

- Form UI
- Section layout
- Mock requester data
- Mock status changes
- Mock approval sections
- Mock HSE inspection acknowledgement
- Mock audit trail
- Mock uploaded images/documents
- Disabled/read-only states for role-based sections

### Do not build yet

- Real API calls
- Real CRUD functionality
- Real database persistence
- Real approval routing
- Real file upload persistence
- Real employee lookup integration
- Real audit trail saving
- Real notification/email logic

---

## 2. Form Purpose

The **Work Authorization Form** is used when a requester needs approval to carry out work inside the facility.

The process is:

```text
Requester submits work request
        ↓
Supervisor reviews and approves the work scope
        ↓
HSE personnel physically inspect the work area
        ↓
HSE enters inspection acknowledgement in the system
        ↓
HSE gives final approval
```

---

## 3. Status Flow

Use the same simple status flow:

```text
Draft → Submitted → Pending Approval → Approved
```

### Status meaning

| Status | Meaning |
|---|---|
| Draft | Requester is still filling the form |
| Submitted | Requester has submitted the request; supervisor needs to review |
| Pending Approval | Supervisor has approved; HSE needs to inspect and approve |
| Approved | HSE has completed inspection acknowledgement and approved the request |

### Optional support statuses

These may exist as UI states, but they should not complicate the main flow.

| Status | Meaning |
|---|---|
| Returned | Supervisor or HSE returned the request for correction |
| Rejected | Supervisor or HSE rejected the request |
| Cancelled | Requester cancelled the request |

---

## 4. Role-Based Flow

| Role | What they can fill |
|---|---|
| Requester | Requester Details, Request Details, Work Details, Risk/Safety Indicators, Attachments |
| Supervisor | Supervisor Approval Section only |
| HSE Personnel | HSE Inspection Acknowledgement and HSE Final Approval |

### Important rule

The **HSE Inspection Acknowledgement** section should only become editable after the supervisor has approved the request.

Before supervisor approval, show it as disabled/locked with helper text:

```text
HSE inspection will be available after supervisor approval.
```

---

## 5. Page Structure

The form should be arranged in this order:

```text
1. Form Header
2. Status Stepper
3. Requester Details
4. Request Details
5. Work Details
6. Risk & Safety Indicators
7. Attachments / Images
8. Supervisor Approval
9. HSE Inspection Acknowledgement
10. HSE Final Approval
11. Audit Trail
```

---

## 6. Form Header

### Display fields

| Field | Type | Notes |
|---|---|---|
| Form title | Text/display | `Work Authorization Request` |
| Short description | Text/display | Explain that work must be approved before starting |
| Status badge | Status badge | Draft, Submitted, Pending Approval, Approved |
| Request reference | Read-only display | **Do not show during initial creation** |

### Request reference behavior

The request reference should **not show when the requester is creating a new request**.

Reason: the reference will be empty before the request is submitted/generated.

Show the request reference only after submission or during approval/review states.

Example:

```text
During creation:
Status: Draft
Reference: hidden

After submission:
Status: Submitted
Reference: WA-2026-0001
```

---

## 7. Status Stepper

Display a simple stepper near the top of the form.

```text
Draft → Submitted → Pending Approval → Approved
```

For review screens, the active step should reflect the mock status.

---

# 8. Section One: Requester Details

## Purpose

This section shows who is making the request.

In the real system, these values will come from the logged-in employee profile. For now, use hard-coded mock data.

## UI rule

Do **not** show the following fields in the UI:

- Employee ID
- Email
- Phone

These can exist in mock data internally if useful, but they should not be displayed in the form UI.

## Fields to display

| Field | Type | Required | Notes |
|---|---|---:|---|
| Requester name | Read-only text | Yes | Auto-filled from mock/logged-in user |
| Department | Read-only text | Yes | Auto-filled from mock/logged-in user |
| Job title / role | Read-only text | Yes | Auto-filled from mock/logged-in user |
| Request date | Read-only date/time | Yes | Auto-generated/mock |

## Mock data

```js
const mockRequester = {
  name: "Daniel Okoro",
  department: "Engineering",
  role: "CNG Conversion Technician",
  requestDate: "2026-05-18 09:30 AM"
};
```

---

# 9. Section Two: Request Details

## Purpose

This section captures the basic information about where and when the work will happen.

## Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| Request title | Text input | Yes | Short title for the request |
| Work location | Creatable dropdown | Yes | Select from existing locations or add a new one |
| Exact work area | Text input | Yes | More specific location description |
| Expected start date/time | Date/time picker | Yes | Planned start time |
| Expected end date/time | Date/time picker | Yes | Planned end time |
| Supervisor | Person lookup | Yes | Selected supervisor who will approve first |
| Priority | Dropdown | Yes | Low, Medium, High, Critical |

## Work location options

This should be a **creatable dropdown** because new locations may need to be added.

```js
const workLocationOptions = [
  "Conversion Bay 1",
  "Conversion Bay 2",
  "Vehicle Yard",
  "Gas Storage Area",
  "Maintenance Workshop",
  "Electrical Room",
  "Loading Area",
  "Inspection Bay"
];
```

## Priority options

```js
const priorityOptions = [
  "Low",
  "Medium",
  "High",
  "Critical"
];
```

---

# 10. Section Three: Work Details

## Purpose

This section captures the actual work to be performed.

## Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| Type of work | Creatable multi-select | Yes | Select one or more work types; user can add custom values |
| Work description | Textarea | Yes | Explain what will be done |
| Reason for work | Textarea | Yes | Explain why the work is needed |
| Workers involved | Person lookup / multi-person lookup | Yes | Select internal workers involved |
| Contractor required? | Yes/No | Yes | If yes, show contractor fields |
| Contractor name | Creatable dropdown | Conditional | Required if contractor required is Yes |
| Contractor contact person | Text input | Conditional | Optional but useful if contractor is involved |
| Tools/equipment required | Creatable multi-select | Yes | Select common tools or add custom tools |
| Special instructions | Textarea | No | Any special note for supervisor or HSE |

## Type of work options

This should be a **creatable multi-select**.

```js
const workTypeOptions = [
  "CNG Conversion",
  "CNG Cylinder Work",
  "Gas System Work",
  "Electrical Work",
  "Hot Work",
  "Lifting Work",
  "Vehicle Inspection",
  "Transport Preparation",
  "Maintenance",
  "Calibration",
  "General Engineering Work"
];
```

## Tools/equipment options

This should be a **creatable multi-select**.

```js
const toolsEquipmentOptions = [
  "Hand Tools",
  "Diagnostic Tool",
  "Welding Machine",
  "Grinding Machine",
  "Cylinder Lifting Equipment",
  "Gas Detector",
  "Pressure Gauge",
  "Electrical Tester",
  "Torque Wrench",
  "PPE Kit"
];
```

## Contractor name behavior

`Contractor name` should be a **creatable dropdown** because the contractor may not already exist in the list.

Example options:

```js
const contractorOptions = [
  "ABC Engineering Services",
  "SafeGas Technical Ltd",
  "Prime Mechanical Contractors"
];
```

---

# 11. Section Four: Risk & Safety Indicators

## Purpose

The requester should flag obvious safety concerns. This does not replace HSE inspection.

Keep this section short.

## Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| Is gas/CNG/LNG involved? | Yes/No | Yes | Important risk flag |
| Is a pressurized system involved? | Yes/No | Yes | Important for CNG/LNG work |
| Will the work involve heat, sparks, welding, cutting, or grinding? | Yes/No | Yes | Hot work flag |
| Is electrical isolation required? | Yes/No | Yes | Electrical safety flag |
| Is lifting/heavy equipment involved? | Yes/No | Yes | Lifting risk flag |
| Additional safety note | Textarea | No | Optional extra concern from requester |

---

# 12. Section Five: Attachments / Images

## Purpose

Allow requester to attach images and supporting documents.

For now, this should be mock-only.

## Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| Work area images | File/image upload mock | No | Show mock uploaded image cards |
| Supporting documents | File upload mock | No | Method statement, drawings, checklist, etc. |
| Attachment notes | Textarea | No | Optional note explaining attachments |

## Mock attachment display

Example uploaded cards:

```text
bay-2-before-work.png
method-statement.pdf
cylinder-bracket-photo.jpg
```

---

# 13. Section Six: Supervisor Approval

## Purpose

The supervisor reviews the work scope and approves, returns, or rejects it.

The supervisor is **not** completing the HSE inspection.

## When editable

This section should be editable only when:

```text
status === "Submitted"
```

## Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| Supervisor name | Read-only / person lookup | Yes | Selected in Request Details |
| Supervisor decision | Dropdown | Yes | Approve, Return, Reject |
| Supervisor comment | Textarea | Conditional | Required if Return or Reject |
| Supervisor approval date/time | Read-only date/time | No | Mock auto-filled after decision |

## Decision options

```js
const approvalDecisionOptions = [
  "Approve",
  "Return",
  "Reject"
];
```

## Mock status rule

```text
Requester submits form → Submitted
Supervisor approves → Pending Approval
```

---

# 14. Section Seven: HSE Inspection Acknowledgement

## Purpose

HSE personnel physically inspect the work environment, then come back to the system and acknowledge the inspection.

This section should not be filled by the requester or supervisor.

## When editable

This section should become editable only when:

```text
status === "Pending Approval"
```

Before then, show it locked/disabled.

## Fields

Only show the 5 most important checks.

| Field | Type | Required | Notes |
|---|---|---:|---|
| Work area is safe, clean, and accessible | Pass/Fail/N/A | Yes | HSE confirms the environment is okay |
| Fire extinguisher/emergency equipment is available | Pass/Fail/N/A | Yes | Important for gas-related work |
| Gas leak/pressure/abnormal condition check completed | Pass/Fail/N/A | Yes | Core CNG/LNG safety check |
| Required PPE and safety kits are available | Pass/Fail/N/A | Yes | Confirms protective equipment readiness |
| Tools/equipment are safe and suitable for the job | Pass/Fail/N/A | Yes | Confirms tools are suitable and safe |
| Inspection date/time | Date/time picker | Yes | When HSE physically inspected |
| Inspection comments | Textarea | Conditional | Required if any check fails |
| Inspection evidence/images | File upload mock | No | Mock only |
| Inspection result | Dropdown | Yes | Passed, Returned, Failed |

## Inspection check options

```js
const inspectionCheckOptions = [
  "Pass",
  "Fail",
  "N/A"
];
```

## Inspection result options

```js
const inspectionResultOptions = [
  "Passed",
  "Returned",
  "Failed"
];
```

---

# 15. Section Eight: HSE Final Approval

## Purpose

After completing the inspection acknowledgement, HSE gives final approval.

## When editable

This section should be editable when:

```text
status === "Pending Approval"
```

## Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| HSE approver | Person lookup / read-only | Yes | HSE personnel reviewing |
| HSE decision | Dropdown | Yes | Approve, Return, Reject |
| HSE comment | Textarea | Conditional | Required if Return or Reject |
| HSE approval date/time | Read-only date/time | No | Mock auto-filled after decision |

## Mock status rule

```text
HSE approves → Approved
```

---

# 16. Section Nine: Audit Trail

## Purpose

Show a read-only record of actions taken on the request.

For now, this is mock data only.

## Fields to display

| Field | Type |
|---|---|
| Action | Text |
| Actor | Text |
| Role | Text |
| Date/time | Text |
| Comment | Text |

## Mock audit trail

```js
const mockAuditTrail = [
  {
    action: "Submitted",
    actor: "Daniel Okoro",
    role: "Requester",
    dateTime: "2026-05-18 09:30 AM",
    comment: "Work authorization request submitted."
  },
  {
    action: "Supervisor Approved",
    actor: "Mary James",
    role: "Supervisor",
    dateTime: "2026-05-18 10:15 AM",
    comment: "Work scope reviewed and approved."
  },
  {
    action: "HSE Inspection Completed",
    actor: "Samuel Bassey",
    role: "HSE Officer",
    dateTime: "2026-05-18 11:00 AM",
    comment: "Inspection completed. Area safe for work."
  },
  {
    action: "HSE Approved",
    actor: "Samuel Bassey",
    role: "HSE Officer",
    dateTime: "2026-05-18 11:05 AM",
    comment: "Work authorization approved."
  }
];
```

---

# 17. Mock Data Object

Use this only for illustrating the data flow.

```js
const mockWorkAuthorization = {
  id: "WA-2026-0001", // Generated after submission, not shown during creation
  status: "Pending Approval",
  requester: {
    name: "Daniel Okoro",
    department: "Engineering",
    role: "CNG Conversion Technician",
    requestDate: "2026-05-18 09:30 AM"
  },
  requestDetails: {
    title: "CNG cylinder installation on vehicle",
    workLocation: "Conversion Bay 2",
    exactWorkArea: "Left-side inspection pit",
    expectedStartDateTime: "2026-05-18 10:00 AM",
    expectedEndDateTime: "2026-05-18 01:00 PM",
    supervisor: "Mary James",
    priority: "High"
  },
  workDetails: {
    typeOfWork: ["CNG Conversion", "CNG Cylinder Work"],
    description: "Installation and inspection of CNG cylinder mounting brackets.",
    reasonForWork: "Vehicle is scheduled for petrol-to-CNG conversion.",
    workersInvolved: ["Daniel Okoro", "Ibrahim Musa"],
    contractorRequired: false,
    contractorName: "",
    contractorContactPerson: "",
    toolsEquipmentRequired: ["Hand Tools", "Torque Wrench", "Gas Detector"],
    specialInstructions: "Ensure cylinder mount points are inspected before installation."
  },
  riskIndicators: {
    gasInvolved: true,
    pressurizedSystem: true,
    heatOrSparks: false,
    electricalIsolation: false,
    liftingEquipment: true,
    additionalSafetyNote: "Cylinder handling required."
  },
  attachments: [
    "bay-2-before-work.png",
    "method-statement.pdf"
  ],
  supervisorApproval: {
    supervisorName: "Mary James",
    decision: "Approve",
    comment: "Work scope reviewed and approved.",
    dateTime: "2026-05-18 10:15 AM"
  },
  hseInspection: {
    workAreaSafeCleanAccessible: "Pass",
    emergencyEquipmentAvailable: "Pass",
    gasPressureCheckCompleted: "Pass",
    ppeAndSafetyKitsAvailable: "Pass",
    toolsEquipmentSafeSuitable: "Pass",
    inspectionDateTime: "2026-05-18 11:00 AM",
    comments: "Area inspected and cleared for work.",
    evidence: ["hse-inspection-photo.jpg"],
    result: "Passed"
  },
  hseApproval: {
    hseApprover: "Samuel Bassey",
    decision: "Pending",
    comment: "",
    dateTime: ""
  },
  auditTrail: mockAuditTrail
};
```

---

# 18. Lookup Fields

The following fields should behave like lookups later. For now, use mock arrays.

## Employee/person lookup

Used for:

- Supervisor
- Workers involved
- HSE approver

```js
const employeeOptions = [
  { id: "EMP-001", name: "Daniel Okoro", department: "Engineering", role: "CNG Conversion Technician" },
  { id: "EMP-002", name: "Mary James", department: "Engineering", role: "Engineering Supervisor" },
  { id: "EMP-003", name: "Samuel Bassey", department: "HSE", role: "HSE Officer" },
  { id: "EMP-004", name: "Grace Bello", department: "Operations", role: "Operations Officer" },
  { id: "EMP-005", name: "Ibrahim Musa", department: "Engineering", role: "Technician" }
];
```

---

# 19. Creatable Dropdown Fields

These fields should allow the user to select an existing option or type in a new value.

| Field | Component type |
|---|---|
| Work location | Creatable dropdown |
| Type of work | Creatable multi-select |
| Contractor name | Creatable dropdown |
| Tools/equipment required | Creatable multi-select |

---

# 20. Suggested Reusable Components

Use existing reusable components in the codebase where available.

If a reusable component does not already exist, create one later.

| Component | Purpose |
|---|---|
| TextInput | Standard text field |
| TextArea | Long text field |
| SelectInput | Normal dropdown |
| CreatableSelectInput | Select or add custom option |
| CreatableMultiSelectInput | Select multiple or add custom options |
| DateTimePicker | Date and time input |
| ToggleInput | Yes/No fields |
| PersonLookup | Employee/person selector |
| FileUploadMock | Mock image/document upload |
| StatusBadge | Show current status |
| StatusStepper | Show Draft → Submitted → Pending Approval → Approved |
| ReadOnlyField | Display auto-filled values |
| AuditTrail | Show mock action timeline |

---

# 21. Suggested UI Behavior

## Creation state

When creating a request:

- Status should show `Draft`.
- Request reference should be hidden.
- Requester Details should show only:
  - Requester name
  - Department
  - Job title / role
  - Request date
- Supervisor Approval should be visible but disabled or collapsed.
- HSE sections should be visible but disabled/locked or collapsed.

## Submitted state

After requester submits:

- Status becomes `Submitted`.
- Request reference can now be displayed.
- Supervisor Approval becomes available to supervisor.
- HSE sections remain locked.

## Pending Approval state

After supervisor approves:

- Status becomes `Pending Approval`.
- HSE Inspection Acknowledgement becomes available.
- HSE Final Approval becomes available after or alongside inspection acknowledgement.

## Approved state

After HSE approves:

- Status becomes `Approved`.
- All fields become read-only.
- Audit trail shows full mock flow.

---

# 22. Final Flow Summary

```text
Requester fills:
- Requester Details
- Request Details
- Work Details
- Risk & Safety Indicators
- Attachments / Images

Requester submits
        ↓
Status: Submitted
Reference generated and displayed
        ↓
Supervisor fills:
- Supervisor decision
- Supervisor comment

Supervisor approves
        ↓
Status: Pending Approval
        ↓
HSE fills:
- Inspection acknowledgement
- Inspection result
- HSE decision
- HSE comment

HSE approves
        ↓
Status: Approved
```

---

# 23. Key Implementation Notes

1. This is **design-only**.
2. Do not implement real API calls yet.
3. Do not show employee ID, email, or phone in Requester Details UI.
4. Do not show request reference during initial creation.
5. Show request reference only after submission or during approval/review states.
6. HSE inspection fields should only be editable after supervisor approval.
7. Use mock data to demonstrate the full flow clearly.
8. Use creatable dropdowns where users may need to add values not already listed.
