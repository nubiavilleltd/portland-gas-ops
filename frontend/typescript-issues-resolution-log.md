# TypeScript Issues Resolution Log

Date: 2026-05-19

## Summary

Resolved the listed TypeScript failures and the follow-up Next.js prerender/React compiler issues around `useSearchParams`.

Verified with:

```bash
npx tsc --noEmit
npx eslint 'app/(auth)/login/page.tsx' 'app/(auth)/reset-password/page.tsx' 'app/(auth)/verify-otp/page.tsx' 'app/(app)/assets/requests/new/page.tsx' 'app/(app)/fleet/trips/new/page.tsx' 'app/(app)/invoices/new/page.tsx' 'app/(app)/payments/new/page.tsx'
```

Result: both passed.

`npm run build` was also attempted. The local build is blocked by Google Fonts fetch failure from `next/font` in this sandbox, but the `useSearchParams()` Suspense prerender errors no longer appear before that blocker.

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

Follow-up: `/invoices/new` also used `useSearchParams()` directly in the page component, which caused a Next.js prerender error. The hook-using content was moved behind a `Suspense` boundary. Direct `watch()` calls for date fields were replaced with `useWatch`, unescaped quote text was escaped, and `Date.now()` usage was replaced with a deterministic mock invoice sequence to satisfy React compiler purity rules.

### `app/(app)/payments/new/page.tsx:1461`

Cause: same date picker mismatch as invoices: `onChange` passed a native event where a string was expected.

Solution: changed the payment date handler to use `onValueChange`.

Follow-up: `/payments/new` also used `useSearchParams()` directly in the page component. The hook-using content was wrapped in `Suspense`. The page now imports the invoice type from the invoice module, uses `useWatch` for the payment date, initializes URL-selected invoice state without a synchronous effect, avoids `Date.now()` in the submit path, and updates selected invoice state instead of mutating imported mock invoice data.

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

## Follow-Up Build Fixes

### App-wide `useSearchParams()` Suspense boundaries

Cause: Next.js 16 requires Client Components that call `useSearchParams()` during prerendered routes to be wrapped in a `Suspense` boundary. Without it, the build fails with messages like:

```text
useSearchParams() should be wrapped in a suspense boundary
```

Solution: scanned the app for active `useSearchParams()` usages and confirmed/wrapped the hook-using content in `Suspense` for:

- `app/(auth)/login/page.tsx`
- `app/(auth)/reset-password/page.tsx`
- `app/(auth)/verify-otp/page.tsx`
- `app/(app)/assets/requests/new/page.tsx`
- `app/(app)/fleet/trips/new/page.tsx`
- `app/(app)/invoices/new/page.tsx`
- `app/(app)/payments/new/page.tsx`

### `app/(app)/fleet/trips/new/page.tsx`

Cause: `useSearchParams()` was called directly in the page component, causing `/fleet/trips/new` prerender to fail.

Solution: split the page into a wrapper component and `CreateTripPageContent`, then rendered the content inside `Suspense`.

### `app/(app)/assets/requests/new/page.tsx`

Cause: React compiler lint warned about direct React Hook Form `watch()` usage and synchronous state update in an effect.

Solution: replaced `watch("request_type")` with `useWatch`, made mock line item IDs deterministic, and deferred preload item hydration from the effect.

### `app/(auth)/reset-password/page.tsx`

Cause: React compiler lint warned about direct React Hook Form `watch()` usage, and `useRouter()` was imported but unused.

Solution: replaced `watch("new_password")` with `useWatch` and removed the unused router usage.

or(
  contains(outputs('Email_Subject'), 'cannot sign'),
  contains(outputs('Email_Body'), 'Agreement Exchange Canceled'),
  contains(outputs('Email_Body'), 'Status:</span> Canceled')
)

trim(first(split(outputs('Email_Subject'), ' cannot sign')))

trim(first(split(outputs('Email_Subject'), ' cannot sign')))


trim(
  replace(
    last(split(outputs('Email_Subject'), ' cannot sign ')),
    '[DEMO USE ONLY] ',
    ''
  )
)