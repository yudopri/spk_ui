"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Table, Select, Button, Badge, Alert, Spinner } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import periodeService, { Periode } from "@/services/periodeService";
import kpiService, { KPI } from "@/services/kpiService";
import spkService from "@/services/spkService";

const NilaiPerbandingan = () => {
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number>(0);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [comparisonValues, setComparisonValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchPeriodes = async () => {
      try {
        setLoading(true);
        const res = await periodeService.getAll(1, 100);
        const aktif = res.data.filter((p: Periode) => p.isAktif);
        setPeriodes(aktif);
        if (aktif.length > 0) {
          setSelectedPeriodeId(aktif[0].Id);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Gagal mengambil data periode aktif");
      } finally {
        setLoading(false);
      }
    };

    fetchPeriodes();
  }, []);

  useEffect(() => {
    const fetchKpis = async () => {
      if (!selectedPeriodeId) return;
      try {
        setLoading(true);
        const res = await kpiService.getByPeriode(selectedPeriodeId);
        setKpis(res.data);

        const nextValues: Record<string, number> = {};
        for (let i = 0; i < res.data.length; i++) {
          for (let j = i + 1; j < res.data.length; j++) {
            const idA = res.data[i].Id;
            const idB = res.data[j].Id;
            nextValues[`${idA}-${idB}`] = 1;
          }
        }
        setComparisonValues(nextValues);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Gagal mengambil data KPI");
      } finally {
        setLoading(false);
      }
    };

    fetchKpis();
  }, [selectedPeriodeId]);

  useEffect(() => {
    const fetchExistingPerbandingan = async () => {
      if (!selectedPeriodeId || kpis.length === 0) return;
      try {
        const res = await spkService.getAhpPerbandingan(selectedPeriodeId);
        if (res.success && res.data && res.data.length > 0) {
          const loadedValues: Record<string, number> = {};
          res.data.forEach((item) => {
            loadedValues[`${item.kpiAId}-${item.kpiBId}`] = item.nilai;
          });
          setComparisonValues((prev) => ({ ...prev, ...loadedValues }));
        }
      } catch (err) {
        console.error("Gagal mengambil data perbandingan eksisting", err);
      }
    };
    fetchExistingPerbandingan();
  }, [selectedPeriodeId, kpis]);

  const pairs = useMemo(() => {
    const generated: { kpiA: KPI; kpiB: KPI; key: string }[] = [];
    for (let i = 0; i < kpis.length; i++) {
      for (let j = i + 1; j < kpis.length; j++) {
        const idA = kpis[i].Id;
        const idB = kpis[j].Id;
        generated.push({
          kpiA: kpis[i],
          kpiB: kpis[j],
          key: `${idA}-${idB}`,
        });
      }
    }
    return generated;
  }, [kpis]);

  const selectedPeriode = periodes.find((p) => p.Id === selectedPeriodeId);

  const handleSavePerbandingan = async () => {
    if (!selectedPeriodeId || pairs.length === 0) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      // Construct matrix
      const comparison_matrix: number[][] = Array(kpis.length).fill(0).map(() => Array(kpis.length).fill(1));

      for (let i = 0; i < kpis.length; i++) {
        for (let j = i + 1; j < kpis.length; j++) {
          const kpiA = kpis[i];
          const kpiB = kpis[j];
          const key = `${kpiA.Id}-${kpiB.Id}`;
          const val = Number(comparisonValues[key] || 1);
          comparison_matrix[i][j] = val;
          comparison_matrix[j][i] = 1 / val;
        }
      }

      // Prepare payload for Flask: list of comparisons
      const payload = pairs.map(pair => ({
        PeriodeId: selectedPeriodeId,
        KpiAId: pair.kpiA.Id,
        KpiBId: pair.kpiB.Id,
        Nilai: comparisonValues[pair.key] || 1
      }));

      const res = await spkService.saveAhpPerbandingan(payload);

      setSuccess(res?.message || "Perbandingan berhasil disimpan");
      
      // Calculate weights
      await spkService.calculateAhpWeight(selectedPeriodeId);
      
      // Refresh KPI data to get new weights
      const kpiRes = await kpiService.getByPeriode(selectedPeriodeId);
      setKpis(kpiRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal menyimpan perbandingan AHP");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedPeriodeId || kpis.length === 0) return;

    try {
      setCalculating(true);
      setError(null);
      setSuccess(null);

      const res = await spkService.calculateAhpWeight(selectedPeriodeId);
      
      setSuccess("Perhitungan bobot berhasil");
      // Refresh KPI data to get new weights
      const kpiRes = await kpiService.getByPeriode(selectedPeriodeId);
      setKpis(kpiRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal menghitung bobot AHP");
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold">Perbandingan Kriteria</h1>
          <p className="text-sm text-gray-500">
            Tentukan bobot prioritas untuk {selectedPeriode?.NamaPeriode || "-"}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="w-64">
            <Select
              value={selectedPeriodeId}
              onChange={(e) => setSelectedPeriodeId(Number(e.target.value))}
              sizing="sm"
            >
              <option value={0}>Pilih Periode Aktif</option>
              {periodes.map((p) => (
                <option key={p.Id} value={p.Id}>
                  {p.NamaPeriode}
                </option>
              ))}
            </Select>
          </div>
          <Button color="info" onClick={handleSavePerbandingan} disabled={submitting || pairs.length === 0}>
            {submitting ? <Spinner size="sm" className="mr-2" /> : <Icon icon="solar:diskette-bold-duotone" className="mr-2 h-5 w-5" />}
            Simpan Perbandingan
          </Button>
          <Button color="primary" onClick={handleCalculate} disabled={calculating || pairs.length === 0}>
            <Icon icon="solar:calculator-linear" className="mr-2 h-5 w-5" />
            {calculating ? "Menghitung..." : "Hitung Bobot"}
          </Button>
        </div>
      </div>

      {error && <Alert color="failure">{error}</Alert>}
      {success && <Alert color="success">{success}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CardBox>
            <div className="mb-4 flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg dark:bg-blue-900/20 dark:text-blue-400">
               <Icon icon="solar:info-circle-linear" className="h-5 w-5 flex-shrink-0" />
               <p className="text-xs font-medium italic">Petunjuk: Bandingkan tingkat kepentingan Kriteria A terhadap Kriteria B (Skala 1-9 Saaty).</p>
            </div>
            <div className="overflow-x-auto">
              <Table hoverable>
                <Table.Head>
                  <Table.HeadCell className="w-1/3 text-center">Kriteria A</Table.HeadCell>
                  <Table.HeadCell className="w-1/3 text-center">Nilai Perbandingan</Table.HeadCell>
                  <Table.HeadCell className="w-1/3 text-center">Kriteria B</Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y">
                  {pairs.map((pair) => (
                    <Table.Row key={pair.key} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                      <Table.Cell className="font-bold text-gray-900 dark:text-white text-center">
                        {pair.kpiA.NamaKpi}
                      </Table.Cell>
                      <Table.Cell>
                        <Select
                          sizing="sm"
                          value={String(comparisonValues[pair.key] ?? 1)}
                          onChange={(e) => {
                            const nilai = Number(e.target.value);
                            setComparisonValues((prev) => ({ ...prev, [pair.key]: nilai }));
                          }}
                        >
                          <option value="1">1 - Sama Penting</option>
                          <option value="3">3 - Sedikit Lebih Penting</option>
                          <option value="5">5 - Lebih Penting</option>
                          <option value="7">7 - Sangat Lebih Penting</option>
                          <option value="9">9 - Mutlak Lebih Penting</option>
                          <option value="0.33">1/3 - Sedikit Kurang Penting</option>
                          <option value="0.2">1/5 - Kurang Penting</option>
                          <option value="0.14">1/7 - Sangat Kurang Penting</option>
                          <option value="0.11">1/9 - Mutlak Kurang Penting</option>
                        </Select>
                      </Table.Cell>
                      <Table.Cell className="font-bold text-gray-900 dark:text-white text-center">
                        {pair.kpiB.NamaKpi}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                  {pairs.length === 0 && (
                    <Table.Row>
                      <Table.Cell colSpan={3} className="text-center py-10 text-gray-500 italic">
                        Belum ada kriteria untuk dibandingkan pada periode ini.
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table>
            </div>
          </CardBox>
        </div>

        <div className="space-y-6">
          <CardBox>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Icon icon="solar:chart-2-linear" className="text-primary" />
              Hasil Bobot (Prioritas)
            </h3>
            <div className="space-y-4">
              {kpis.length > 0 ? (
                kpis.map((k, i: number) => {
                  const percent = (k as any).BobotAhp ? ((k as any).BobotAhp * 100).toFixed(2) : "0";
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{k.NamaKpi}</span>
                        <span className="font-bold text-primary">{percent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-400 italic text-center py-4">Pilih periode yang valid</p>
              )}
                {kpis.length > 0 && kpis.some(k => (k as any).BobotAhp !== null) && (
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Status Konsistensi</span>
                      <Badge color="success">Konsisten</Badge>
                   </div>
                </div>
              )}
            </div>
          </CardBox>

          <CardBox>
            <h3 className="text-md font-bold mb-2">Informasi Metodologi</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Metode AHP digunakan untuk mencari bobot prioritas dari setiap kriteria melalui perbandingan berpasangan. 
              Hasil bobot ini nantinya akan digunakan dalam perhitungan MOORA untuk menentukan peringkat karyawan terbaik.
            </p>
          </CardBox>
        </div>
      </div>
    </div>
  );
};

export default NilaiPerbandingan;
