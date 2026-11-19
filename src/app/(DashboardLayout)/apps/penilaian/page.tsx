"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Table, Button, Badge, Alert, Spinner, TextInput } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import periodeService, { Periode } from "@/services/periodeService";
import kpiService, { KPI, KPIGroup } from "@/services/kpiService";
import karyawanService, { Karyawan } from "@/services/karyawanService";
import divisiService, { Divisi } from "@/services/divisiService";
import spkService from "@/services/spkService";
import { usePermission } from "@/hooks/usePermission";
import { normalizeRole } from "@/utils/accessControl";
import { getApiErrorMessage } from "@/utils/apiError";

// Shared Components
import DataSearch from "@/app/components/shared/DataSearch";
import DataFilter from "@/app/components/shared/DataFilter";
import DataPagination from "@/app/components/shared/DataPagination";

import { Checkbox, Label } from "flowbite-react";

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
  const [includeManagement, setIncludeManagement] = useState(true);
  
  // Pagination & Search States
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const [scores, setScores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const selectedPeriode = useMemo(() => 
    periodes.find(p => Number(p.Id || p.id) === Number(selectedPeriodeId)),
    [periodes, selectedPeriodeId]
  );

  const isLocked = selectedPeriode?.Status === 'locked';
  const isProcessed = selectedPeriode?.Status === 'processed' || selectedPeriode?.Status === 'Processed';
  const isReadOnlyPeriode = isLocked || isProcessed;

  const filteredPeriodes = useMemo(() => {
    if (selectedDeptId === "all") return periodes;
    return periodes.filter(p => Number(p.DivisiId || p.divisiId) === Number(selectedDeptId));
  }, [periodes, selectedDeptId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [periodeRes, divisiRes] = await Promise.all([
        periodeService.getAll(1, 100),
        divisiService.getAll(),
      ]);
      const locationRes = await karyawanService.getWorkLocations();

      setPeriodes(periodeRes.data);
      setDepartments(divisiRes.data);
      setWorkLocations(locationRes.data || []);

      // Dukungan deep link ?periodeId= (dari halaman Periode KPI)
      let targetPeriode: Periode | undefined = undefined;
      if (typeof window !== 'undefined') {
        const q = new URLSearchParams(window.location.search).get('periodeId');
        if (q) {
          targetPeriode = periodeRes.data.find((p: Periode) => Number(p.Id || p.id) === Number(q));
        }
      }

      const firstActive = targetPeriode
        || periodeRes.data.find(p => p.Status !== 'locked' && (p as any).isAktif)
        || periodeRes.data[0];
      if (firstActive) {
        setSelectedPeriodeId(Number(firstActive.Id || firstActive.id));
      }

      if (divisiRes.data.length > 0) {
        setSelectedDeptId(divisiRes.data[0].id);
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Gagal mengambil data awal"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const res = await karyawanService.getAll({
          dept_id: selectedDeptId === "all" ? undefined : Number(selectedDeptId),
          lokasi_kerja: selectedLocation === "all" ? undefined : selectedLocation,
          search: searchTerm,
          page,
          pageSize,
          include_management_roles: includeManagement,
        });

        const scopedEmployees = (filterEmployeesByScope(res.data || []) as Karyawan[]);
        setAllEmployees(scopedEmployees);
        setTotalItems(res.meta?.total || 0);
      } catch (err: any) {
        setError(getApiErrorMessage(err, "Gagal mengambil data karyawan"));
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [selectedDeptId, selectedLocation, searchTerm, page, pageSize, includeManagement]);

  useEffect(() => {
    if (selectedPeriodeId !== 0) {
      const fetchData = async () => {
        try {
          // Ambil seluruh KPI untuk periode terpilih (tidak terikat pageSize tabel karyawan)
          const [resKpi, resGroup] = await Promise.all([
            kpiService.getByPeriode(selectedPeriodeId, 1, 1000),
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

  // Reset nilai input saat konteks (periode/divisi/lokasi/halaman) berubah agar tidak bocor antar konteks
  useEffect(() => {
    setScores({});
  }, [selectedPeriodeId, selectedDeptId, selectedLocation, page]);

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
      setWarning(null);

      const payload: any[] = [];

      for (const emp of employees) {
        for (const kpi of kpis) {
          const key = `${emp.id}-${kpi.Id || (kpi as any).id}`;
          const raw = scores[key];

          // Lewati sel yang tidak diisi agar tidak menimpa nilai yang sudah tersimpan di backend dengan 0
          if (raw === "" || raw === undefined || raw === null || isNaN(Number(raw))) continue;

          payload.push({
            KaryawanId: emp.id,
            KpiId: kpi.Id || (kpi as any).id,
            PeriodeId: selectedPeriodeId,
            Realisasi: Number(raw),
          });
        }
      }

      if (payload.length === 0) {
        setError("Belum ada nilai yang diinput");
        return;
      }

      const res = await spkService.saveMooraRealisasi(payload as any);

      if (res?.success === false) {
        setError(res?.message || "Gagal menyimpan penilaian");
        return;
      }

      // Simpan berhasil → tampilkan sukses dulu sebelum mencoba hitung ranking
      setSuccess("Penilaian berhasil disimpan (Draft).");

      // Hitung MOORA dalam try/catch terpisah; kegagalan hitung tidak menghilangkan info simpan sukses
      try {
        const calcRes = await spkService.calculateMoora(selectedPeriodeId);

        if (calcRes?.success === false) {
          setWarning(`Nilai tersimpan, tapi ranking belum dihitung (${calcRes?.message || "bobot AHP belum tersedia"})`);
        } else {
          setSuccess("Penilaian berhasil disimpan (Draft) dan ranking diperbarui. Laporan kini menunggu persetujuan Manager.");
        }
      } catch (calcErr: any) {
        setWarning(`Nilai tersimpan, tapi ranking belum dihitung (${getApiErrorMessage(calcErr, "bobot AHP belum tersedia")})`);
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Gagal menyimpan penilaian"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Stepper Progress Tracker */}
      <div className="bg-white dark:bg-darkgray p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto overflow-x-auto gap-4">
          {[
            { step: 1, label: "Master KPI", icon: "solar:settings-bold" },
            { step: 2, label: "Bandingkan Grup", icon: "solar:folder-2-bold" },
            { step: 3, label: "Bandingkan KPI", icon: "solar:documents-bold" },
            { step: 4, label: "Input Realisasi", icon: "solar:pen-new-square-bold" },
            { step: 5, label: "Hasil & Review", icon: "solar:chart-square-bold" }
          ].map((s, idx) => {
            const isCurrent = s.step === 4;
            const isDone = s.step < 4;
            return (
              <React.Fragment key={s.step}>
                <div className="flex flex-col items-center min-w-[100px] text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    isCurrent ? "bg-primary text-white ring-4 ring-primary/20" : 
                    isDone ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400 dark:bg-darkmuted dark:text-gray-500"
                  }`}>
                    <Icon icon={isDone ? "solar:check-read-bold" : s.icon} className="h-5 w-5" />
                  </div>
                  <span className={`text-xs font-bold whitespace-nowrap ${isCurrent ? "text-primary" : "text-gray-500"}`}>{s.label}</span>
                </div>
                {idx < 4 && <div className={`flex-1 h-[2px] min-w-[20px] mb-6 ${isDone ? "bg-green-500" : "bg-gray-100 dark:bg-darkmuted"}`} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white dark:bg-darkgray p-4 rounded-xl shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold">Penilaian Karyawan</h1>
          <p className="text-sm text-gray-500">Pilih departemen dan periode untuk memulai penilaian</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <DataSearch 
                placeholder="Nama Karyawan..." 
                onSearch={(val) => {
                  setSearchTerm(val);
                  setPage(1);
                }}
            />
            <DataFilter
              value={selectedDeptId}
              onChange={(val) => {
                setSelectedDeptId(val);
                setSelectedPeriodeId(0);
                setPage(1);
              }}
              options={departments.map(d => ({ value: d.id, label: d.namaDivisi }))}
              placeholder="Semua Departemen"
              className="w-full md:w-48"
            />
            <DataFilter
              value={selectedLocation}
              onChange={(val) => {
                setSelectedLocation(val);
                setPage(1);
              }}
              options={workLocations.map(l => ({ value: String(l.name), label: l.name }))}
              placeholder="Semua Lokasi"
              className="w-full md:w-36"
            />
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-darkmuted px-3 py-2 rounded-lg border border-gray-200 dark:border-darkborder h-[42px]">
              <Checkbox 
                id="includeManagement" 
                checked={includeManagement} 
                onChange={(e) => setIncludeManagement(e.target.checked)}
              />
              <Label htmlFor="includeManagement" className="text-xs font-bold whitespace-nowrap cursor-pointer">Sertakan Manajemen</Label>
            </div>
            <DataFilter
              value={selectedPeriodeId}
              onChange={(val) => {
                setSelectedPeriodeId(Number(val));
                setPage(1);
              }}
              options={filteredPeriodes.map(p => ({ 
                value: p.Id || p.id, 
                label: `${p.NamaPeriode || p.namaPeriode} - ${p.NamaDivisi || p.divisi?.namaDivisi || "Divisi"}${p.Status ? ` (${p.Status})` : ''}`
              }))}
              placeholder="Pilih Periode"
              className="w-full md:w-56"
            />
            {hasPermission("score_input") && (
              <Button
                color="primary"
                onClick={handleSaveAll}
                disabled={submitting || !selectedPeriodeId || kpis.length === 0 || allEmployees.length === 0 || isReadOnlyPeriode}
                className="w-full md:w-auto"
              >
                 <Icon icon="solar:diskette-bold-duotone" className="mr-2 h-5 w-5" />
                 {submitting ? "Menyimpan..." : isLocked ? "Terkunci" : isProcessed ? "Sudah Diproses" : "Simpan Realisasi"}
              </Button>
            )}
        </div>
      </div>

      {error && <Alert color="failure" className="mb-4" onDismiss={() => setError(null)}>{error}</Alert>}
      {warning && <Alert color="warning" className="mb-4" onDismiss={() => setWarning(null)}>{warning}</Alert>}
      {isProcessed && (
        <Alert color="warning" className="mb-4" icon={() => <Icon icon="solar:lock-bold" className="h-5 w-5" />}>
          Periode sudah diproses, nilai tidak dapat diubah.
        </Alert>
      )}
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
            <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-darkgray rounded-2xl shadow-sm">
              <Spinner size="xl" />
              <p className="mt-4 text-gray-500 font-medium italic">Menyiapkan lembar penilaian...</p>
            </div>
          ) : employees.length === 0 ? (
             <div className="text-center py-20 bg-white dark:bg-darkgray rounded-2xl shadow-sm flex flex-col items-center">
               <div className="bg-gray-50 dark:bg-darkmuted p-6 rounded-full mb-4">
                 <Icon icon="solar:user-block-bold-duotone" className="h-12 w-12 text-gray-300" />
               </div>
               <p className="text-gray-500 font-bold max-w-xs uppercase tracking-tight">
                 {selectedPeriodeId === 0
                    ? "Pilih Periode & Divisi untuk memulai"
                    : isProcessed
                      ? "Periode sudah diproses, nilai tidak dapat diubah"
                      : "Karyawan tidak ditemukan untuk kriteria ini"}
               </p>
             </div>
          ) : (
            <div className="space-y-10">
              {groups.length === 0 ? (
                <div className="bg-white dark:bg-darkgray rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-darkborder">
                  <div className="overflow-x-auto">
                    <Table hoverable className="border-none">
                    <Table.Head className="bg-gray-50/80 dark:bg-darkmuted">
                      <Table.HeadCell className="py-5 pl-8 text-gray-600 font-black uppercase text-[10px] tracking-widest w-72">Informasi Karyawan</Table.HeadCell>
                      {kpis.map((kpi) => (
                        <Table.HeadCell key={kpi.Id || kpi.id} className="text-center py-5">
                           <div className="flex flex-col items-center gap-1">
                              <span className="text-gray-700 dark:text-gray-200 font-black uppercase text-[10px] tracking-widest">{kpi.NamaKpi}</span>
                              <Badge color="gray" size="xs" className="font-normal">{kpi.Attribute || kpi.nama_satuan || kpi.simbol || 'Satuan'}</Badge>
                           </div>
                        </Table.HeadCell>
                      ))}
                    </Table.Head>
                    <Table.Body className="divide-y divide-gray-100 dark:divide-darkborder">
                      {employees.map((emp) => (
                        <Table.Row key={emp.id} className="group hover:bg-primary/5 transition-colors">
                          <Table.Cell className="py-5 pl-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-darkmuted flex items-center justify-center font-black text-gray-400 dark:text-gray-500 group-hover:bg-primary group-hover:text-white transition-all">
                                {emp.nama.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900 dark:text-white leading-none mb-1">{emp.nama}</span>
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
                                    rightIcon={() => <span className="text-[10px] font-bold text-gray-400 mr-2">{kpi.Attribute || kpi.simbol || ''}</span>}
                                    value={scores[key] ?? ""}
                                    onChange={(e) => setScores({...scores, [key]: e.target.value})}
                                    disabled={isReadOnlyPeriode}
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
              ) : (
                groups.map((group) => {
                  const groupKpis = kpis.filter(k => Number(k.GroupId) === group.Id);
                  if (groupKpis.length === 0) return null;
                  return (
                    <div key={group.Id} className="border border-gray-200 dark:border-darkborder rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                      <div className="bg-gray-50 dark:bg-darkmuted border-b border-gray-200 dark:border-darkborder px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-lg">
                            <Icon icon="solar:folder-2-bold" className="text-primary h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 dark:text-white uppercase tracking-tight">{group.NamaGroup}</h3>
                            <p className="text-[10px] text-gray-500 font-medium">KELOMPOK KRITERIA LEVEL 1</p>
                          </div>
                        </div>
                        <Badge color="info" size="sm" className="px-3 rounded-full uppercase">{groupKpis.length} Indikator</Badge>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <Table hoverable className="border-none">
                          <Table.Head className="bg-gray-50/50 dark:bg-darkmuted">
                            <Table.HeadCell className="py-4 pl-6 text-gray-600 font-black uppercase text-[10px] tracking-widest w-64">Nama Karyawan</Table.HeadCell>
                            {groupKpis.map(k => (
                              <Table.HeadCell key={k.Id} className="text-center py-4 text-gray-600 font-black uppercase text-[10px] tracking-widest min-w-[140px]">
                                <div className="flex flex-col items-center gap-1">
                                  <span>{k.NamaKpi}</span>
                                  <Badge color="gray" size="xs" className="font-normal italic">
                                    {k.Attribute || k.nama_satuan || k.simbol || 'Satuan'}
                                  </Badge>
                                </div>
                              </Table.HeadCell>
                            ))}
                          </Table.Head>
                          <Table.Body className="divide-y divide-gray-100 dark:divide-darkborder">
                            {employees.map(emp => (
                              <Table.Row key={`${emp.id}-${group.Id}`} className="group transition-colors">
                                <Table.Cell className="py-4 pl-6 border-none">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-darkmuted flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors">
                                      {emp.nama.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1">{emp.nama}</span>
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
                                          rightIcon={() => <span className="text-[9px] font-black text-gray-400 mr-2">{k.Attribute || k.simbol || ''}</span>}
                                          value={scores[key] ?? ""}
                                          onChange={(e) => setScores({...scores, [key]: e.target.value})}
                                          disabled={isReadOnlyPeriode}
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

export default PenilaianKaryawan;
