# TypeScript Issues Resolution Log

Date: 2026-05-19

## Summary

Resolved the listed TypeScript failures and verified the project with:

```bash
npx tsc --noEmit
```

Result: passed with no TypeScript errors.

## Fixes

### `.next/types/validator.ts:411`

Cause: stale generated Next.js validator files referenced routes that no longer exist in the source tree.

Solution: removed the generated `.next` cache so Next/TypeScript can regenerate route validator files from the current app structure.

### `app/(app)/fleet/drivers/[id]/page.tsx:136`

Cause: the page compared `driver.status` to `"inactive"`, but `DriverStatus` does not include `"inactive"`.

Solution: changed the comparison to `"suspended"`, which is a valid `DriverStatus`.

### `app/(app)/fleet/drivers/new/page.tsx:54`

Cause: the new driver object inferred `status` as a generic string, which was not assignable to `DriverStatus`.

Solution: typed the object as `Driver` so `"available"` is preserved as a valid driver status literal.

### `app/(app)/fleet/vehicles/[id]/edit/page.tsx:50`

Cause: TypeScript could not guarantee `vehicle` was still defined inside `handleSave`.

Solution: added a null guard at the start of `handleSave`.

### `app/(app)/fleet/vehicles/new/page.tsx:55`

Cause: the new vehicle object inferred generic string fields and was missing required `last_service_date` and `next_service_date`.

Solution: typed the object as `Vehicle`, narrowed `type`, and supplied mock service dates.

### `app/(app)/invoices/new/page.tsx:417`

Cause: `FormDatePicker` was using `onChange`, which receives a native input change event, while `setValue` expects a string date value.

Solution: changed invoice date and due date handlers to use `onValueChange`.

### `app/(app)/payments/new/page.tsx:1461`

Cause: same date picker mismatch as invoices: `onChange` passed a native event where a string was expected.

Solution: changed the payment date handler to use `onValueChange`.

### `lib/mock/dispatches.ts:1`

Cause: imported `DispatchForm` from a missing legacy dispatch module path.

Solution: replaced the missing import with a local mock-only `DispatchForm` interface.

### `lib/modules/fleet/components/FleetHomeClient.tsx:17`

Cause: props and callback parameters were implicitly `any`.

Solution: added typed props for `vehicles`, `drivers`, `trips`, and `MetricCard`.

### `lib/modules/orders/hooks/useCreateOrderForm.ts:71`

Cause: the Zod resolver output type did not match the React Hook Form value type because the schema transformed string inputs into numbers.

Solution: kept order form values as strings and moved numeric validation into string refinements.

### `lib/modules/orders/schemas/create-order.schema.ts:55`

Cause: `invalid_type_error` is not supported by the installed Zod version.

Solution: replaced number transformation and unsupported params with string-based numeric refinements.

### `lib/services/api/orders.service.ts:365`

Cause: `UpdateOrderInput` can contain string `quantity` and `unit_price`, but `Order` requires numeric values.

Solution: normalized updated order quantity and unit price to numbers before assigning the updated object back into the mock order store.
