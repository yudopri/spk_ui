"use client";
import React from "react";
import { Select, Label } from "flowbite-react";

interface FilterOption {
  value: string | number;
  label: string;
}

interface DataFilterProps {
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  className?: string;
}

const DataFilter: React.FC<DataFilterProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Semua",
  className = "w-full md:w-48",
}) => {
  return (
    <div className={className}>
      {label && (
        <div className="mb-1">
          <Label value={label} />
        </div>
      )}
      <Select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} sizing="md">
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
};

export default DataFilter;
