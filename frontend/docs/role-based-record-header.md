# RoleBasedRecordHeader

Use `RoleBasedRecordHeader` on request detail pages that need a mock role switcher and a record summary header.

## Import

```tsx
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
```

## Basic Usage

```tsx
type PageRole = "requester" | "hse";

const roles: { value: PageRole; label: string }[] = [
  { value: "requester", label: "Requester" },
  { value: "hse", label: "HSE Inspector" },
];

const [currentRole, setCurrentRole] = useState<PageRole>("requester");

<RoleBasedRecordHeader
  id={request.id}
  currentRole={currentRole}
  onRoleChange={setCurrentRole}
  roleLabel={currentRole === "hse" ? "HSE Inspector" : "Requester"}
  roles={roles}
  status={<ApprovalBadge status={request.status} />}
/>;
```

## RBAC Hide/Show

Use `currentRole` in your existing permissions:

```tsx
const canHseApprove = currentRole === "hse" && request.status === "submitted";

{canHseApprove ? <HseApprovalForm /> : null}
```

## Optional Props

- `recordLabel`: small uppercase label above the ID.
- `title`: extra record title shown below `Viewing as`.
- `switcherTitle`: custom title for the role switcher card.
- `switcherDescription`: custom helper text for the role switcher card.

```tsx
<RoleBasedRecordHeader
  id={request.id}
  currentRole={currentRole}
  onRoleChange={setCurrentRole}
  roleLabel="Operations Head"
  roles={roles}
  recordLabel="Work Close-Out"
  title={request.title}
  status={<ApprovalBadge status={request.status} />}
  switcherDescription="Switch roles to preview requester, supervisor, Operations Head, and HSE views."
/>;
```
