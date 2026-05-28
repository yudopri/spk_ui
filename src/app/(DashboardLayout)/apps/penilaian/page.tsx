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
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [scores, setScores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
            search: debouncedSearch,
            pageSize: 100
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
  }, [selectedDeptId, selectedLocation, debouncedSearch]);

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
      {/* Stepper Progress Tracker */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto overflow-x-auto gap-4">
          {[
            { step: 1, label: "Master KPI", icon: "solar:settings-bold" },
            { step: 2, label: "Bandingkan Grup", icon: "solar:folder-2-bold" },
            { step: 3, label: "Bandingkan KPI", icon: "solar:documents-bold" },
            { step: 4, label: "Input Nilai", icon: "solar:pen-new-square-bold" },
            { step: 5, label: "Hasil & Review", icon: "solar:chart-square-bold" }
          ].map((s, idx) => {
            const isCurrent = s.step === 4;
            const isDone = s.step < 4;
            return (
              <React.Fragment key={s.step}>
                <div className="flex flex-col items-center min-w-[100px] text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    isCurrent ? "bg-primary text-white ring-4 ring-primary/20" : 
                    isDone ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                  }`}>
                    <Icon icon={isDone ? "solar:check-read-bold" : s.icon} className="h-5 w-5" />
                  </div>
                  <span className={`text-xs font-bold whitespace-nowrap ${isCurrent ? "text-primary" : "text-gray-500"}`}>{s.label}</span>
                </div>
                {idx < 4 && <div className={`flex-1 h-[2px] min-w-[20px] mb-6 ${isDone ? "bg-green-500" : "bg-gray-100"}`} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold">Penilaian Karyawan</h1>
          <p className="text-sm text-gray-500">Pilih departemen dan periode untuk memulai penilaian</p>
        </div>
        <div className="flex flex-wrap gap-4">
            <div className="w-56">
                <TextInput 
                    icon={() => <Icon icon="solar:magnifer-linear" />}
                    placeholder="Nama Karyawan..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sizing="sm"
                />
            </div>
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

      <CardBox className="border-none shadow-none bg-transparent p-0">
        <div className="overflow-x-auto pb-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl shadow-sm">
              <Spinner size="xl" />
              <p className="mt-4 text-gray-500 font-medium italic">Menyiapkan lembar penilaian...</p>
            </div>
          ) : employees.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-2xl shadow-sm flex flex-col items-center">
               <div className="bg-gray-50 p-6 rounded-full mb-4">
                 <Icon icon="solar:user-block-bold-duotone" className="h-12 w-12 text-gray-300" />
               </div>
               <p className="text-gray-500 font-bold max-w-xs uppercase tracking-tight">
                 {selectedPeriodeId === 0 ? "Pilih Periode & Divisi untuk memulai" : "Karyawan tidak ditemukan untuk kriteria ini"}
               </p>
             </div>
          ) : (
            <div className="space-y-10">
              {groups.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                  <Table hoverable className="border-none">
                    <Table.Head className="bg-gray-50/80">
                      <Table.HeadCell className="py-5 pl-8 text-gray-600 font-black uppercase text-[10px] tracking-widest w-72">Informasi Karyawan</Table.HeadCell>
                      {kpis.map((kpi) => (
                        <Table.HeadCell key={kpi.Id || kpi.id} className="text-center py-5">
                           <div className="flex flex-col items-center gap-1">
                              <span className="text-gray-700 font-black uppercase text-[10px] tracking-widest">{kpi.NamaKpi}</span>
                              <Badge color="gray" size="xs" className="font-normal">{kpi.nama_satuan || kpi.simbol || 'Nilai'}</Badge>
                           </div>
                        </Table.HeadCell>
                      ))}
                    </Table.Head>
                    <Table.Body className="divide-y divide-gray-100">
                      {employees.map((emp) => (
                        <Table.Row key={emp.id} className="group hover:bg-primary/5 transition-colors">
                          <Table.Cell className="py-5 pl-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-400 group-hover:bg-primary group-hover:text-white transition-all">
                                {emp.nama.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900 leading-none mb-1">{emp.nama}</span>
                                <span className="text-[10px] text-gray-500 font-mono">{emp.nik}</span>
                              </div>
                            </div>
                          </Table.Cell>
                          {kpis.map((kpi) => {
                            const key = `${emp.id}-${kpi.Id || (kpi as any).id}`;
                            return (
                              <Table.Cell key={kpi.Id || (kpi as any).id} className="text-center py-5">
                                <div className="flex justify-center">
                                  <TextInput
                                    sizing="sm"
                                    type="number"
                                    className="w-28 text-center"
                                    placeholder="0"
                                    rightIcon={() => <span className="text-[10px] font-bold text-gray-400 mr-2">{kpi.simbol || ''}</span>}
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
              ) : (
                groups.map((group) => {
                  const groupKpis = kpis.filter(k => Number(k.GroupId) === group.Id);
                  if (groupKpis.length === 0) return null;
                  return (
                    <div key={group.Id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-lg">
                            <Icon icon="solar:folder-2-bold" className="text-primary h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 uppercase tracking-tight">{group.NamaGroup}</h3>
                            <p className="text-[10px] text-gray-500 font-medium">KELOMPOK KRITERIA LEVEL 1</p>
                          </div>
                        </div>
                        <Badge color="info" size="sm" className="px-3 rounded-full uppercase">{groupKpis.length} Indikator</Badge>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <Table hoverable className="border-none">
                          <Table.Head className="bg-gray-50/50">
                            <Table.HeadCell className="py-4 pl-6 text-gray-600 font-black uppercase text-[10px] tracking-widest w-64">Nama Karyawan</Table.HeadCell>
                            {groupKpis.map(k => (
                              <Table.HeadCell key={k.Id} className="text-center py-4 text-gray-600 font-black uppercase text-[10px] tracking-widest min-w-[140px]">
                                <div className="flex flex-col items-center gap-1">
                                  <span>{k.NamaKpi}</span>
                                  <Badge color="gray" size="xs" className="font-normal italic">
                                    {k.nama_satuan || k.simbol || 'Nilai'}
                                  </Badge>
                                </div>
                              </Table.HeadCell>
                            ))}
                          </Table.Head>
                          <Table.Body className="divide-y divide-gray-100">
                            {employees.map(emp => (
                              <Table.Row key={`${emp.id}-${group.Id}`} className="group transition-colors">
                                <Table.Cell className="py-4 pl-6 border-none">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:bg-primary group-hover:text-white transition-colors">
                                      {emp.nama.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-gray-900 leading-none mb-1">{emp.nama}</span>
                                      <span className="text-[10px] text-gray-400 font-mono tracking-tighter">{emp.nik}</span>
                                    </div>
                                  </div>
                                </Table.Cell>
                                {groupKpis.map(k => {
                                  const key = `${emp.id}-${k.Id}`;
                                  return (
                                    <Table.Cell key={k.Id} className="text-center py-4 border-none">
                                      <div className="relative group/input flex justify-center">
                                        <TextInput
                                          sizing="sm"
                                          type="number"
                                          className="w-28 text-center"
                                          placeholder="0"
                                          rightIcon={() => <span className="text-[9px] font-black text-gray-400 mr-2">{k.simbol || ''}</span>}
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
