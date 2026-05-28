"use client";
import React, { useEffect, useState } from "react";
import { Table, Badge, Spinner, Alert, Button } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import karyawanService, { Karyawan } from "@/services/karyawanService";
import divisiService, { Divisi } from "@/services/divisiService";
import EmployeeFilters from "@/app/components/shared/EmployeeFilters";
import { usePermission } from "@/hooks/usePermission";

// Shared Components
import DataTable, { Column } from "@/app/components/shared/DataTable";
import DataPagination from "@/app/components/shared/DataPagination";

const getFriendlyError = (err: any, fallback: string) => {
  const status = err?.status || err?.response?.status;
  if (status === 401) return "401 - Sesi login berakhir. Silakan login ulang.";
  if (status === 403) return "403 - Anda tidak memiliki izin untuk melihat data karyawan.";
  if (status >= 500) return "500 - Terjadi gangguan server. Coba lagi beberapa saat.";
  return err?.message || err?.response?.data?.message || fallback;
};

const DataKaryawan = () => {
  const { normalizedRole, filterEmployeesByScope, isAdminLike, isKaryawan } = usePermission();
  const [employees, setEmployees] = useState<Karyawan[]>([]);
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedLokasi, setSelectedLokasi] = useState<string>("");
  const [roleGroup, setRoleGroup] = useState<string>("");
  const [includeManagement, setIncludeManagement] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const columns: Column<Karyawan>[] = [
    {
      header: "ID",
      cellClasses: "whitespace-nowrap font-bold text-primary",
      render: (item: Karyawan) => `#${item.id}`
    },
    {
      header: "Name",
      cellClasses: "font-medium text-gray-900 dark:text-white",
      render: (item: Karyawan) => item.name || item.nama || "-"
    },
    {
      header: "NIK",
      key: "nik"
    },
    {
      header: "Email",
      key: "email"
    },
    {
      header: "Departemen",
      render: (item: Karyawan) => (
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">ID: {item.departemen_id ?? "-"}</span>
          <span>{item.department_name || "-"}</span>
        </div>
      )
    },
    {
      header: "Lokasi Kerja",
      key: "lokasi_kerja"
    },
    {
      header: "Role",
      render: (item: Karyawan) => (
        <Badge color="info" className="w-fit">{item.role || "-"}</Badge>
      )
    }
  ];

  const fetchDepartments = async () => {
    try {
      const res = await divisiService.getAll();
      if (res.success) {
        setDivisiList(res.data);
      }
    } catch (err: any) {
      setError(getFriendlyError(err, "Gagal mengambil daftar departemen"));
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const deptParam = selectedDeptId ? Number(selectedDeptId) : undefined;

      const res = await karyawanService.getAll({
        ...(deptParam ? { dept_id: deptParam } : {}),
        ...(selectedLokasi ? { lokasi_kerja: selectedLokasi } : {}),
        ...(roleGroup ? { role_group: roleGroup } : {}),
        include_management_roles: includeManagement,
        page,
        pageSize,
        search
      });

      const scoped = filterEmployeesByScope(res.data || []) as Karyawan[];
      setEmployees(scoped);
      setTotalItems(res.meta?.total || scoped.length);
      setError(null);
    } catch (err: any) {
      setError(getFriendlyError(err, "Gagal mengambil data karyawan"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [selectedDeptId, selectedLokasi, roleGroup, includeManagement, normalizedRole, page, pageSize]);

  const divisiOptions = divisiList.map((div) => ({ value: String(div.id), label: div.namaDivisi }));

  const uniqueLokasi = Array.from(new Set(employees.map((e) => e.lokasi_kerja).filter(Boolean))) as string[];
  const lokasiOptions = uniqueLokasi.map((value) => ({ value, label: value }));

  const selectedDeptName = !selectedDeptId 
    ? "Semua Departemen" 
    : divisiList.find((d) => String(d.id) === selectedDeptId)?.namaDivisi || "Departemen";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Data Karyawan Mitra</h1>
            <p className="text-sm text-gray-500">Daftar karyawan sesuai scope role dan unit kerja</p>
          </div>
          <Button color="primary" onClick={() => fetchEmployees()} outline>
            <Icon icon="solar:refresh-linear" className="mr-2 h-5 w-5" />
            Refresh
          </Button>
        </div>

        <EmployeeFilters
          search={search}
          onSearchChange={setSearch}
          divisiOptions={divisiOptions}
          selectedDivisi={selectedDeptId}
          onDivisiChange={setSelectedDeptId}
          lokasiOptions={lokasiOptions}
          selectedLokasi={selectedLokasi}
          onLokasiChange={setSelectedLokasi}
          roleGroup={roleGroup}
          onRoleGroupChange={setRoleGroup}
          includeManagement={includeManagement}
          onIncludeManagementChange={setIncludeManagement}
        />
        {isAdminLike && <Alert color="info">Role Anda dapat melihat data karyawan lintas divisi.</Alert>}
        {isKaryawan && <Alert color="info">Role Karyawan hanya dapat melihat data profil sendiri.</Alert>}
      </div>

      {error && <Alert color="failure">{error}</Alert>}

      <CardBox>
        <div className="mb-4 flex items-center justify-between">
          <h5 className="font-semibold text-primary">{selectedDeptName}</h5>
          <Badge color="info">{totalItems} Karyawan</Badge>
        </div>
        
        <DataTable
          columns={columns}
          data={employees}
          loading={loading}
          striped
          rowKey={(item: Karyawan) => item.id}
        />

        <DataPagination
          currentPage={page}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </CardBox>
    </div>
  );
};

export default DataKaryawan;
