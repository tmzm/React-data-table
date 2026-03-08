"use client";

import { Checkbox, CheckboxIndicator } from "@radix-ui/react-checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from "@radix-ui/react-select";
import {
  Column,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  OnChangeFn,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeft,
  ChevronRight,
  ChevronUpIcon,
  MinusIcon,
} from "lucide-react";
import { ReactNode, useCallback, useMemo } from "react";

export interface DataTableProps<T extends object> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "size"
> {
  data: T[];
  columns: ColumnDef<T>[];

  /* Pagination */
  paginationOptions?: {
    manualPagination?: boolean;
    manualSorting?: boolean;
    resetSelection?: boolean;
    selectLabel?: string;
  };

  hidePagination?: boolean;

  /* Sorting: required for manual sorting */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;

  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  rowCount?: number;

  /* Selection */
  selectable?: boolean;
  getSelectionKey?: (row: T & { id?: string }) => string;
  enableRowSelection?: boolean | ((row: Row<T>) => boolean);
  selection?: T[];
  onSelectionChange?: (selected: T[]) => void;

  size?: "default" | "sm";

  /* UI */
  placeholder?: ReactNode;
  placeholderText?: string;
  loading?: boolean;
  striped?: boolean;
}

/**
 *
 * @param data - The data to display in the table.
 * @param columns - The columns to display in the table.
 * @param hidePagination - Whether to hide the pagination.
 * @param paginationOptions - The pagination options.
 * @param sorting - The sorting state.
 * @param onSortingChange - The function to call when the sorting state changes.
 * @param pagination - The pagination state.
 * @param onPaginationChange - The function to call when the pagination state changes.
 * @param rowCount - The number of rows in the table.
 * @param selectable - Whether to enable row selection.
 * @param getSelectionKey - The function to get the selection key.
 * @param selection - The selection state.
 * @param onSelectionChange - The function to call when the selection state changes.
 * @param size - The size of the table.
 * @param loading - Whether to show the loading state.
 * @param striped - Whether to stripe the table.
 * @param placeholder - The placeholder to display when the table is empty.
 * @param placeholderText - The text to display when the table is empty.
 * @returns
 */
