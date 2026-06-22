"use client";
import React from "react";
import { Table, Checkbox, Spinner } from "flowbite-react";

export interface Column<T> {
  header: string;
  accessor?: keyof T | string;
  key?: keyof T | string;
  render?: (item: T, index: number) => React.ReactNode;
  cell?: (item: T, index: number) => React.ReactNode;
  className?: string; // Legacy
  headerClasses?: string;
  cellClasses?: string;
  sortable?: boolean;
  /** Hide this column on screens smaller than the given breakpoint. e.g. "sm" hides on xs, "md" hides below md */
  hideOn?: "sm" | "md" | "lg" | "xl";
  /** Show this column as a secondary line in mobile card view (default: primary) */
  mobileSecondary?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  hoverable?: boolean;
  striped?: boolean;
  rowKey?: (item: T) => string | number;
  /** Enable mobile card view (default: true). When true, tables switch to stacked cards on small screens. */
  mobileCardView?: boolean;
  /** Empty state message */
  emptyMessage?: string;
}

const hideOnClasses: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

const DataTable = <T extends any>({
  columns,
  data,
  loading = false,
  onRowClick,
  hoverable = true,
  striped = true,
  rowKey,
  mobileCardView = true,
  emptyMessage = "Tidak ada data ditemukan.",
}: DataTableProps<T>) => {
  // Columns visible in mobile card view (primary + secondary)
  const mobileVisibleColumns = columns.filter((c) => !c.hideOn || c.hideOn === "xl");

  const getCellValue = (col: Column<T>, item: T, rowIdx: number): React.ReactNode => {
    if (col.render) return col.render(item, rowIdx);
    if (col.cell) return col.cell(item, rowIdx);
    if (col.accessor || col.key) return item[(col.accessor || col.key) as keyof T] as React.ReactNode;
    return null;
  };

  return (
    <>
      {/* Desktop / Tablet Table View */}
      <div className="hidden sm:block overflow-x-auto relative">
        <Table hoverable={hoverable} striped={striped}>
          <Table.Head>
            {columns.map((col, idx) => (
              <Table.HeadCell
                key={idx}
                className={`${col.headerClasses || col.className || ""} ${
                  col.hideOn ? hideOnClasses[col.hideOn] : ""
                }`}
              >
                {col.header}
              </Table.HeadCell>
            ))}
          </Table.Head>
          <Table.Body className="divide-y relative">
            {loading ? (
              <Table.Row>
                <Table.Cell colSpan={columns.length} className="text-center py-10">
                  <div className="flex justify-center items-center gap-2">
                    <Spinner size="md" />
                    <span>Memuat data...</span>
                  </div>
                </Table.Cell>
              </Table.Row>
            ) : data.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={columns.length} className="text-center py-10 text-gray-500">
                  {emptyMessage}
                </Table.Cell>
              </Table.Row>
            ) : (
              data.map((item, rowIdx) => (
                <Table.Row
                  key={rowKey ? rowKey(item) : (item as any).id || (item as any).Id || rowIdx}
                  className={`bg-white dark:border-gray-700 dark:bg-gray-800 ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map((col, colIdx) => (
                    <Table.Cell
                      key={colIdx}
                      className={`${col.cellClasses || col.className || ""} ${
                        col.hideOn ? hideOnClasses[col.hideOn] : ""
                      }`}
                    >
                      {getCellValue(col, item, rowIdx)}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </div>

      {/* Mobile Card View */}
      {mobileCardView && (
        <div className="sm:hidden">
          {loading ? (
            <div className="flex justify-center items-center gap-2 py-10">
              <Spinner size="md" />
              <span>Memuat data...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-10 text-gray-500">{emptyMessage}</div>
          ) : (
            <div className="flex flex-col gap-3">
              {data.map((item, rowIdx) => (
                <div
                  key={rowKey ? rowKey(item) : (item as any).id || (item as any).Id || rowIdx}
                  className={`bg-white dark:bg-gray-800 rounded-lg border border-ld p-4 ${
                    onRowClick ? "cursor-pointer active:bg-gray-50 dark:active:bg-gray-700" : ""
                  }`}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {mobileVisibleColumns.map((col, colIdx) => {
                    const value = getCellValue(col, item, rowIdx);
                    if (value === null || value === undefined || value === "") return null;
                    return (
                      <div
                        key={colIdx}
                        className={`flex justify-between items-start gap-3 ${
                          colIdx > 0 ? "mt-2 pt-2 border-t border-gray-100 dark:border-gray-700" : ""
                        }`}
                      >
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0">
                          {col.header}
                        </span>
                        <span className="text-sm text-gray-900 dark:text-white text-right break-words min-w-0">
                          {value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default DataTable;