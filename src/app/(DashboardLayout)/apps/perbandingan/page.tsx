"use client";
import React, { useEffect, useState } from "react";
import { Table, Select, Button, Badge, Alert, Spinner } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import periodeService, { Periode } from "@/services/periodeService";
import kpiService, { KPI, KPIGroup } from "@/services/kpiService";
import spkService from "@/services/spkService";
import { usePermission } from "@/hooks/usePermission";

const NilaiPerbandingan = () => {
  const { user, isAdminLike } = usePermission();
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number>(0);
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [groups, setGroups] = useState<KPIGroup[]>([]);
  const [kpis, setKpis] = useState<any[]>([]);
  const [comparisonValues, setComparisonValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cr, setCr] = useState<number | null>(null);
  const [weights, setWeights] = useState<Record<number, number>>({});
  const [isSimulated, setIsSimulated] = useState(false);

  useEffect(() => {
    const fetchPeriodes = async () => {
      try {
        setLoading(true);
        const res = await periodeService.getAll(1, 100);
        // Show all periods but prefer active one as default
        setPeriodes(res.data);
        const firstActive = res.data.find((p: Periode) => (p as any).isAktif && p.Status !== 'Final') || res.data[0];
        if (firstActive) setSelectedPeriodeId(firstActive.Id || firstActive.id);
      } catch (err: any) {
        setError("Gagal mengambil data periode");
      } finally {
        setLoading(false);
      }
    };
    fetchPeriodes();
  }, []);

  const selectedPeriode = periodes.find(p => Number(p.Id || p.id) === Number(selectedPeriodeId));
  const isLocked = selectedPeriode?.Status === 'Final';

  useEffect(() => {
    const fetchGroups = async () => {
      if (!selectedPeriodeId) return;
      try {
        const res = await kpiService.getGroups(selectedPeriodeId);
        setGroups(res.data);
      } catch (err) {
        console.error("Gagal mengambil grup", err);
      }
    };
    fetchGroups();
  }, [selectedPeriodeId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedPeriodeId) return;
      try {
          setLoading(true);
          setCr(null);
          setWeights({});
          setIsSimulated(false);
          setSuccess(null);
          let items: any[] = [];
          const nextValues: Record<string, number> = {};
          
          if (selectedGroupId === 0) {
              const res = await kpiService.getGroups(selectedPeriodeId);
              items = res.data;
              const resComp = await spkService.getAhpGroupPerbandingan(selectedPeriodeId);
              if (resComp.success && resComp.data) {
                  resComp.data.forEach((item: any) => {
                      nextValues[`${item.id_a || item.IdA}-${item.id_b || item.IdB}`] = item.nilai;
                  });
              }
          } else {
              const res = await kpiService.getByPeriode(selectedPeriodeId);
              items = res.data.filter((k: KPI) => Number(k.GroupId) === selectedGroupId);
              const resComp = await spkService.getAhpPerbandingan(selectedPeriodeId, selectedGroupId);
              if (resComp.success && resComp.data) {
                  resComp.data.forEach((item: any) => {
                      nextValues[`${item.kpiAId || item.KpiAId}-${item.kpiBId || item.KpiBId}`] = item.nilai;
                  });
              }
          }
          setKpis(items);

          // Fill missing with 1
          for (let i = 0; i < items.length; i++) {
              for (let j = i + 1; j < items.length; j++) {
                  const key = `${items[i].Id || items[i].id}-${items[j].Id || items[j].id}`;
                  if (!(key in nextValues)) nextValues[key] = 1;
              }
          }
          
          setComparisonValues(nextValues);
      } catch (err) {
          setError("Gagal memuat data matriks");
      } finally {
          setLoading(false);
      }
    };
    fetchData();
  }, [selectedPeriodeId, selectedGroupId]);

  const pairs: { itemA: any; itemB: any; key: string }[] = [];
  for (let i = 0; i < kpis.length; i++) {
    for (let j = i + 1; j < kpis.length; j++) {
      pairs.push({
        itemA: kpis[i],
        itemB: kpis[j],
        key: `${kpis[i].Id || kpis[i].id}-${kpis[j].Id || kpis[j].id}`,
      });
    }
  }

  const handleSimulate = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      setWeights({});
      setIsSimulated(false);
      
      if (selectedGroupId === 0) {
        const payload = pairs.map(p => ({
          id_a: p.itemA.Id || p.itemA.id,
          id_b: p.itemB.Id || p.itemB.id,
          nilai: comparisonValues[p.key] || 1
        }));
        await spkService.saveAhpGroupPerbandingan(selectedPeriodeId, payload);
      } else {
        const payload = pairs.map(p => ({
          PeriodeId: selectedPeriodeId,
          Nilai: comparisonValues[p.key] || 1,
          KpiAId: p.itemA.Id || p.itemA.id,
          KpiBId: p.itemB.Id || p.itemB.id
        }));
        await spkService.saveAhpPerbandingan(payload as any);
      }

      const resCalc = await spkService.calculateAhpWeight(selectedPeriodeId, selectedGroupId || undefined);
      if (resCalc.data?.cr !== undefined) {
          setCr(resCalc.data.cr);
          
          // Map weights from results
          const newWeights: Record<number, number> = {};
          if (resCalc.data.weights) {
             resCalc.data.weights.forEach((w: any) => {
                newWeights[w.id || w.Id || w.kpiId] = w.weight || w.Weight || w.nilai;
             });
          } else if (resCalc.data.results) {
             Object.entries(resCalc.data.results).forEach(([k, v]) => {
                newWeights[Number(k)] = Number(v);
             });
          }
          setWeights(newWeights);
          setIsSimulated(true);

          if (resCalc.data.cr >= 0.1) {
            setError(`Input Tidak Konsisten (CR = ${resCalc.data.cr.toFixed(4)}). Silakan perbaiki nilai perbandingan.`);
          } else {
            setSuccess("Matriks berhasil dihitung. Silakan tinjau bobot di bawah ini.");
          }
      }
    } catch (err) {
      setError("Gagal melakukan simulasi perhitungan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!isSimulated || (cr !== null && cr > 0.1)) return;
    setSuccess("Seluruh bobot AHP telah berhasil disimpan secara permanen!");
    // Optional: reload or move to next step
  };

  const getSaatyLabel = (val: number) => {
    if (val === 1) return "Sama Penting";
    if (val === 3) return "Sedikit Lebih Penting";
    if (val === 5) return "Lebih Penting";
    if (val === 7) return "Sangat Kuat Penting";
    if (val === 9) return "Mutlak Lebih Penting";
    if (val === 2) return "Di antara 1 & 3";
    if (val === 4) return "Di antara 3 & 5";
    if (val === 6) return "Di antara 5 & 7";
    if (val === 8) return "Di antara 7 & 9";
    return val;
  };

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
            const isCurrent = (selectedGroupId === 0 && s.step === 2) || (selectedGroupId !== 0 && s.step === 3);
            const isDone = (selectedGroupId === 0 && s.step < 2) || (selectedGroupId !== 0 && s.step < 3);
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

      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm gap-4">
        <div>
           <h1 className="text-2xl font-bold">Matriks AHP Berjenjang</h1>
           <p className="text-sm text-gray-500">Bandingkan prioritas kriteria tiap tingkatan hierarki</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select sizing="sm" value={selectedPeriodeId} onChange={(e) => setSelectedPeriodeId(Number(e.target.value))}>
            {periodes.map(p => <option key={p.Id} value={p.Id}>{p.NamaPeriode}</option>)}
          </Select>
          <Select sizing="sm" value={selectedGroupId} onChange={(e) => setSelectedGroupId(Number(e.target.value))}>
            <option value={0}>Mode Grosir (Group Level 1)</option>
            {groups.map(g => <option key={g.Id} value={g.Id}>Detail: {g.NamaGroup} (Level 2)</option>)}
          </Select>
        </div>
      </div>

      {cr !== null && (
        <div className={`p-4 rounded-xl border-l-4 shadow-sm flex items-center gap-4 transition-all duration-300 ${
          cr <= 0.1 
            ? "bg-green-50 border-green-500 text-green-800" 
            : "bg-red-50 border-red-500 text-red-800 animate-pulse"
        }`}>
          <div className={`p-2 rounded-full ${cr <= 0.1 ? "bg-green-100" : "bg-red-100"}`}>
            <Icon 
              icon={cr <= 0.1 ? "solar:check-circle-bold" : "solar:danger-triangle-bold"} 
              className={`h-6 w-6 ${cr <= 0.1 ? "text-green-600" : "text-red-600"}`} 
            />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-sm uppercase tracking-wider">
              Status Konsistensi Matriks
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-black tabular-nums">CR: {cr.toFixed(2)}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                cr <= 0.1 ? "bg-green-200 text-green-700" : "bg-red-200 text-red-700"
              }`}>
                {cr <= 0.1 ? "Input Konsisten. Siap Disimpan" : "Input Tidak Konsisten! Pilihan Simpan Dikunci"}
              </span>
            </div>
          </div>
          {cr > 0.1 && (
            <div className="text-[10px] font-bold italic opacity-70 max-w-[200px] text-right">
              * Nilai CR harus ≤ 0.1 untuk memastikan logika perbandingan logis.
            </div>
          )}
        </div>
      )}

      {error && <Alert color="failure" onDismiss={() => setError(null)}>{error}</Alert>}
      {success && <Alert color="success" onDismiss={() => setSuccess(null)}>{success}</Alert>}

      <CardBox className="overflow-hidden border-none shadow-xl bg-white dark:bg-gray-800">
        {loading ? <div className="flex justify-center p-10"><Spinner size="xl" /></div> : pairs.length === 0 ? (
            <div className="text-center py-20 text-gray-400 italic">Dibutuhkan minimal 2 kriteria untuk dibandingkan.</div>
        ) : (
            <>
                <div className="overflow-x-auto">
                    <Table hoverable>
                        <Table.Head>
                            <Table.HeadCell className="bg-gray-900 text-white uppercase tracking-widest text-[10px]">Kriteria Utama (A)</Table.HeadCell>
                            <Table.HeadCell className="bg-gray-900 text-white text-center uppercase tracking-widest text-[10px]">Perbandingan Skala Prioritas (Saaty)</Table.HeadCell>
                            <Table.HeadCell className="bg-gray-900 text-white text-right uppercase tracking-widest text-[10px]">Kriteria Pembanding (B)</Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y">
                            {pairs.map(p => (
                                <Table.Row key={p.key} className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <Table.Cell className="font-black text-gray-900 dark:text-gray-100 uppercase text-xs w-1/4">
                                      {p.itemA.NamaGroup || p.itemA.NamaKpi}
                                    </Table.Cell>
                                    <Table.Cell className="w-2/4">
                                        <div className="flex flex-col items-center py-4">
                                            <input 
                                                type="range" min="1" max="9" step="1"
                                                value={comparisonValues[p.key] || 1}
                                                onChange={(e) => setComparisonValues({...comparisonValues, [p.key]: Number(e.target.value)})}
                                                disabled={isLocked}
                                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-30"
                                            />
                                            <div className="mt-4 flex flex-col items-center w-full">
                                                <div className="flex items-center gap-4 w-full justify-between px-2 mb-2">
                                                   <span className="text-[10px] font-bold text-gray-400">SAMA PENTING (1)</span>
                                                   <span className="text-[10px] font-bold text-primary">SANGAT PENTING (9)</span>
                                                </div>
                                                <div className={`px-6 py-2 rounded-full border-2 transition-all flex flex-col items-center shadow-sm ${
                                                  comparisonValues[p.key] > 1 ? "border-primary bg-primary/5" : "border-gray-200 bg-gray-50"
                                                }`}>
                                                    <span className="text-xl font-black text-primary leading-none">
                                                      {comparisonValues[p.key] || 1}
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase tracking-tighter text-gray-500 mt-1">
                                                      {getSaatyLabel(comparisonValues[p.key] || 1)}
                                                    </span>
                                                </div>
                                                <div className="mt-4 flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                                                    <Icon icon="solar:reorder-bold" className="h-3 w-3" />
                                                    Resiprokal Otomatis: {p.itemB.NamaGroup || p.itemB.NamaKpi} = 1/{comparisonValues[p.key] || 1}
                                                </div>
                                            </div>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell className="font-black text-gray-900 dark:text-gray-100 uppercase text-xs text-right w-1/4">
                                      {p.itemB.NamaGroup || p.itemB.NamaKpi}
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </div>

                {isSimulated && Object.keys(weights).length > 0 && (
                  <div className="mt-8 p-6 bg-primary/5 rounded-2xl border border-primary/10 transition-all animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-primary p-2 rounded-lg">
                        <Icon icon="solar:chart-square-bold" className="text-white h-5 w-5" />
                      </div>
                      <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Hasil Perhitungan Bobot Prioritas</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {kpis.map((kpi) => {
                        const weight = weights[kpi.Id || kpi.id] || 0;
                        return (
                          <div key={kpi.Id || kpi.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center transition-all hover:scale-[1.02]">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{kpi.NamaGroup ? "GRUP" : "KPI"}</span>
                              <span className="font-bold text-gray-800 dark:text-white uppercase text-xs truncate max-w-[150px]">
                                {kpi.NamaGroup || kpi.NamaKpi}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-black text-primary tabular-nums">
                                {(weight * 100).toFixed(1)}%
                              </div>
                              <div className="text-[9px] font-bold text-gray-400 uppercase">Weight: {weight.toFixed(4)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mt-8 p-6 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <div className="flex items-center gap-3 text-xs font-bold text-gray-500 uppercase">
                       <Icon icon="solar:info-circle-bold" className="h-5 w-5 text-blue-500" />
                       Lakukan simulasi terlebih dahulu untuk melihat bobot.
                    </div>
                    <div className="flex gap-3">
                        <Button 
                          color="info" 
                          size="lg"
                          onClick={handleSimulate} 
                          disabled={submitting || isLocked}
                          className="px-8 shadow-lg shadow-info/20 outline-none"
                        >
                            {submitting ? <Spinner size="sm" /> : <Icon icon="solar:play-bold" className="mr-2 h-5 w-5" />}
                            Simulasi Hitung
                        </Button>

                        <Button 
                          color={!isSimulated || (cr !== null && cr > 0.1) ? "gray" : "primary"} 
                          size="lg"
                          onClick={handleSave} 
                          disabled={submitting || isLocked || !isSimulated || (cr !== null && cr > 0.1)}
                          className="px-8 shadow-lg shadow-primary/20"
                        >
                            <Icon icon="solar:diskette-bold" className="mr-2 h-5 w-5" />
                            {isLocked ? "Terkunci (Final)" : `Simpan Permanen`}
                        </Button>
                    </div>
                </div>
            </>
        )}
      </CardBox>
    </div>
  );
};

export default NilaiPerbandingan;