# @tmzm/react-data-table

A modern, fully type-safe React data table built on [@tanstack/react-table](https://tanstack.com/table/latest), with sorting, pagination, row selection, and Radix UI primitives.

## Installation

```bash
pnpm add @tmzm/react-data-table @tanstack/react-table react react-dom
```

Or with npm / yarn:

```bash
npm install @tmzm/react-data-table @tanstack/react-table react react-dom
```

**Peer dependencies:** React 19+, `@tanstack/react-table`, `@radix-ui/react-checkbox`, `@radix-ui/react-select`, `lucide-react` (included as dependencies of this package).

## Quick start

1. **Import the component and styles**

```tsx
import { DataTable } from "@tmzm/react-data-table";
import "@tmzm/react-data-table/styles.css";
```

2. **Define columns** using [TanStack Table’s `ColumnDef`](https://tanstack.com/table/latest/docs/api/core/column-def):

```tsx
import type { ColumnDef } from "@tanstack/react-table";

interface User {
  id: string;
  name: string;
  email: string;
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
    enableSorting: true,
  },
  {
    accessorKey: "email",
    header: "Email",
    enableSorting: true,
  },
];
```

3. **Control pagination** with `pagination` and `onPaginationChange` (required):

```tsx
const [pagination, setPagination] = useState({
  pageIndex: 0,
  pageSize: 10,
});

<DataTable<User>
  data={users}
  columns={columns}
  pagination={pagination}
  onPaginationChange={setPagination}
/>
```

## Basic example

```tsx
import { useState } from "react";
import { DataTable } from "@tmzm/react-data-table";
import type { ColumnDef } from "@tanstack/react-table";
import "@tmzm/react-data-table/styles.css";

interface Product {
  id: string;
  name: string;
  price: number;
}

const columns: ColumnDef<Product>[] = [
  { accessorKey: "name", header: "Product", enableSorting: true },
  {
    accessorKey: "price",
    header: "Price",
    enableSorting: true,
    cell: ({ getValue }) => `$${getValue<number>().toFixed(2)}`,
  },
];

const products: Product[] = [
  { id: "1", name: "Widget", price: 9.99 },
  { id: "2", name: "Gadget", price: 24.99 },
];

export function ProductTable() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  return (
    <DataTable<Product>
      data={products}
      columns={columns}
      pagination={pagination}
      onPaginationChange={setPagination}
    />
  );
}
```

## Features

### Sorting

- Set `enableSorting: true` on columns that should be sortable.
- Use **client-side sorting** (default): no extra props needed.
- Use **server-side sorting**: pass `sorting`, `onSortingChange`, and `paginationOptions={{ manualSorting: true }}`. Send `sorting` to your API and pass back sorted `data`.

```tsx
const [sorting, setSorting] = useState<SortingState>([]);

<DataTable<User>
  data={users}
  columns={columns}
  pagination={pagination}
  onPaginationChange={setPagination}
  sorting={sorting}
  onSortingChange={setSorting}
  paginationOptions={{ manualSorting: true }}
/>
```

### Row selection

- `selectable={true}` enables checkboxes and a header “select all”.
- Control selected rows with `selection` and `onSelectionChange`.
- Use `getSelectionKey` to identify rows (default: `row => row?.id ?? ""`).
- Use `enableRowSelection: true | false | (row) => boolean` to allow or disable selection per row.

```tsx
const [selected, setSelected] = useState<User[]>([]);

<DataTable<User>
  data={users}
  columns={columns}
  pagination={pagination}
  onPaginationChange={setPagination}
  selectable
  selection={selected}
  onSelectionChange={setSelected}
  getSelectionKey={(row) => row.id}
/>
```

With **manual pagination**, selection can span pages; use `paginationOptions.resetSelection` to clear selection when the page changes.

### Pagination options

| Option               | Type      | Description                                                                 |
|----------------------|-----------|-----------------------------------------------------------------------------|
| `manualPagination`   | `boolean` | You control total row count and pages; pass `rowCount` and fetch by page.  |
| `manualSorting`      | `boolean` | You handle sorting (e.g. server-side); use with `sorting` / `onSortingChange`. |
| `resetSelection`     | `boolean` | Clear selection when pagination changes.                                    |
| `selectLabel`        | `string`  | Label for the “rows per page” select (default: `"Rows per page"`).         |

**Manual pagination example:**

```tsx
const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
const { data, totalCount } = useFetchUsers(pagination);

<DataTable<User>
  data={data}
  columns={columns}
  pagination={pagination}
  onPaginationChange={setPagination}
  rowCount={totalCount}
  paginationOptions={{ manualPagination: true }}
/>
```

### Other props

| Prop               | Type                    | Description                                              |
|--------------------|-------------------------|----------------------------------------------------------|
| `hidePagination`   | `boolean`               | Hide pagination controls.                                |
| `loading`          | `boolean`               | Show skeleton rows.                                      |
| `striped`          | `boolean`               | Alternate row background.                                |
| `placeholder`      | `ReactNode`             | Custom content when there are no rows.                   |
| `placeholderText`  | `string`                | Default empty state text (default: `"No data found"`).   |
| `size`             | `"default" \| "sm"`     | Row/cell size.                                           |

You can also pass any valid `div` props (e.g. `className`, `style`) and they are forwarded to the table wrapper.

## Type exports

Re-exported from `@tanstack/react-table` for convenience:

- `DataTableColumnDef` — same as `ColumnDef`
- `DataTableSortingState` — same as `SortingState`
- `DataTablePaginationState` — same as `PaginationState`

```tsx
import type {
  DataTableColumnDef,
  DataTableSortingState,
  DataTablePaginationState,
} from "@tmzm/react-data-table";
```

## License

ISC
