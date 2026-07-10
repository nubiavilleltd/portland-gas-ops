---
name: Do not edit PickerModal.tsx
description: PickerModal.tsx is owned by another developer — never edit it directly, only suggest fixes
type: feedback
---

Do not edit `frontend/components/ui/PickerModal.tsx` directly.

**Why:** It belongs to another developer on the team. Editing it without their knowledge could break their work or cause conflicts. The file also has a non-standard structure (large commented-out block at top, "use client" not at line 1) that makes it fragile to edits.

**How to apply:** If a fix is needed for PickerModal, describe the change clearly and tell the user to pass it along to the developer who owns the file. Same rule applies to any component that has a clear owner — check with the user before editing shared/unknown-owner components.
