"use client";
import React, { useEffect, useState } from "react";
import { Table, Button, Select, TextInput, Badge, Alert, Spinner } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import periodeService, { Periode } from "@/services/periodeService";
import kpiService, { KPI, KPIGroup } from "@/services/kpiService";
import karyawanService, { Karyawan } from "@/services/karyawanService";
import divisiService, { Divisi } from "@/services/divisiService";
import spkService from "@/services/spkService";
import { usePermission } from "@/hooks/usePermission";
import { normalizeRole } from "@/utils/accessControl";

const PenilaianKaryawan = () => {
  const { hasPermission, filterEmployeesByScope, normalizedRole } = usePermission();
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number>(0);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [groups, setGroups] = useState<KPIGroup[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [workLocations, setWorkLocations] = useState<Array<{ id: string | number; name: string }>>([]);
  const [allEmployees, setAllEmployees] = useState<Karyawan[]>([]);
  const [departments, setDepartments] = useState<Divisi[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
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
      const locationRes = await karyawanService.getWorkLocations();

      const activeList = (periodeRes.data as any[]).map((p: any) => ({
        ...p,
        // Ensure status mapping consistency for filtering
        isAktif: p.Status === 'Final' ? true : p.isAktif
      }));
      setPeriodes(activeList);
      setDepartments(karyawanRes.data);
      setWorkLocations(locationRes.data || []);

      const firstActive = activeList.find(p => p.Status !== 'Final' && p.isAktif) || activeList[0];
      if (firstActive) {
        setSelectedPeriodeId(firstActive.Id || firstActive.id);
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
          {
            ...(selectedDeptId === "all" ? {} : { dept_id: Number(selectedDeptId) }),
            ...(selectedLocation === "all" ? {} : { lokasi_kerja: selectedLocation }),
          }
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
  }, [selectedDeptId, selectedLocation]);

  const filteredPeriodes = periodes.filter((periode: any) => {
    if (selectedDeptId === "all") return true;
    const currentDivisiId = periode.DivisiId ?? periode.divisiId ?? periode.divisi?.id;
    if (currentDivisiId === null || currentDivisiId === undefined || currentDivisiId === 0) {
      return true;
    }
    return Number(currentDivisiId) === Number(selectedDeptId);
  });

  useEffect(() => {
    if (selectedPeriodeId !== 0) {
      const fetchData = async () => {
        try {
          const [resKpi, resGroup] = await Promise.all([
            kpiService.getByPeriode(selectedPeriodeId),
            kpiService.getGroups(selectedPeriodeId)
          ]);
          setKpis(resKpi.data);
          setGroups(resGroup.data);
        } catch (err) {
          console.error("Gagal ambil data penunjang", err);
        }
      };
      fetchData();
    } else {
      setKpis([]);
      setGroups([]);
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
      
      setSuccess("Penilaian berhasil disimpan (Draft) dan ranking diperbarui. Laporan kini menunggu persetujuan Manager.");
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
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedPeriodeId(0);
              }}
              sizing="sm"
              className="w-48"
            >
              <option value="all">Semua Departemen</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.namaDivisi}</option>
              ))}
            </Select>
            <Select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              sizing="sm"
              className="w-48"
            >
              <option value="all">Semua Lokasi</option>
              {workLocations.map((loc) => (
                <option key={loc.id} value={String(loc.name)}>{loc.name}</option>
              ))}
            </Select>
            <Select
              value={selectedPeriodeId}
              onChange={(e) => setSelectedPeriodeId(Number(e.target.value))}
              sizing="sm"
              className="w-48"
            >
                <option value={0}>Pilih Periode</option>
                {filteredPeriodes.map((p: any) => (
                  <option key={p.Id || p.id} value={p.Id || p.id}>
                    {(p.NamaPeriode || p.namaPeriode) + " - " + (p.NamaDivisi || p.divisi?.namaDivisi || "Divisi") + (p.Status === 'Final' ? ' (Final)' : '')}
                  </option>
                ))}
            </Select>
            {hasPermission("score_input") && (
              <Button
                color="primary"
                size="sm"
                onClick={handleSaveAll}
                disabled={submitting || !selectedPeriodeId || kpis.length === 0 || employees.length === 0 || selectedPeriode?.Status === 'Final'}
              >
                 <Icon icon="solar:diskette-bold-duotone" className="mr-2 h-5 w-5" />
                 {submitting ? "Menyimpan..." : selectedPeriode?.Status === 'Final' ? "Terkunci (Final)" : "Simpan Semua"}
              </Button>
            )}
        </div>
      </div>

      {error && <Alert color="failure" className="mb-4">{error}</Alert>}
      {success && (
        <Alert color="success" className="mb-4" icon={() => <Icon icon="solar:check-circle-bold" className="h-5 w-5" />}>
           <div>
            <span className="font-bold">{success}</span>
          </div>
        </Alert>
      )}

      <CardBox>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-10">
              <Spinner size="xl" />
            </div>
          ) : employees.length === 0 ? (
             <div className="text-center py-20 text-gray-400 italic">
               {selectedPeriodeId === 0 ? "Pilih Periode - Divisi di atas" : "Tidak ada karyawan ditemukan untuk unit kerja ini."}
             </div>
          ) : (
            <div className="space-y-8">
              {groups.length === 0 ? (
                <Table hoverable>
                  <Table.Head>
                    <Table.HeadCell>NIK</Table.HeadCell>
                    <Table.HeadCell>Nama Karyawan</Table.HeadCell>
                    {kpis.map((kpi) => (
                      <Table.HeadCell key={kpi.Id || kpi.id} className="text-center">{kpi.NamaKpi}</Table.HeadCell>
                    ))}
                  </Table.Head>
                  <Table.Body className="divide-y">
                    {employees.map((emp) => (
                      <Table.Row key={emp.id} className="bg-white">
                        <Table.Cell className="font-medium">{emp.nik}</Table.Cell>
                        <Table.Cell>{emp.nama}</Table.Cell>
                        {kpis.map((kpi) => {
                          const key = `${emp.id}-${kpi.Id}`;
                          return (
                            <Table.Cell key={kpi.Id} className="text-center">
                              <TextInput
                                sizing="sm"
                                type="number"
                                value={scores[key] ?? ""}
                                onChange={(e) => setScores({...scores, [key]: e.target.value})}
                                disabled={selectedPeriode?.Status === 'Final'}
                              />
                            </Table.Cell>
                          );
                        })}
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              ) : (
                groups.map((group) => {
                  const groupKpis = kpis.filter(k => Number(k.GroupId) === group.Id);
                  if (groupKpis.length === 0) return null;
                  return (
                    <div key={group.Id} className="border border-gray-100 rounded-lg p-4 bg-gray-50/30">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge color="info" className="uppercase font-bold">{group.NamaGroup}</Badge>
                        <span className="text-xs text-gray-400">Level 2 Indicators</span>
                      </div>
                      <Table hoverable striped>
                        <Table.Head>
                          <Table.HeadCell className="w-48 text-left">Nama Karyawan</Table.HeadCell>
                          {groupKpis.map(k => (
                            <Table.HeadCell key={k.Id} className="text-center">{k.NamaKpi}</Table.HeadCell>
                          ))}
                        </Table.Head>
                        <Table.Body className="divide-y">
                          {employees.map(emp => (
                            <Table.Row key={`${emp.id}-${group.Id}`} className="bg-white">
                              <Table.Cell className="text-sm font-bold text-gray-700">{emp.nama}</Table.Cell>
                              {groupKpis.map(k => {
                                const key = `${emp.id}-${k.Id}`;
                                return (
                                  <Table.Cell key={k.Id} className="text-center">
                                    <div className="flex justify-center">
                                      <TextInput
                                        sizing="sm"
                                        type="number"
                                        className="w-24 text-center"
                                        value={scores[key] ?? ""}
                                        onChange={(e) => setScores({...scores, [key]: e.target.value})}
                                        disabled={selectedPeriode?.Status === 'Final'}
                                      />
                                    </div>
                                  </Table.Cell>
                                );
                              })}
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </CardBox>
    </div>
  );
};

export default PenilaianKaryawan;
