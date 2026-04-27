"use client";
import React, { useEffect, useState } from "react";
import { Table, Button, Select, TextInput, Badge, Alert, Spinner } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import periodeService, { Periode } from "@/services/periodeService";
import kpiService, { KPI } from "@/services/kpiService";
import karyawanService, { Karyawan } from "@/services/karyawanService";
import divisiService, { Divisi } from "@/services/divisiService";
import spkService from "@/services/spkService";
import { usePermission } from "@/hooks/usePermission";
import { normalizeRole } from "@/utils/accessControl";

const PenilaianKaryawan = () => {
  const { hasPermission, filterEmployeesByScope, normalizedRole } = usePermission();
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number>(0);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [allEmployees, setAllEmployees] = useState<Karyawan[]>([]);
  const [departments, setDepartments] = useState<Divisi[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | string>("all");
  const [scores, setScores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [periodeRes, karyawanRes] = await Promise.all([
        periodeService.getAll(),
        divisiService.getAll(),
      ]);

      const activeList = (periodeRes.data as any[]).filter((p) => p.isAktif);
      setPeriodes(activeList);
      setDepartments(karyawanRes.data);

      if (activeList.length > 0) {
        setSelectedPeriodeId(activeList[0].Id || activeList[0].id);
      }

      if (karyawanRes.data.length > 0) {
        setSelectedDeptId(karyawanRes.data[0].id);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal mengambil data awal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await karyawanService.getAll(
          selectedDeptId === "all" ? {} : { dept_id: Number(selectedDeptId) }
        );
        const scopedEmployees = (filterEmployeesByScope(res.data || []) as Karyawan[]).filter((employee) => {
          if (normalizedRole === "Kadiv") {
            return normalizeRole(employee.role) !== "Manager";
          }
          return true;
        });
        setAllEmployees(scopedEmployees);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Gagal mengambil data karyawan");
      }
    };

    fetchEmployees();
  }, [selectedDeptId]);

  useEffect(() => {
    if (selectedPeriodeId !== 0) {
      const fetchKpis = async () => {
        try {
          const res = await kpiService.getByPeriode(selectedPeriodeId);
          setKpis(res.data);
        } catch (err) {
          console.error("Gagal ambil KPI", err);
        }
      };
      fetchKpis();
    }
  }, [selectedPeriodeId]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const employees = allEmployees;

  const handleSaveAll = async () => {
    if (!selectedPeriodeId || kpis.length === 0 || employees.length === 0) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const payload: any[] = [];

      for (const emp of employees) {
        for (const kpi of kpis) {
          const key = `${emp.id}-${kpi.Id || (kpi as any).id}`;
          const raw = scores[key];
          
          payload.push({
            KaryawanId: emp.id,
            KpiId: kpi.Id || (kpi as any).id,
            PeriodeId: selectedPeriodeId,
            Nilai: raw === "" || raw === undefined ? 0 : Number(raw),
          });
        }
      }

      if (payload.length === 0 && employees.length > 0) {
        setError("Belum ada nilai yang diinput");
        return;
      }

      const res = await spkService.saveMooraPenilaian(payload as any);
      
      // Hitung otomatis MOORA setelah simpan penilaian
      await spkService.calculateMoora(selectedPeriodeId);
      
      setSuccess(res?.message || "Penilaian berhasil disimpan dan ranking diperbarui");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal menyimpan penilaian");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPeriode = periodes.find(p => (p as any).Id === selectedPeriodeId || (p as any).id === selectedPeriodeId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold">Penilaian Karyawan</h1>
          <p className="text-sm text-gray-500">Pilih departemen dan periode untuk memulai penilaian</p>
        </div>
        <div className="flex flex-wrap gap-4">
            <Select 
              value={selectedDeptId} 
              onChange={(e) => setSelectedDeptId(e.target.value)}
              sizing="sm"
              className="w-48"
            >
              <option value="all">Semua Departemen</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.namaDivisi}</option>
              ))}
            </Select>
            <Select
              value={selectedPeriodeId}
              onChange={(e) => setSelectedPeriodeId(Number(e.target.value))}
              sizing="sm"
              className="w-48"
            >
                <option value={0}>Pilih Periode</option>
                {periodes.map((p: any) => (
                  <option key={p.Id || p.id} value={p.Id || p.id}>
                    {p.NamaPeriode || p.namaPeriode}
                  </option>
                ))}
            </Select>
            {hasPermission("score_input") && (
              <Button
                color="primary"
                size="sm"
                onClick={handleSaveAll}
                disabled={submitting || !selectedPeriodeId || kpis.length === 0 || employees.length === 0}
              >
                 <Icon icon="solar:diskette-bold-duotone" className="mr-2 h-5 w-5" />
                 {submitting ? "Menyimpan..." : "Simpan Semua"}
              </Button>
            )}
        </div>
      </div>

      {error && <Alert color="failure">{error}</Alert>}
      {success && <Alert color="success">{success}</Alert>}

      <CardBox>
        <div className="mb-4 flex items-center justify-between">
           <h5 className="font-semibold text-primary underline decoration-dotted">
             {selectedPeriodeId === 0
              ? "Silakan pilih periode untuk melihat kriteria" 
              : `Kriteria Aktif: ${kpis.map((k: any) => k.NamaKpi || k.namaKpi).join(", ")}`}
           </h5>
           {selectedPeriodeId !== 0 && (
             <Badge color="info">Periode: {selectedPeriode?.NamaPeriode || (selectedPeriode as any)?.namaPeriode}</Badge>
           )}
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-10">
              <Spinner size="xl" />
            </div>
          ) : (
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>NIK</Table.HeadCell>
              <Table.HeadCell>Nama Karyawan</Table.HeadCell>
              {kpis.map((kpi) => (
                <Table.HeadCell key={kpi.id} className="text-center">{kpi.namaKpi}</Table.HeadCell>
              ))}
            </Table.Head>
            <Table.Body className="divide-y">
              {employees.length > 0 ? employees.map((emp, index) => (
                <Table.Row key={`${emp.id}-${emp.nik || 'no-nik'}-${emp.departemen_id ?? 'no-dept'}-${index}`} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell className="font-medium text-gray-900 dark:text-white">{emp.nik}</Table.Cell>
                  <Table.Cell>{emp.nama}</Table.Cell>
                  {kpis.map((kpi: any) => {
                    const key = `${emp.id}-${kpi.Id || kpi.id}`;
                    return (
                    <Table.Cell key={kpi.Id || kpi.id} className="text-center">
                       <TextInput
                         type="number"
                         sizing="sm"
                         placeholder="0-100"
                         className="w-20 mx-auto"
                         value={scores[key] ?? ""}
                         onChange={(e) => {
                           const value = e.target.value;
                           setScores((prev) => ({ ...prev, [key]: value }));
                         }}
                         disabled={!hasPermission("score_input")}
                       />
                    </Table.Cell>
                  );})}
                </Table.Row>
              )) : (
                <Table.Row>
                   <Table.Cell colSpan={2 + kpis.length} className="text-center py-20 text-gray-400">
                      {selectedPeriodeId === 0
                        ? "Pilih Periode - Divisi di atas untuk menampilkan daftar karyawan" 
                        : "Tidak ada karyawan ditemukan untuk unit kerja ini."}
                   </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
          )}
        </div>
      </CardBox>
    </div>
  );
};

export default PenilaianKaryawan;
