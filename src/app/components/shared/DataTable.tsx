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
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  hoverable?: boolean;
  striped?: boolean;
  rowKey?: (item: T) => string | number;
}

const DataTable = <T extends any>({
  columns,
  data,
  loading = false,
  onRowClick,
  hoverable = true,
  striped = true,
  rowKey,
}: DataTableProps<T>) => {
  return (
    <div className="overflow-x-auto relative">
      <Table hoverable={hoverable} striped={striped}>
        <Table.Head>
          {columns.map((col, idx) => (
            <Table.HeadCell key={idx} className={col.headerClasses || col.className}>
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
                Tidak ada data ditemukan.
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
                  <Table.Cell key={colIdx} className={col.cellClasses || col.className}>
                    {col.render
                      ? col.render(item, rowIdx)
                      : col.cell
                      ? col.cell(item, rowIdx)
                      : (col.accessor || col.key)
                      ? (item[(col.accessor || col.key) as keyof T] as React.ReactNode)
                      : null}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
    </div>
  );
};

export default DataTable;
