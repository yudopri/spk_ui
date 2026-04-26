"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Table, Badge, Spinner, Alert, Button } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import karyawanService, { Karyawan } from "@/services/karyawanService";
import divisiService, { Divisi } from "@/services/divisiService";
import EmployeeFilters from "@/app/components/shared/EmployeeFilters";
import { usePermission } from "@/hooks/usePermission";

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
      });

      const scoped = filterEmployeesByScope(res.data || []) as Karyawan[];
      setEmployees(scoped);
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
  }, [selectedDeptId, selectedLokasi, roleGroup, includeManagement, normalizedRole]);

  const divisiOptions = useMemo(
    () => divisiList.map((div) => ({ value: String(div.id), label: div.namaDivisi })),
    [divisiList]
  );

  const lokasiOptions = useMemo(() => {
    const unique = Array.from(new Set(employees.map((e) => e.lokasi_kerja).filter(Boolean))) as string[];
    return unique.map((value) => ({ value, label: value }));
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return employees;

    return employees.filter((emp) => {
      const haystack = [emp.name, emp.nama, emp.nik, emp.department_name, emp.lokasi_kerja]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [employees, search]);

  const selectedDeptName = useMemo(() => {
    if (!selectedDeptId) return "Semua Departemen";
    return divisiList.find((d) => String(d.id) === selectedDeptId)?.namaDivisi || "Departemen";
  }, [divisiList, selectedDeptId]);

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
          <Badge color="info">{filteredEmployees.length} Karyawan</Badge>
        </div>
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>ID</Table.HeadCell>
              <Table.HeadCell>Name</Table.HeadCell>
              <Table.HeadCell>NIK</Table.HeadCell>
              <Table.HeadCell>Email</Table.HeadCell>
              <Table.HeadCell>Departemen ID</Table.HeadCell>
              <Table.HeadCell>Department Name</Table.HeadCell>
              <Table.HeadCell>Lokasi Kerja</Table.HeadCell>
              <Table.HeadCell>Role</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan={8} className="text-center py-10">
                    <Spinner size="xl" />
                  </Table.Cell>
                </Table.Row>
              ) : filteredEmployees.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={8} className="text-center py-10">
                    Tidak ada data karyawan
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredEmployees.map((emp, index) => (
                  <Table.Row
                    key={`${emp.id}-${emp.nik || "no-nik"}-${emp.departemen_id ?? "no-dept"}-${index}`}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800"
                  >
                    <Table.Cell className="whitespace-nowrap font-bold text-primary">#{emp.id}</Table.Cell>
                    <Table.Cell className="font-medium text-gray-900 dark:text-white">{emp.name || emp.nama || "-"}</Table.Cell>
                    <Table.Cell>{emp.nik || "-"}</Table.Cell>
                    <Table.Cell>{emp.email || "-"}</Table.Cell>
                    <Table.Cell>{emp.departemen_id ?? "-"}</Table.Cell>
                    <Table.Cell>{emp.department_name || "-"}</Table.Cell>
                    <Table.Cell>{emp.lokasi_kerja || "-"}</Table.Cell>
                    <Table.Cell>
                      <Badge color="info" className="w-fit">{emp.role || "-"}</Badge>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </div>
      </CardBox>
    </div>
  );
};

export default DataKaryawan;
