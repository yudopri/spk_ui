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
  const [ci, setCi] = useState<number | null>(null);
  const [lambdaMax, setLambdaMax] = useState<number | null>(null);
  const [riValue, setRiValue] = useState<number | null>(null);
  const [weights, setWeights] = useState<Record<number, number>>({});
  const [weightList, setWeightList] = useState<number[]>([]);
  const [isSimulated, setIsSimulated] = useState(false);

  useEffect(() => {
    const fetchPeriodes = async () => {
      try {
        setLoading(true);
        const res = await periodeService.getAll(1, 100);
        // Show all periods but prefer active one as default
        setPeriodes(res.data);
        const firstActive = res.data.find((p: Periode) => (p as any).isAktif && p.Status !== 'locked') || res.data[0];
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
  const isLocked = selectedPeriode?.Status === 'locked';

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
          setCi(null);
          setLambdaMax(null);
          setRiValue(null);
          setWeights({});
          setWeightList([]);
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
                      const idA = item.group_a_id ?? item.groupAId ?? item.groupA_id ?? item.id_a ?? item.IdA ?? item.group_a?.id ?? item.group_a?.Id;
                      const idB = item.group_b_id ?? item.groupBId ?? item.groupB_id ?? item.id_b ?? item.IdB ?? item.group_b?.id ?? item.group_b?.Id;
                      if (idA && idB) {
                        nextValues[`${idA}-${idB}`] = Number(item.nilai ?? item.Nilai ?? 1);
                      }
                  });
              }
          } else {
              const res = await kpiService.getByPeriode(selectedPeriodeId, 1, 1000);
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
          setError("Gagal memuat data perbandingan");
      } finally {
          setLoading(false);
      }
    };
    fetchData();
  }, [selectedPeriodeId, selectedGroupId]);

  // Trigger setelah update comparisonValues
  useEffect(() => {
    // Validasi sederhana: pastikan tidak ada nilai 1 (sama penting) di diagonal
    // Ini sudah otomatis terpenuhi karena diagonal selalu 1 di fillData
  }, [comparisonValues, kpis.length]);

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

  // Helper untuk mendapatkan label text dari value
  const getSaatyLabel = (val: number) => {
    if (val === 1) return "Sama Penting";
    if (val === 3) return "Sedikit Lebih Penting";
    if (val === 5) return "Lebih Penting";
    if (val === 7) return "Sangat Kuat Penting";
    if (val === 9) return "Mutlak Lebih Penting";
    if (val === 1/3) return "Sedikit Lebih Penting (B)";
    if (val === 1/5) return "Lebih Penting (B)";
    if (val === 1/7) return "Sangat Kuat Penting (B)";
    if (val === 1/9) return "Mutlak Lebih Penting (B)";
    if (val === 2) return "Di antara 1 & 3";
    if (val === 4) return "Di antara 3 & 5";
    if (val === 6) return "Di antara 5 & 7";
    if (val === 8) return "Di antara 7 & 9";
    return val;
  };

  // Helper untuk mendapatkan status resiprokal (apakah input inverse existe)
  const getInverseStatus = (val: number) => {
    if (val === 1) return { text: "↓ A=B", class: "bg-green-100 text-green-700" };
    if (val === 3) return { text: "↑ B>A", class: "bg-green-100 text-green-700" };
    if (val === 5) return { text: "↑ B>A", class: "bg-green-100 text-green-700" };
    if (val === 7) return { text: "↑ B>A", class: "bg-green-100 text-green-700" };
    if (val === 9) return { text: "↑ B>A", class: "bg-green-100 text-green-700" };
    if (val === 1/3) return { text: "↑ A>B", class: "bg-green-100 text-green-700" };
    if (val === 1/5) return { text: "↑ A>B", class: "bg-green-100 text-green-700" };
    if (val === 1/7) return { text: "↑ A>B", class: "bg-green-100 text-green-700" };
    if (val === 1/9) return { text: "↑ A>B", class: "bg-green-100 text-green-700" };
    return { text: "?", class: "bg-yellow-100 text-yellow-700" };
  };

  // Helper untuk mendapatkan label direction (A > B atau B > A)
  const getDirectionLabel = (val: number) => {
    if (val > 1) return ">>> A ≥ B (A lebih penting)";
    if (val < 1) return "<<< B ≥ A (B lebih penting)";
    return "== A = B (Sama penting)";
  };

  const handleSimulate = () => {
    setIsSimulated(true);

    // Hitung CR dan bobot secara lokal dari matrix perbandingan
    if (kpis.length === 0) return;

    const n = kpis.length;
    // Bangun matriks perbandingan
    const matrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          const idA = kpis[i].Id || kpis[i].id;
          const idB = kpis[j].Id || kpis[j].id;
          const keyAB = `${idA}-${idB}`;
          const keyBA = `${idB}-${idA}`;
          matrix[i][j] = comparisonValues[keyAB] ?? (comparisonValues[keyBA] !== undefined && comparisonValues[keyBA] !== 0 ? 1 / comparisonValues[keyBA] : 1);
        }
      }
    }

    // Hitung jumlah kolom
    const colSums: number[] = [];
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let i = 0; i < n; i++) sum += matrix[i][j];
      colSums.push(sum);
    }

    // Normalisasi matriks dan hitung bobot (rata-rata baris)
    const normMatrix: number[][] = [];
    const rowWeights: number[] = [];
    for (let i = 0; i < n; i++) {
      normMatrix[i] = [];
      let rowSum = 0;
      for (let j = 0; j < n; j++) {
        normMatrix[i][j] = colSums[j] > 0 ? matrix[i][j] / colSums[j] : 0;
        rowSum += normMatrix[i][j];
      }
      rowWeights.push(rowSum / n);
    }

    // Hitung lambda max
    let lambdaMax = 0;
    for (let i = 0; i < n; i++) {
      let weightedSum = 0;
      for (let j = 0; j < n; j++) weightedSum += matrix[i][j] * rowWeights[j];
      lambdaMax += weightedSum / rowWeights[i];
    }
    lambdaMax /= n;

    // Hitung CI dan CR
    const ci = n > 1 ? (lambdaMax - n) / (n - 1) : 0;
    // Random Index untuk n = 1..15
    const riTable: Record<number, number> = { 1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49 };
    const ri = riTable[n] ?? (1.49 + (n - 10) * 0.03);
    const crValue = ri > 0 ? ci / ri : 0;

    setLambdaMax(Number(lambdaMax.toFixed(4)));
    setCi(Number(ci.toFixed(4)));
    setRiValue(Number(ri.toFixed(4)));
    setCr(Number(crValue.toFixed(4)));

    // Update bobot
    const newWeights: Record<number, number> = {};
    const newWeightList: number[] = [];
    kpis.forEach((k, i) => {
      const id = k.Id || k.id;
      newWeights[id] = rowWeights[i];
      newWeightList.push(rowWeights[i]);
    });
    setWeights(newWeights);
    setWeightList(newWeightList);
  };

  const handleSave = async () => {
    if (!isSimulated) {
      setError("Silakan lakukan simulasi terlebih dahulu");
      return;
    }

    if (cr !== null && cr > 0.1) {
      setError("CR tidak konsisten, tidak bisa disimpan");
      return;
    }

    if (submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      let res;

      // MODE GROUP
      if (selectedGroupId === 0) {
        const payload = pairs.map(p => ({
          group_a_id: p.itemA.Id || p.itemA.id,
          group_b_id: p.itemB.Id || p.itemB.id,
          nilai: comparisonValues[p.key] || 1
        }));
        res = await spkService.saveAhpGroupPerbandingan(selectedPeriodeId, payload);
      } else {
        const payload = pairs.map((p) => ({
          PeriodeId: selectedPeriodeId,
          KpiAId: p.itemA.Id || p.itemA.id,
          KpiBId: p.itemB.Id || p.itemB.id,
          Nilai: comparisonValues[p.key] || 1,
        }));
        res = await spkService.saveAhpPerbandingan(payload as any);
      }

      if (res.success) {
        // Hitung bobot AHP setelah perbandingan tersimpan
        try {
          const calcRes = await spkService.calculateAhpWeight(
            selectedPeriodeId,
            selectedGroupId === 0 ? undefined : selectedGroupId
          );

          if (calcRes.success && calcRes.data) {
            // Update CR
            const crValue = calcRes.data.cr ?? calcRes.consistency?.cr ?? null;
            if (crValue !== null && crValue !== undefined) {
              setCr(Number(crValue));
            }

            // Update bobot
            const weightData = calcRes.data.weights ?? calcRes.data.ahp_weights ?? calcRes.data;
            if (Array.isArray(weightData)) {
              const newWeights: Record<number, number> = {};
              const newWeightList: number[] = [];
              weightData.forEach((w: any) => {
                const id = Number(w.id ?? w.Id ?? w.kriteria_id ?? 0);
                const bobot = Number(w.bobot ?? w.weight ?? w.nilai ?? 0);
                if (id > 0) {
                  newWeights[id] = bobot;
                  newWeightList.push(bobot);
                }
              });
              setWeights(newWeights);
              setWeightList(newWeightList);
            } else if (typeof weightData === "object" && weightData !== null) {
              // Handle object format { id: weight, ... }
              const newWeights: Record<number, number> = {};
              const newWeightList: number[] = [];
              Object.entries(weightData).forEach(([key, val]) => {
                const id = Number(key);
                const bobot = Number(val);
                if (id > 0 && !isNaN(bobot)) {
                  newWeights[id] = bobot;
                  newWeightList.push(bobot);
                }
              });
              setWeights(newWeights);
              setWeightList(newWeightList);
            }

            setSuccess(calcRes.message || "Bobot AHP berhasil disimpan dan diproses");
          } else {
            setSuccess(res.message || "Bobot AHP berhasil disimpan");
          }
        } catch (calcErr) {
          // Save berhasil tapi kalkulasi gagal — tetap tampilkan sukses save
          console.error("Gagal menghitung bobot AHP:", calcErr);
          setSuccess(res.message || "Bobot AHP berhasil disimpan (perhitungan gagal)");
        }
      } else {
        setError(res.message || "Gagal menyimpan bobot");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Terjadi kesalahan saat menyimpan");
    } finally {
      setSubmitting(false);
    }
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
            { step: 4, label: "Input Realisasi", icon: "solar:pen-new-square-bold" },
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
           <h1 className="text-2xl font-bold">Perbandingan Prioritas Kriteria</h1>
           <p className="text-sm text-gray-500">Bandingkan prioritas antar kriteria penilaian untuk menentukan bobot masing-masing</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select sizing="sm" value={selectedPeriodeId} onChange={(e) => setSelectedPeriodeId(Number(e.target.value))}>
            {periodes.map(p => <option key={p.Id} value={p.Id}>{p.NamaPeriode}</option>)}
          </Select>
          <Select sizing="sm" value={selectedGroupId} onChange={(e) => setSelectedGroupId(Number(e.target.value))}>
            <option value={0}>Level Grup KPI</option>
            {groups.map(g => <option key={g.Id} value={g.Id}>Detail KPI: {g.NamaGroup}</option>)}
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
              Indeks Konsistensi Saaty
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              <div className="rounded-lg bg-white/70 dark:bg-gray-900/40 px-3 py-2 border border-white/50">
                <p className="text-[10px] uppercase font-bold text-gray-500">Lambda max</p>
                <p className="text-lg font-black tabular-nums">{lambdaMax !== null ? lambdaMax.toFixed(4) : "-"}</p>
              </div>
              <div className="rounded-lg bg-white/70 dark:bg-gray-900/40 px-3 py-2 border border-white/50">
                <p className="text-[10px] uppercase font-bold text-gray-500">CI</p>
                <p className="text-lg font-black tabular-nums">{ci !== null ? ci.toFixed(4) : "-"}</p>
              </div>
              <div className="rounded-lg bg-white/70 dark:bg-gray-900/40 px-3 py-2 border border-white/50">
                <p className="text-[10px] uppercase font-bold text-gray-500">RI</p>
                <p className="text-lg font-black tabular-nums">{riValue !== null ? riValue.toFixed(4) : "-"}</p>
              </div>
              <div className="rounded-lg bg-white/70 dark:bg-gray-900/40 px-3 py-2 border border-white/50">
                <p className="text-[10px] uppercase font-bold text-gray-500">CR</p>
                <p className="text-lg font-black tabular-nums">{cr.toFixed(4)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                cr <= 0.1 ? "bg-green-200 text-green-700" : "bg-red-200 text-red-700"
              }`}>
                {cr <= 0.1 ? "Konsisten" : "Tidak Konsisten"}
              </span>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Syarat umum: CR &le; 0.10
              </span>
            </div>
          </div>
          {cr > 0.1 && (
            <div className="text-[10px] font-bold italic opacity-70 max-w-[200px] text-right">
              <span className="italic">Nilai CR harus {"<= 0.1"} agar perbandingan dinilai konsisten dan bobot AHP layak dipakai.</span>
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
                {/* Panduan Skala AHP */}
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                        <Icon icon="solar:book-bold" className="h-4 w-4" />
                        Panduan Skala AHP (Saaty)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-blue-800 dark:text-blue-200">
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded font-bold">1</span>
                            <span>= Sama penting</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded font-bold">3</span>
                            <span>= A sedikit lebih penting dari B</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded font-bold">5</span>
                            <span>= A lebih penting dari B</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded font-bold">7</span>
                            <span>= A sangat kuat lebih penting dari B</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded font-bold">9</span>
                            <span>= A mutlak lebih penting dari B</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-800 rounded font-bold">1/3 s/d 1/9</span>
                            <span>= B lebih penting dari A (kebalikan)</span>
                        </div>
                        <div className="mt-2 md:col-span-2 text-[10px] text-blue-700 dark:text-blue-200 bg-blue-100/60 dark:bg-blue-900/20 rounded-lg px-3 py-2">
                          Indeks konsistensi dihitung dari matriks perbandingan dengan rumus: CI = (lambda max - n) / (n - 1), lalu CR = CI / RI.
                        </div>
                    </div>
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-[10px] text-blue-900 dark:text-blue-100">
                        <thead>
                          <tr className="border-b border-blue-200 dark:border-blue-700">
                            <th className="py-2 text-left">Nilai</th>
                            <th className="py-2 text-left">Makna</th>
                            <th className="py-2 text-left">Resiprokal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-100 dark:divide-blue-800/60">
                          <tr>
                            <td className="py-2">
                              <span className="inline-flex rounded-full bg-slate-900 text-white px-2 py-0.5 font-bold">1</span>
                            </td>
                            <td className="py-2">Sama penting</td>
                            <td className="py-2">
                              <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono font-bold">1</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2">
                              <span className="inline-flex rounded-full bg-blue-600 text-white px-2 py-0.5 font-bold">3</span>
                            </td>
                            <td className="py-2">Sedikit lebih penting</td>
                            <td className="py-2">
                              <span className="inline-flex rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 font-mono font-bold">1/3</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2">
                              <span className="inline-flex rounded-full bg-sky-500 text-white px-2 py-0.5 font-bold">2</span>
                            </td>
                            <td className="py-2">Di antara sama penting dan sedikit lebih penting</td>
                            <td className="py-2">
                              <span className="inline-flex rounded-full bg-sky-100 dark:bg-sky-900/40 px-2 py-0.5 font-mono font-bold">1/2</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2">
                              <span className="inline-flex rounded-full bg-amber-500 text-white px-2 py-0.5 font-bold">5</span>
                            </td>
                            <td className="py-2">Lebih penting</td>
                            <td className="py-2">
                              <span className="inline-flex rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 font-mono font-bold">1/5</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2">
                              <span className="inline-flex rounded-full bg-amber-400 text-white px-2 py-0.5 font-bold">4</span>
                            </td>
                            <td className="py-2">Di antara sedikit lebih penting dan lebih penting</td>
                            <td className="py-2">
                              <span className="inline-flex rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 font-mono font-bold">1/4</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2">
                              <span className="inline-flex rounded-full bg-orange-500 text-white px-2 py-0.5 font-bold">7</span>
                            </td>
                            <td className="py-2">Sangat kuat lebih penting</td>
                            <td className="py-2">
                              <span className="inline-flex rounded-full bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 font-mono font-bold">1/7</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2">
                              <span className="inline-flex rounded-full bg-orange-400 text-white px-2 py-0.5 font-bold">6</span>
                            </td>
                            <td className="py-2">Di antara lebih penting dan sangat kuat lebih penting</td>
                            <td className="py-2">
                              <span className="inline-flex rounded-full bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 font-mono font-bold">1/6</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2">
                              <span className="inline-flex rounded-full bg-rose-600 text-white px-2 py-0.5 font-bold">9</span>
                            </td>
                            <td className="py-2">Mutlak lebih penting</td>
                            <td className="py-2">
                              <span className="inline-flex rounded-full bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 font-mono font-bold">1/9</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2">
                              <span className="inline-flex rounded-full bg-rose-500 text-white px-2 py-0.5 font-bold">8</span>
                            </td>
                            <td className="py-2">Di antara sangat kuat lebih penting dan mutlak lebih penting</td>
                            <td className="py-2">
                              <span className="inline-flex rounded-full bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 font-mono font-bold">1/8</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table hoverable>
                        <Table.Head>
                            <Table.HeadCell className="bg-gray-900 text-white uppercase tracking-widest text-[10px]">Kriteria Utama (A)</Table.HeadCell>
                            <Table.HeadCell className="bg-gray-900 text-white text-center uppercase tracking-widest text-[10px]">
                                Pilihan Perbandingan
                            </Table.HeadCell>
                            <Table.HeadCell className="bg-gray-900 text-white text-right uppercase tracking-widest text-[10px]">Kriteria Pembanding (B)</Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y">
                            {pairs.map(p => {
                                const currentVal = comparisonValues[p.key] || 1;
                                const inverseStatus = getInverseStatus(currentVal);

                                // Preset options: standard + inverse
                                const presets = [
                                    { value: 9,   label: "9",   desc: "Mutlak", emoji: "⭐⭐⭐⭐⭐", side: "A" },
                                    { value: 8,   label: "8",   desc: "Di antara 7 & 9", emoji: "⭐⭐⭐⭐⭐", side: "A" },
                                    { value: 7,   label: "7",   desc: "Sangat Kuat", emoji: "⭐⭐⭐⭐", side: "A" },
                                    { value: 6,   label: "6",   desc: "Di antara 5 & 7", emoji: "⭐⭐⭐⭐", side: "A" },
                                    { value: 5,   label: "5",   desc: "Lebih", emoji: "⭐⭐⭐", side: "A" },
                                    { value: 4,   label: "4",   desc: "Di antara 3 & 5", emoji: "⭐⭐⭐", side: "A" },
                                    { value: 3,   label: "3",   desc: "Sedikit", emoji: "⭐⭐", side: "A" },
                                    { value: 2,   label: "2",   desc: "Di antara 1 & 3", emoji: "⭐⭐", side: "A" },
                                    { value: 1,   label: "1",   desc: "Sama", emoji: "=", side: "" },
                                    { value: 1/2, label: "1/2", desc: "Di antara 1 & 3", emoji: "⭐⭐", side: "B" },
                                    { value: 1/3, label: "1/3", desc: "Sedikit", emoji: "⭐⭐", side: "B" },
                                    { value: 1/4, label: "1/4", desc: "Di antara 3 & 5", emoji: "⭐⭐⭐", side: "B" },
                                    { value: 1/5, label: "1/5", desc: "Lebih", emoji: "⭐⭐⭐", side: "B" },
                                    { value: 1/6, label: "1/6", desc: "Di antara 5 & 7", emoji: "⭐⭐⭐⭐", side: "B" },
                                    { value: 1/7, label: "1/7", desc: "Sangat Kuat", emoji: "⭐⭐⭐⭐", side: "B" },
                                    { value: 1/8, label: "1/8", desc: "Di antara 7 & 9", emoji: "⭐⭐⭐⭐⭐", side: "B" },
                                    { value: 1/9, label: "1/9", desc: "Mutlak", emoji: "⭐⭐⭐⭐⭐", side: "B" },
                                ];

                                return (
                                <Table.Row key={p.key} className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    {/* Kriteria A */}
                                    <Table.Cell className="font-black text-gray-900 dark:text-gray-100 uppercase text-xs w-[15%]">
                                      <div className="flex flex-col gap-1">
                                        <span>{p.itemA.NamaGroup || p.itemA.NamaKpi}</span>
                                        <span className="text-[9px] text-gray-400 normal-case font-normal">(Kriteria Utama)</span>
                                      </div>
                                    </Table.Cell>

                                    {/* Input Perbandingan - Preset Buttons */}
                                    <Table.Cell className="w-[70%] p-0">
                                        <div className="py-3 px-4">
                                            {/* Status Direction */}
                                            <div className={`text-center text-[10px] font-bold uppercase tracking-wider mb-3 px-2 py-1 rounded ${
                                                currentVal > 1 ? "bg-blue-100 text-blue-700" :
                                                currentVal < 1 ? "bg-orange-100 text-orange-700" :
                                                "bg-gray-100 text-gray-600"
                                            }`}>
                                                {currentVal > 1 && "▲ A lebih penting dari B"}
                                                {currentVal < 1 && "▼ B lebih penting dari A"}
                                                {currentVal === 1 && "═ Sama penting"}
                                            </div>

                                            {/* Preset Buttons - A lebih penting */}
                                            <div className="mb-1 text-[8px] font-bold text-blue-500 uppercase text-center tracking-widest">
                                                Pilih jika A lebih penting dari B ▲
                                            </div>
                                            <div className="flex flex-wrap gap-1 justify-center mb-3">
                                                {[9, 8, 7, 6, 5, 4, 3, 2].map(val => (
                                                    <Button
                                                        key={val}
                                                        size="xs"
                                                        color={currentVal === val ? "blue" : "light"}
                                                        className={`text-[11px] px-2 min-w-[44px] ${
                                                            currentVal === val 
                                                                ? "font-black ring-2 ring-blue-300 shadow-md" 
                                                                : "font-semibold hover:scale-105"
                                                        } transition-all`}
                                                        disabled={isLocked}
                                                        onClick={() => setComparisonValues({...comparisonValues, [p.key]: val})}
                                                    >
                                                        <div className="flex flex-col items-center leading-tight">
                                                            <span>{val}</span>
                                                            <span className="text-[7px] opacity-70">A &gt; B</span>
                                                        </div>
                                                    </Button>
                                                ))}
                                            </div>

                                            {/* Sama penting */}
                                            <div className="flex gap-1 justify-center mb-3">
                                                <Button
                                                    size="xs"
                                                    color={currentVal === 1 ? "gray" : "light"}
                                                    className={`text-[11px] px-4 min-w-[60px] ${
                                                        currentVal === 1 
                                                            ? "font-black ring-2 ring-gray-300 shadow-md" 
                                                            : "font-semibold hover:scale-105"
                                                    } transition-all`}
                                                    disabled={isLocked}
                                                    onClick={() => setComparisonValues({...comparisonValues, [p.key]: 1})}
                                                >
                                                    <div className="flex flex-col items-center leading-tight">
                                                        <span>1</span>
                                                        <span className="text-[7px] opacity-70">Sama</span>
                                                    </div>
                                                </Button>
                                            </div>

                                            {/* Preset Buttons - B lebih penting */}
                                            <div className="mb-1 text-[8px] font-bold text-orange-500 uppercase text-center tracking-widest">
                                                Pilih jika B lebih penting dari A ▼
                                            </div>
                                            <div className="flex flex-wrap gap-1 justify-center mb-3">
                                                    {[2, 3, 4, 5, 6, 7, 8, 9].map(val => {
                                                    const invVal = 1/val;
                                                    return (
                                                        <Button
                                                            key={`inv-${val}`}
                                                            size="xs"
                                                            color={currentVal === invVal ? "warning" : "light"}
                                                            className={`text-[11px] px-2 min-w-[44px] ${
                                                                currentVal === invVal 
                                                                    ? "font-black ring-2 ring-orange-300 shadow-md" 
                                                                    : "font-semibold hover:scale-105"
                                                            } transition-all`}
                                                            disabled={isLocked}
                                                            onClick={() => setComparisonValues({...comparisonValues, [p.key]: invVal})}
                                                        >
                                                            <div className="flex flex-col items-center leading-tight">
                                                                <span>1/{val}</span>
                                                                <span className="text-[7px] opacity-70">B &gt; A</span>
                                                            </div>
                                                        </Button>
                                                    );
                                                })}
                                            </div>

                                            {/* Separator */}
                                            <div className="h-px bg-gray-200 dark:bg-gray-600 my-2" />

                                            {/* Info Row: Current Value + Reset */}
                                            <div className="flex items-center justify-between gap-2">
                                                {/* Current value display */}
                                                <div className="flex items-center gap-2">
                                                    <div className={`px-3 py-1 rounded-lg border-2 flex flex-col items-center shadow-sm ${
                                                        currentVal === 1 
                                                            ? "border-gray-300 bg-gray-50" 
                                                            : currentVal > 1 
                                                                ? "border-blue-400 bg-blue-50" 
                                                                : "border-orange-400 bg-orange-50"
                                                    }`}>
                                                        <span className={`text-lg font-black leading-none ${
                                                            currentVal > 1 ? "text-blue-600" : 
                                                            currentVal < 1 ? "text-orange-600" : "text-gray-600"
                                                        }`}>
                                                            {currentVal === 1 ? "1" : currentVal}
                                                        </span>
                                                        <span className="text-[8px] font-bold uppercase tracking-tighter text-gray-500 mt-0.5">
                                                            {getSaatyLabel(currentVal)}
                                                        </span>
                                                    </div>
                                                    {/* Inverse status */}
                                                    <div className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-tighter ${inverseStatus.class}`}>
                                                        {inverseStatus.text}
                                                    </div>
                                                </div>

                                                {/* Reset button */}
                                                <Button
                                                    size="xs"
                                                    color="warning"
                                                    onClick={() => setComparisonValues({...comparisonValues, [p.key]: 1})}
                                                    disabled={isLocked || currentVal === 1}
                                                    className="text-[10px] px-2 py-1 shadow-none"
                                                >
                                                    <Icon icon="solar:restart-bold" className="h-3 w-3 mr-1" />
                                                    Reset
                                                </Button>
                                            </div>

                                            {/* Reciprocal info */}
                                            <div className="mt-2 flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                                                <Icon icon="solar:reorder-linear" className="h-3 w-3" />
                                                <span>
                                                    Resiprokal: B = 1/{currentVal}
                                                    {currentVal === 1 ? " = 1" : ` ≈ ${typeof currentVal === 'number' ? (1/currentVal).toFixed(4) : ''}`}
                                                </span>
                                            </div>
                                        </div>
                                    </Table.Cell>

                                    {/* Kriteria B */}
                                    <Table.Cell className="font-black text-gray-900 dark:text-gray-100 uppercase text-xs text-right w-[15%]">
                                      <div className="flex flex-col gap-1 items-end">
                                        <span>{p.itemB.NamaGroup || p.itemB.NamaKpi}</span>
                                        <span className="text-[9px] text-gray-400 normal-case font-normal">(Kriteria Pembanding)</span>
                                      </div>
                                    </Table.Cell>
                                </Table.Row>
                                );
                            })}
                        </Table.Body>
                    </Table>
                </div>

                {/* PREVIEW MATRIX - Sebelum Simpan */}
                {isSimulated && (
                  <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-500 p-2 rounded-lg">
                        <Icon icon="solar:matrix-bold" className="text-white h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Preview Matriks Perbandingan</h3>
                        <p className="text-[10px] text-gray-500">Ringkasan semua perbandingan yang telah Anda pilih</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <Table hoverable>
                        <Table.Head>
                          <Table.HeadCell className="bg-gray-800 text-white text-[9px] uppercase w-1/6">A \\ B</Table.HeadCell>
                          {kpis.map(k => (
                            <Table.HeadCell key={k.Id || k.id} className="bg-gray-800 text-white text-[9px] uppercase text-center">
                              {k.NamaGroup || k.NamaKpi}
                            </Table.HeadCell>
                          ))}
                        </Table.Head>
                        <Table.Body>
                          {kpis.map((itemA, idxA) => {
                            const idA = itemA.Id || itemA.id;
                            return (
                              <Table.Row key={idA}>
                                <Table.Cell className="font-bold text-[10px] bg-gray-100 dark:bg-gray-700">
                                  {itemA.NamaGroup || itemA.NamaKpi}
                                </Table.Cell>
                                {kpis.map((itemB, idxB) => {
                                  const idB = itemB.Id || itemB.id;
                                  if (idxA === idxB) {
                                    return (
                                      <Table.Cell key={idB} className="text-center bg-gray-100 dark:bg-gray-700 text-gray-400 font-bold text-xs">
                                        1
                                      </Table.Cell>
                                    );
                                  }
                                  // Get value for A vs B
                                  const keyAB = `${idA}-${idB}`;
                                  const keyBA = `${idB}-${idA}`;
                                  let val = comparisonValues[keyAB] ?? 1;
                                  if (val === 1 && comparisonValues[keyBA] !== undefined && comparisonValues[keyBA] !== 1) {
                                    val = 1 / comparisonValues[keyBA];
                                  }

                                  const cellColor = val > 1 
                                    ? "text-blue-700 font-bold" 
                                    : val < 1 
                                      ? "text-orange-700 font-bold" 
                                      : "text-gray-500";

                                  return (
                                    <Table.Cell key={idB} className={`text-center text-[11px] font-mono ${cellColor}`}>
                                      {val === 1 ? "1" : val.toFixed(2)}
                                    </Table.Cell>
                                  );
                                })}
                              </Table.Row>
                            );
                          })}
                        </Table.Body>
                      </Table>
                    </div>
                    <p className="text-[9px] text-gray-400 mt-2 italic">
                      ⚠️ Matriks ini hanya preview sementara. Klik "Simpan Bobot" untuk menyimpan ke database.
                    </p>
                  </div>
                )}
            </>
        )}
      </CardBox>

      {/* Action Buttons */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-gray-500 uppercase">
               <Icon icon="solar:info-circle-bold" className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 shrink-0" />
               <span className="leading-tight">Lakukan simulasi terlebih dahulu untuk melihat bobot masing-masing kriteria.</span>
            </div>
            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Button 
                  color="info" 
                  size="sm"
                  onClick={handleSimulate} 
                  disabled={submitting || isLocked}
                  className="w-full xs:w-auto shadow-md outline-none touch-target"
                >
                    {submitting ? <Spinner size="sm" /> : <Icon icon="solar:play-bold" className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />}
                    <span className="whitespace-nowrap">Simulasi Hitung</span>
                </Button>

                <Button 
                  color={!isSimulated || (cr !== null && cr > 0.1) ? "gray" : "primary"} 
                  size="sm"
                  onClick={handleSave} 
                  disabled={submitting || isLocked || !isSimulated || (cr !== null && cr > 0.1)}
                  className="w-full xs:w-auto shadow-md shadow-primary/20"
                >
                    <Icon icon="solar:diskette-bold" className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="whitespace-nowrap">{isLocked ? "Terkunci" : `Simpan Bobot`}</span>
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default NilaiPerbandingan;