export function DataTable<T extends object>({
  data,
  columns,
  hidePagination = false,

  paginationOptions = {
    manualPagination: false,
    manualSorting: false,
    resetSelection: false,
    selectLabel: "Rows per page",
  },

  sorting = [],
  onSortingChange,

  pagination,
  onPaginationChange,
  rowCount,

  selectable = false,
  getSelectionKey = (row) => row?.id || "",
  selection = [],
  onSelectionChange,
  enableRowSelection,

  placeholder,
  placeholderText = "No data found",

  size = "sm",

  loading = false,

  striped = false,

  ...props
}: DataTableProps<T>) {
  const handlePaginationChange: OnChangeFn<PaginationState> = (page) => {
    const newPagination = typeof page == "function" ? page(pagination) : page;

    onPaginationChange?.(newPagination);

    if (paginationOptions.resetSelection) {
      return onSelectionChange?.([]);
    }
  };

  const handleSortingChange: OnChangeFn<SortingState> = (sort) => {
    const newSorting = typeof sort == "function" ? sort(sorting) : sort;

    onSortingChange?.(newSorting);
  };

  // Optimized: Create lookup map for O(1) access instead of O(n) find operations
  const dataByKey = useMemo(
    () => new Map(data.map((r) => [getSelectionKey(r), r])),
    [data, getSelectionKey],
  );

  // Optimized: Memoize current page keys to avoid recalculating
  const thisPageKeys = useMemo(
    () => new Set(data.map((r: T) => getSelectionKey(r))),
    [data, getSelectionKey],
  );

  // Optimized: Memoize row selection state to prevent unnecessary recalculations
  const rowSelectionState = useMemo(
    () =>
      selection
        ? selection.reduce<Record<string, boolean>>((acc, row) => {
            acc[getSelectionKey(row)] = true;
            return acc;
          }, {})
        : {},
    [selection, getSelectionKey],
  );

  const handleRowSelectionChange = useCallback<OnChangeFn<RowSelectionState>>(
    (selectionState) => {
      const newSelectionState =
        typeof selectionState === "function"
          ? selectionState(rowSelectionState)
          : selectionState;

      const currentPageSelected = newSelectionState
        ? Object.keys(newSelectionState)
            .map((key) => dataByKey.get(key))
            .filter((row): row is T => row !== undefined)
        : [];

      if (
        paginationOptions.manualPagination &&
        Array.isArray(selection) &&
        selection.length
      ) {
        const oldSelectionFromOtherPages = selection.filter(
          (r) => !thisPageKeys.has(getSelectionKey(r)),
        );

        onSelectionChange?.([
          ...oldSelectionFromOtherPages,
          ...currentPageSelected,
        ]);
      } else {
        onSelectionChange?.(currentPageSelected);
      }
    },
    [
      rowSelectionState,
      dataByKey,
      thisPageKeys,
      paginationOptions.manualPagination,
      selection,
      getSelectionKey,
      onSelectionChange,
    ],
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: handleSortingChange,

    state: {
      rowSelection: rowSelectionState,
      sorting,
      pagination: {
        pageIndex: pagination?.pageIndex || 0,
        pageSize: pagination?.pageSize || 10,
      },
    },

    ...paginationOptions,

    onRowSelectionChange: handleRowSelectionChange,

    enableRowSelection,
    enableMultiRowSelection: enableRowSelection,

    onPaginationChange: handlePaginationChange,

    rowCount,

    getRowId: getSelectionKey,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const toggleSort = (column: Column<T>) => {
    if (column.getCanSort() && column.columnDef.enableSorting)
      if (column.getIsSorted() == "desc") column.clearSorting();
      else column.toggleSorting();
  };

  const SortIcon = useMemo(() => {
    const Icon = ({ column }: { column: Column<T> }) => {
      if (!column.columnDef.enableSorting || !column.getCanSort()) return null;

      return column.getIsSorted() === "asc" ? (
        <ArrowUp />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDown />
      ) : (
        <ArrowUpDown />
      );
    };
    Icon.displayName = "SortIcon";
    return Icon;
  }, []);

  return (
    <div className="rdt__wrapper" {...props}>
      <table className="rdt__table">
        <thead className="rdt__header">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr className="rdt__row" key={headerGroup.id}>
              {selectable && (
                <th className="rdt__cell">
                  <Checkbox
                    checked={
                      table.getIsSomeRowsSelected()
                        ? "indeterminate"
                        : table.getIsAllRowsSelected()
                    }
                    disabled={
                      enableRowSelection == false ||
                      table
                        .getRowModel()
                        .rows.every((row) => !row.getCanSelect())
                    }
                    onCheckedChange={(checked) =>
                      table.toggleAllRowsSelected(
                        checked === "indeterminate" ? false : checked,
                      )
                    }
                    className="rdt__checkbox"
                  >
                    <CheckboxIndicator>
                      {table.getIsSomeRowsSelected() && <MinusIcon />}
                      {table.getIsAllRowsSelected() === true && <CheckIcon />}
                    </CheckboxIndicator>
                  </Checkbox>
                </th>
              )}

              {headerGroup.headers.map((header) => {
                return (
                  <th className="rdt__cell" key={header.id}>
                    <div
                      className="rdt__cell__content"
                      onClick={() => toggleSort(header.column)}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}

                      <SortIcon column={header.column} />
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>

        <tbody className="rdt__body">
          {loading ? (
            Array.from({ length: table.getState().pagination.pageSize }).map(
              (_, index) => (
                <tr className="rdt__row" key={index}>
                  {Array.from({ length: columns.length }).map((_, index) => (
                    <td className="rdt__cell" key={index}>
                      <div className="rdt__skeleton" />
                    </td>
                  ))}
                </tr>
              ),
            )
          ) : !!table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <tr
                className={`rdt__row ${striped ? "rdt__row--striped" : ""}`}
                key={row.id}
              >
                {selectable && (
                  <td className="rdt__cell">
                    <Checkbox
                      checked={row.getIsSelected()}
                      disabled={
                        enableRowSelection == false || !row.getCanSelect()
                      }
                      onCheckedChange={(checked) =>
                        row.toggleSelected(
                          checked === "indeterminate" ? false : checked,
                        )
                      }
                      className="rdt__checkbox"
                    >
                      <CheckboxIndicator>
                        <CheckIcon />
                      </CheckboxIndicator>
                    </Checkbox>
                  </td>
                )}

                {row.getVisibleCells().map((cell) => (
                  <td className="rdt__cell" key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr className="rdt__row">
              <td className="rdt__cell">
                {placeholder || (
                  <div className="rdt__placeholder">{placeholderText}</div>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {!hidePagination && (
        <div className="rdt__pagination">
          <div className="rdt__pagination__buttons">
            <button
              className="rdt__pagination__button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft />
            </button>
            <button
              className="rdt__pagination__button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight />
            </button>
          </div>
          <div className="rdt__pagination__info">
            <span>
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
          </div>

          <div className="rdt__pagination__select">
            <Select
              value={pagination?.pageSize?.toString() || "10"}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="rdt__pagination__select__trigger">
                <SelectValue />
                <SelectIcon className="rdt__pagination__select__icon">
                  <ChevronDownIcon />
                </SelectIcon>
              </SelectTrigger>
              <SelectPortal>
                <SelectContent className="rdt__pagination__select__content">
                  <SelectScrollUpButton className="rdt__pagination__select__scroll__up__button">
                    <ChevronUpIcon />
                  </SelectScrollUpButton>
                  <SelectViewport className="rdt__pagination__select__viewport">
                    <SelectGroup>
                      {[10, 25, 50, 100].map((size, index) => (
                        <SelectItem
                          key={index}
                          className="rdt__pagination__select__item"
                          value={size.toString()}
                        >
                          <SelectItemText>{size}</SelectItemText>
                          <SelectItemIndicator className="rdt__pagination__select__item__indicator">
                            <CheckIcon />
                          </SelectItemIndicator>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectViewport>
                  <SelectScrollDownButton className="rdt__pagination__select__scroll__down__button">
                    <ChevronDownIcon />
                  </SelectScrollDownButton>
                </SelectContent>
              </SelectPortal>
            </Select>

            <span className="rdt__pagination__select__label">
              {paginationOptions.selectLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
