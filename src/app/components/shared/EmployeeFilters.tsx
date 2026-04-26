"use client";

import { Label, Select, TextInput, ToggleSwitch } from "flowbite-react";

interface Option {
  label: string;
  value: string;
}

interface EmployeeFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  divisiOptions: Option[];
  selectedDivisi: string;
  onDivisiChange: (value: string) => void;
  lokasiOptions: Option[];
  selectedLokasi: string;
  onLokasiChange: (value: string) => void;
  roleGroup: string;
  onRoleGroupChange: (value: string) => void;
  includeManagement: boolean;
  onIncludeManagementChange: (value: boolean) => void;
}

export default function EmployeeFilters({
  search,
  onSearchChange,
  divisiOptions,
  selectedDivisi,
  onDivisiChange,
  lokasiOptions,
  selectedLokasi,
  onLokasiChange,
  roleGroup,
  onRoleGroupChange,
  includeManagement,
  onIncludeManagementChange,
}: EmployeeFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
      <div className="md:col-span-3">
        <TextInput
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari nama / NIK"
          sizing="sm"
        />
      </div>
      <div className="md:col-span-2">
        <Select sizing="sm" value={selectedDivisi} onChange={(e) => onDivisiChange(e.target.value)}>
          <option value="">Semua Divisi</option>
          {divisiOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="md:col-span-2">
        <Select sizing="sm" value={selectedLokasi} onChange={(e) => onLokasiChange(e.target.value)}>
          <option value="">Semua Lokasi</option>
          {lokasiOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="md:col-span-2">
        <Select sizing="sm" value={roleGroup} onChange={(e) => onRoleGroupChange(e.target.value)}>
          <option value="">Semua Role</option>
          <option value="management">Management</option>
          <option value="staff">Staff</option>
        </Select>
      </div>
      <div className="md:col-span-3 flex items-center">
        <div>
          <Label className="mb-1">Sertakan role manajemen</Label>
          <ToggleSwitch checked={includeManagement} onChange={onIncludeManagementChange} label={includeManagement ? "Ya" : "Tidak"} />
        </div>
      </div>
    </div>
  );
}
