"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Table, Badge, Select, Spinner, Alert, Button } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import karyawanService, { Karyawan } from "@/services/karyawanService";
import divisiService, { Divisi } from "@/services/divisiService";

const getFriendlyError = (err: any, fallback: string) => {
  const status = err?.status || err?.response?.status;
  if (status === 401) return "401 - Sesi login berakhir. Silakan login ulang.";
  if (status === 403) return "403 - Anda tidak memiliki izin untuk melihat data karyawan.";
  if (status >= 500) return "500 - Terjadi gangguan server. Coba lagi beberapa saat.";
  return err?.message || err?.response?.data?.message || fallback;
};

const DataKaryawan = () => {
  const [employees, setEmployees] = useState<Karyawan[]>([]);
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      const res = await divisiService.getAll();
      if (res.success) {
        setDivisiList(res.data);
        if (res.data.length > 0 && selectedDeptId === "all") {
          setSelectedDeptId(res.data[0].id);
        }
      }
    } catch (err: any) {
      setError(getFriendlyError(err, "Gagal mengambil daftar departemen"));
    }
  };

  const fetchEmployees = async (deptId?: number) => {
    setLoading(true);
    try {
      const res = await karyawanService.getAll(deptId ? { dept_id: deptId } : {});
      if (res.success) {
        setEmployees(res.data);
        setError(null);
      }
    } catch (err: any) {
      setError(getFriendlyError(err, "Gagal mengambil data karyawan"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await fetchDepartments();
        await fetchEmployees(undefined);
      } catch (err: any) {
        setError(getFriendlyError(err, "Gagal mengambil data awal"));
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedDeptId === "all") {
      fetchEmployees(undefined);
      return;
    }
    fetchEmployees(selectedDeptId);
  }, [selectedDeptId]);

  const selectedDeptName = useMemo(() => {
    if (selectedDeptId === "all") return "Semua Departemen";
    return divisiList.find((d) => d.id === selectedDeptId)?.namaDivisi || "Departemen";
  }, [divisiList, selectedDeptId]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Data Karyawan Mitra</h1>
          <p className="text-sm text-gray-500">Daftar karyawan dari backend SPK terbaru</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="w-64"
          >
            <option value="all">Semua Departemen</option>
            {divisiList.map((div) => (
              <option key={div.id} value={div.id}>{div.namaDivisi}</option>
            ))}
          </Select>
          <Button color="primary" onClick={() => fetchEmployees(selectedDeptId === "all" ? undefined : selectedDeptId)} outline>
            <Icon icon="solar:refresh-linear" className="mr-2 h-5 w-5" />
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert color="failure">{error}</Alert>}

      <CardBox>
        <div className="mb-4 flex items-center justify-between">
          <h5 className="font-semibold text-primary">{selectedDeptName}</h5>
          <Badge color="info">{employees.length} Karyawan</Badge>
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
              ) : employees.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={8} className="text-center py-10">
                    Tidak ada data karyawan
                  </Table.Cell>
                </Table.Row>
              ) : (
                employees.map((emp, index) => (
                  <Table.Row key={`${emp.id}-${emp.nik || 'no-nik'}-${emp.departemen_id ?? 'no-dept'}-${index}`} className="bg-white dark:border-gray-700 dark:bg-gray-800">
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
