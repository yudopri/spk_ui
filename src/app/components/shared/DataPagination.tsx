"use client";
import React from "react";
import { Pagination, Select } from "flowbite-react";

interface DataPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  totalPages?: number; // Added for flexibility
}

const DataPagination: React.FC<DataPaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  totalPages: propTotalPages,
}) => {
  const calculatedTotalPages = Math.ceil(totalItems / pageSize);
  const totalPages = propTotalPages ?? (calculatedTotalPages > 0 ? calculatedTotalPages : 1);

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
        <span>Menampilkan</span>
        {onPageSizeChange ? (
          <Select
            sizing="sm"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="w-20"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        ) : (
          <span className="font-semibold">{pageSize}</span>
        )}
        <span>
          dari <span className="font-semibold">{totalItems}</span> data
        </span>
      </div>

      <div className="flex overflow-x-auto sm:justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages > 0 ? totalPages : 1}
          onPageChange={onPageChange}
          showIcons
          previousLabel="Kembali"
          nextLabel="Lanjut"
        />
      </div>
    </div>
  );
};

export default DataPagination;
