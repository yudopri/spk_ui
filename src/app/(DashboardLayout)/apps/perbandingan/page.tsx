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
          if (selectedGroupId === 0) {
              const res = await kpiService.getGroups(selectedPeriodeId);
              items = res.data;
          } else {
              const res = await kpiService.getByPeriode(selectedPeriodeId);
              items = res.data.filter((k: KPI) => Number(k.GroupId) === selectedGroupId);
          }
          setKpis(items);

          const nextValues: Record<string, number> = {};
          for (let i = 0; i < items.length; i++) {
              for (let j = i + 1; j < items.length; j++) {
                  nextValues[`${items[i].Id || items[i].id}-${items[j].Id || items[j].id}`] = 1;
              }
          }
          
          const resComp = await spkService.getAhpPerbandingan(selectedPeriodeId, selectedGroupId || undefined);
          if (resComp.success && resComp.data) {
              resComp.data.forEach((item) => {
                  nextValues[`${item.kpiAId}-${item.kpiBId}`] = item.nilai;
              });
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
      const payload = pairs.map(p => ({
        PeriodeId: selectedPeriodeId,
        Nilai: comparisonValues[p.key] || 1,
        ...(selectedGroupId === 0 ? { GroupIdA: p.itemA.Id, GroupIdB: p.itemB.Id } : { KpiAId: p.itemA.Id, KpiBId: p.itemB.Id })
      }));
      await spkService.saveAhpPerbandingan(payload as any);
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

  return (
    <div className="flex flex-col gap-6">
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
                                            <Badge color="dark" className="mt-2">Nilai: {comparisonValues[p.key] || 1}</Badge>
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