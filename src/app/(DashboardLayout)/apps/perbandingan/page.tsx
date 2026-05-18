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

  useEffect(() => {
    const fetchPeriodes = async () => {
      try {
        setLoading(true);
        const res = await periodeService.getAll(1, 100);
        const aktif = res.data.filter((p: Periode) => {
          if (!p.isAktif) return false;
          if (isAdminLike && user?.dept_id) {
            const currentDivisiId = p.DivisiId ?? p.divisiId ?? p.divisi?.id;
            return currentDivisiId === null || currentDivisiId === undefined || currentDivisiId === 0 || Number(currentDivisiId) === Number(user.dept_id);
          }
          return true;
        });
        setPeriodes(aktif);
        if (aktif.length > 0) setSelectedPeriodeId(aktif[0].Id || (aktif[0] as any).id);
      } catch (err: any) {
        setError("Gagal mengambil data periode");
      } finally {
        setLoading(false);
      }
    };
    fetchPeriodes();
  }, []);

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

  const handleSave = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      
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
          if (resCalc.data.cr >= 0.1) setError(`Inkonsistensi terdeteksi (CR = ${resCalc.data.cr.toFixed(4)})`);
          else setSuccess("Bobot berhasil dihitung dan konsisten");
      }
    } catch (err) {
      setError("Gagal menyimpan matriks");
    } finally {
      setSubmitting(false);
    }
  };

  const getSaatyLabel = (val: number) => {
    if (val === 1) return "Sama Penting";
    if (val === 3) return "Sedikit Lebih Penting";
    if (val === 5) return "Lebih Penting";
    if (val === 7) return "Sangat Kuat Lebih Penting";
    if (val === 9) return "Mutlak Lebih Penting";
    if (val > 1 && val < 3) return "Di antara Sama & Sedikit";
    if (val > 3 && val < 5) return "Di antara Sedikit & Lebih";
    if (val > 5 && val < 7) return "Di antara Lebih & Sangat Kuat";
    if (val > 7 && val < 9) return "Di antara Sangat Kuat & Mutlak";
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
        <Alert color={cr < 0.1 ? "success" : "failure"} icon={() => <Icon icon="solar:chart-square-bold" className="h-5 w-5" />}>
           Consistency Ratio (CR): <b>{cr.toFixed(4)}</b> 
           {cr >= 0.1 ? " - Matriks TIDAK KONSISTEN! Mohon diperbaiki." : " - Matriks Konsisten."}
        </Alert>
      )}

      {error && <Alert color="failure" onDismiss={() => setError(null)}>{error}</Alert>}
      {success && <Alert color="success" onDismiss={() => setSuccess(null)}>{success}</Alert>}

      <CardBox>
        {loading ? <div className="flex justify-center p-10"><Spinner size="xl" /></div> : pairs.length === 0 ? (
            <div className="text-center py-20 text-gray-400 italic">Dibutuhkan minimal 2 kriteria untuk dibandingkan.</div>
        ) : (
            <>
                <div className="overflow-x-auto">
                    <Table hoverable striped>
                        <Table.Head>
                            <Table.HeadCell>Kriteria A</Table.HeadCell>
                            <Table.HeadCell className="text-center">Skala Saaty (1-9)</Table.HeadCell>
                            <Table.HeadCell>Kriteria B</Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y">
                            {pairs.map(p => (
                                <Table.Row key={p.key}>
                                    <Table.Cell className="font-bold">{p.itemA.NamaGroup || p.itemA.NamaKpi}</Table.Cell>
                                    <Table.Cell>
                                        <div className="flex flex-col items-center">
                                            <input 
                                                type="range" min="1" max="9" step="1"
                                                value={comparisonValues[p.key] || 1}
                                                onChange={(e) => setComparisonValues({...comparisonValues, [p.key]: Number(e.target.value)})}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                            <div className="mt-2 flex flex-col items-center">
                                                <Badge color="info" size="sm" className="px-3 py-1">
                                                    {comparisonValues[p.key] || 1} : {getSaatyLabel(comparisonValues[p.key] || 1)}
                                                </Badge>
                                                <span className="text-[10px] text-gray-400 mt-1 italic">
                                                    (Otomatis: {p.itemB.NamaGroup || p.itemB.NamaKpi} vs {p.itemA.NamaGroup || p.itemA.NamaKpi} = 1/{comparisonValues[p.key] || 1})
                                                </span>
                                            </div>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell className="font-bold">{p.itemB.NamaGroup || p.itemB.NamaKpi}</Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </div>
                <div className="flex justify-end mt-6">
                    <Button color="primary" onClick={handleSave} disabled={submitting}>
                        {submitting ? <Spinner size="sm" /> : <Icon icon="solar:diskette-bold" className="mr-2 h-5 w-5" />}
                        Simpan & Hitung Bobot {selectedGroupId === 0 ? "Grup" : "Detail"}
                    </Button>
                </div>
            </>
        )}
      </CardBox>
    </div>
  );
};

export default NilaiPerbandingan;