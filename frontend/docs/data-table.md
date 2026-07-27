# DataTable

Shared table component:

```tsx
import DataTable, {
  type Column,
  type DataTableAction,
} from "@/components/ui/DataTable";
```

Rows must include an `id: string`.

## Basic Example

```tsx
type RequestRow = {
  id: string;
  title: string;
  requester: string;
  status: string;
};

const columns: Column<RequestRow>[] = [
  { key: "id", label: "Reference" },
  { key: "title", label: "Title" },
  { key: "requester", label: "Requester" },
  { key: "status", label: "Status" },
];

<DataTable
  columns={columns}
  data={requests}
  rowHref={(row) => `/requests/${row.id}`}
/>;
```

## DataTable Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` | `Column<T>[]` | Required | Visible table columns. Search only uses these visible columns. |
| `data` | `T[]` | Required | Row data. Each row must have `id`. |
| `rowHref` | `(row: T) => string` | `undefined` | Makes the row clickable and navigates to the returned URL. |
| `emptyMessage` | `string` | `"No records found."` | Empty-state title. |
| `emptyDescription` | `string` | `"Try adjusting your search."` | Empty-state helper text. |
| `isLoading` | `boolean` | `false` | Shows skeleton rows. |
| `searchable` | `boolean` | `true` | Shows/hides the search input. |
| `searchPlaceholder` | `string` | `"Search..."` | Search input placeholder. |
| `sortable` | `boolean` | `true` | Enables column sorting globally. |
| `paginated` | `boolean` | `true` | Enables pagination. |
| `pageSize` | `number` | `10` | Initial rows per page. |
| `pageSizeOptions` | `number[]` | `[10, 25, 50, 100]` | Rows-per-page options. |
| `showActions` | `boolean` | `false` | Shows a default View action only when `rowHref` exists and no custom `actions` are passed. |
| `actions` | `DataTableAction<T>[]` | `[]` | Custom row actions. Supports multiple actions. |
| `actionLabel` | `string` | `"View"` | Label for the default View action. |
| `actionsLabel` | `string` | `"Actions"` | Header label for the actions column. |
| `actionsHeaderClassName` | `string` | `undefined` | Custom class for the actions header cell. |
| `actionsCellClassName` | `string \| (row) => string` | `undefined` | Custom class for the actions cell. |
| `actionsContainerClassName` | `string \| (row) => string` | `undefined` | Custom class for the actions wrapper. |
| `onNewRequest` | `() => void` | `undefined` | Shows a toolbar create button and runs this callback. |
| `newRequestLabel` | `string` | `"New Request"` | Label for the toolbar create button. |
| `toolbarActions` | `React.ReactNode` | `undefined` | Extra toolbar controls/actions. |
| `className` | `string` | `undefined` | Wrapper class. |
| `tableClassName` | `string` | `undefined` | Table element class. |
| `minWidthClassName` | `string` | `"min-w-[720px]"` | Controls horizontal table width. |
| `rowClassName` | `(row: T) => string` | `undefined` | Per-row class customization. |

The older filter props (`filters`, `showStatusFilter`, `statusFilterKey`, etc.) still exist in the type for compatibility, but filter dropdowns are currently not rendered or applied. Use visible columns plus search for now.

## Column Props

| Prop | Type | Description |
| --- | --- | --- |
| `key` | `keyof T \| string` | Field key. Supports nested paths for search via `getNestedValue`, for example `"requester.name"`. |
| `label` | `string` | Column header label. |
| `render` | `(value, row) => React.ReactNode` | Custom cell UI. |
| `searchable` | `boolean` | Set to `false` to exclude this visible column from search. |
| `sortable` | `boolean` | Set to `false` to disable sorting for this column. |
| `getSearchValue` | `(row) => string` | Search value for rendered/nested/component cells. |
| `getSortValue` | `(row) => string \| number \| Date \| null \| undefined` | Custom sort value. |
| `className` | `string` | Body cell class. |
| `headerClassName` | `string` | Header cell class. |

## Search Rules

Search is strict: it only searches visible columns in `columns`.

For each visible column:

1. If `getSearchValue` exists, DataTable uses it.
2. If the column has no `render`, DataTable uses the column `key`.
3. If `render` returns plain text/number/boolean, DataTable searches that rendered value.
4. If `render` returns a React component, add `getSearchValue`.

Example for a badge/pill column:

```tsx
{
  key: "priority",
  label: "Priority",
  getSearchValue: (row) => row.priority,
  render: (_, row) => <PriorityPill priority={row.priority} />,
}
```

## Custom Actions

```tsx
const actions: DataTableAction<RequestRow>[] = [
  {
    key: "view",
    label: "View",
    href: (row) => `/requests/${row.id}`,
    variant: "secondary",
  },
  {
    key: "deny",
    label: "Deny",
    variant: "danger",
    hidden: (row) => row.status !== "submitted",
    onClick: (row) => denyRequest(row.id),
  },
];

<DataTable columns={columns} data={requests} actions={actions} />;
```

## DataTableAction Props

| Prop | Type | Description |
| --- | --- | --- |
| `key` | `string` | Unique action key. |
| `label` | `React.ReactNode` | Action label. |
| `ariaLabel` | `string \| (row) => string` | Accessible label. |
| `icon` | `React.ReactNode \| (row) => React.ReactNode` | Optional icon. |
| `href` | `(row) => string` | Renders as link action. |
| `onClick` | `(row, event) => void` | Runs button action. Ignored when `href` is provided. |
| `variant` | `"primary" \| "secondary" \| "outline" \| "ghost" \| "danger"` | Button style. |
| `size` | `"sm" \| "md" \| "lg"` | Button size. |
| `className` | `string \| (row) => string` | Button class. |
| `labelClassName` | `string` | Label span class. |
| `hideLabelOnMobile` | `boolean` | Defaults to `true`. |
| `disabled` | `boolean \| (row) => boolean` | Disables action. |
| `loading` | `boolean \| (row) => boolean` | Shows loading state. |
| `loadingText` | `string` | Loading label. |
| `hidden` | `boolean \| (row) => boolean` | Hides action for a row. |
| `title` | `string \| (row) => string` | Tooltip/title attribute. |
| `render` | `(row) => React.ReactNode` | Fully custom action UI. |

## Notes

- `showActions` is `false` by default.
- Passing `actions` is preferred for custom action behavior.
- If `showActions={true}`, `rowHref` exists, and `actions` is empty, DataTable shows the default View action.
- For rendered columns, always add `getSearchValue` if the visible text is inside a component.
