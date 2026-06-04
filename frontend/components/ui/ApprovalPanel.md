# ApprovalPanel — Developer Guide

A reusable approval section component. Drop it into any request detail page to get a consistent approval UI. **It owns only the comment field state — all business logic stays in your page.**

---

## Import

```tsx
import ApprovalPanel from "@/components/ui/ApprovalPanel";
```

---

## Basic usage

```tsx
<ApprovalPanel
  reviewingAs="Operations Manager"
  onReturn={(comment) => updateStatus("returned", comment)}
  onReject={(comment) => updateStatus("rejected", comment)}
  onApprove={(comment) => updateStatus("approved", comment)}
/>
```

This renders the full panel: comment field + Return, Reject, Approve buttons.

---

## Toggling built-in buttons

Every built-in button is shown by default. Hide any you don't need:

```tsx
<ApprovalPanel
  showReturn={false}   // hide Return
  showReject={false}   // hide Reject
  showApprove={false}  // hide Approve
  showComment={false}  // hide the comment field entirely
  ...
/>
```

---

## Changing button labels and icons

```tsx
import { FileText } from "lucide-react";

<ApprovalPanel
  reviewingAs="Procurement Officer"
  showReturn={false}
  approveLabel="Issue PO"
  approveIcon={<FileText size={14} />}
  onReject={(comment) => handleReject(comment)}
  onApprove={(comment) => handleIssuePO(comment)}
/>
```

---

## Adding extra fields (e.g. Payment Terms)

Use `extraFields` to inject any JSX above the comment field:

```tsx
<ApprovalPanel
  reviewingAs="Procurement Officer"
  extraFields={
    <div>
      <label>Payment Terms</label>
      <select value={terms} onChange={(e) => setTerms(e.target.value)}>
        <option value="Net 30">Net 30</option>
      </select>
    </div>
  }
  onApprove={(comment) => handleApprove(comment)}
/>
```

---

## Adding a custom button (e.g. Finance — Mark as Paid)

Use `extraActions` to add buttons with the same look. Pass whatever you want into `onClick`:

```tsx
import { Banknote } from "lucide-react";

<ApprovalPanel
  reviewingAs="Finance"
  showReturn={false}
  showReject={false}
  showApprove={false}
  showComment={false}
  extraActions={[
    {
      key: "mark_paid",
      label: "Mark as Paid",
      icon: <Banknote size={14} />,
      variant: "approve",            // approve | reject | return | neutral
      onClick: (comment) => markAsPaid(comment),
      loading: isPending,
    },
  ]}
/>
```

`onClick` receives the comment string. Use it or ignore it — up to you.

---

## Button variants

| variant   | Appearance                  |
|-----------|-----------------------------|
| `approve` | Purple solid (primary)      |
| `reject`  | Red outline                 |
| `return`  | Amber outline               |
| `neutral` | Gray outline                |

---

## Disabling all buttons (e.g. while a mutation is in flight)

```tsx
<ApprovalPanel
  disabled={updateStatus.isPending}
  ...
/>
```

Or disable individual buttons:

```tsx
<ApprovalPanel
  approveDisabled={!paymentTerms}   // block Approve until terms selected
  rejectDisabled={false}
  returnDisabled={false}
  ...
/>
```

---

## Loading state per button

```tsx
<ApprovalPanel
  approveLoading={updateStatus.isPending}
  ...
/>
```

---

## Full props reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | `"Approval Decision"` | Section heading |
| `description` | `string` | — | Subtitle below heading |
| `reviewingAs` | `string` | — | Replaces description with "Reviewing as X" |
| `extraFields` | `ReactNode` | — | JSX injected above comment field |
| `showComment` | `boolean` | `true` | Show/hide comment textarea |
| `commentLabel` | `string` | `"Comment (optional)"` | |
| `commentPlaceholder` | `string` | — | |
| `commentRequired` | `boolean` | `false` | |
| `commentMaxLength` | `number` | `500` | |
| `showReturn` | `boolean` | `true` | |
| `showReject` | `boolean` | `true` | |
| `showApprove` | `boolean` | `true` | |
| `returnLabel` | `string` | `"Return"` | |
| `rejectLabel` | `string` | `"Reject"` | |
| `approveLabel` | `string` | `"Approve"` | |
| `returnIcon` | `ReactNode` | RotateCcw | |
| `rejectIcon` | `ReactNode` | XCircle | |
| `approveIcon` | `ReactNode` | CheckCircle | |
| `onReturn` | `(comment: string) => void` | — | |
| `onReject` | `(comment: string) => void` | — | |
| `onApprove` | `(comment: string) => void` | — | |
| `returnLoading` | `boolean` | `false` | |
| `rejectLoading` | `boolean` | `false` | |
| `approveLoading` | `boolean` | `false` | |
| `returnDisabled` | `boolean` | `false` | |
| `rejectDisabled` | `boolean` | `false` | |
| `approveDisabled` | `boolean` | `false` | |
| `extraActions` | `ApprovalExtraAction[]` | `[]` | Custom buttons |
| `disabled` | `boolean` | `false` | Disable all buttons |
