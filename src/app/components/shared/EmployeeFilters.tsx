"use client";

import React, { useState } from "react";
import { Label, Select, TextInput, ToggleSwitch, Button } from "flowbite-react";
import { Icon } from "@iconify/react";

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
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Check if any advanced filter is active
  const hasActiveFilters = selectedDivisi || selectedLokasi || roleGroup || !includeManagement;

  return (
    <div className="flex flex-col gap-3">
      {/* Search row - always visible */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
        <div className="md:col-span-3">
          <TextInput
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama / NIK"
            sizing="sm"
            className="w-full"
          />
        </div>

        {/* Advanced toggle - mobile only */}
        <div className="md:hidden flex justify-end">
          <Button
            size="sm"
            color="light"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2"
          >
            <Icon icon="solar:filter-linear" className="h-4 w-4" />
            Filter
            {hasActiveFilters && (
              <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-primary" />
            )}
            <Icon
              icon={showAdvanced ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"}
              className="h-4 w-4"
            />
          </Button>
        </div>

        {/* Desktop filters - always visible */}
        <div className="hidden md:contents">
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
      </div>

      {/* Mobile advanced filters - collapsible */}
      {showAdvanced && (
        <div className="md:hidden flex flex-col gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-ld">
          <div>
            <Label className="mb-1 block text-xs">Divisi</Label>
            <Select sizing="sm" value={selectedDivisi} onChange={(e) => onDivisiChange(e.target.value)}>
              <option value="">Semua Divisi</option>
              {divisiOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-xs">Lokasi</Label>
            <Select sizing="sm" value={selectedLokasi} onChange={(e) => onLokasiChange(e.target.value)}>
              <option value="">Semua Lokasi</option>
              {lokasiOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-xs">Role</Label>
            <Select sizing="sm" value={roleGroup} onChange={(e) => onRoleGroupChange(e.target.value)}>
              <option value="">Semua Role</option>
              <option value="management">Management</option>
              <option value="staff">Staff</option>
            </Select>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-ld">
            <Label className="text-xs">Sertakan role manajemen</Label>
            <ToggleSwitch checked={includeManagement} onChange={onIncludeManagementChange} label={includeManagement ? "Ya" : "Tidak"} />
          </div>
        </div>
      )}
    </div>
  );
}