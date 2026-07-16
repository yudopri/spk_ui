"use client";
import React, { useEffect, useState, useMemo } from "react";
import CardBox from "../../shared/CardBox";
import dynamic from "next/dynamic";
import spkService from "@/services/spkService";
import periodeService from "@/services/periodeService";
import { Spinner, Button } from "flowbite-react";
import { Icon } from "@iconify/react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface PeriodeOption {
  id: number;
  NamaPeriode: string;
  Tahun: number;
}

interface TrendDataPoint {
  periodeName: string;
  avgScore: number;
  topScore: number;
  count: number;
}

/** Normalize score to 0-100 scale. If value is ≤ 1 treat as 0-1 fraction. */
function normalizeScore(raw: number): number {
  return raw <= 1 ? raw * 100 : raw;
}

const TrendChart = () => {
  const [loading, setLoading] = useState(true);
  const [periodeList, setPeriodeList] = useState<PeriodeOption[]>([]);
  const [selectedPeriodeIds, setSelectedPeriodeIds] = useState<number[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [topEmployeeName, setTopEmployeeName] = useState<string>("");

  /* ── Fetch periode list once ── */
  useEffect(() => {
    const fetchPeriodeList = async () => {
      try {
        const res = await periodeService.getAll(1, 50);
        const mapped: PeriodeOption[] = (res.data || []).map((p) => ({
          id: p.Id ?? p.id,
          NamaPeriode: p.NamaPeriode ?? p.namaPeriode,
          Tahun: p.Tahun ?? p.tahun,
        })).sort((a, b) => a.Tahun - b.Tahun || a.id - b.id);
        setPeriodeList(mapped);
        // default: select last 5 periods
        setSelectedPeriodeIds(mapped.slice(-5).map((p) => p.id));
      } catch (err) {
        console.error("Failed to fetch periode list", err);
      }
    };
    fetchPeriodeList();
  }, []);

  /* ── Fetch trend data — PARALLEL instead of serial loop ── */
  useEffect(() => {
    const fetchTrendData = async () => {
      if (selectedPeriodeIds.length === 0) {
        setTrendData([]);
        setTopEmployeeName("");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);

        // Fetch ALL selected periods in parallel
        const responses = await Promise.all(
          selectedPeriodeIds.map((pid) => spkService.getReport(pid, 1, 100))
        );

        let currentTopName = "";
        let currentTopScore = -1;

        const results: TrendDataPoint[] = selectedPeriodeIds.map((pid, idx) => {
          const items = responses[idx]?.data || [];
          const scores = items.map((it) => normalizeScore(it.nilai_akhir ?? it.NilaiSkala ?? 0));
          const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
          const max = scores.length ? Math.max(...scores) : 0;
          const topItem = items.find((it) => normalizeScore(it.nilai_akhir ?? it.NilaiSkala ?? 0) === max);
          const namaPeriode =
            items[0]?.Periode?.NamaPeriode ||
            periodeList.find((p) => p.id === pid)?.NamaPeriode ||
            `Periode ${pid}`;

          if (max > currentTopScore) {
            currentTopScore = max;
            currentTopName = topItem?.nama || topItem?.Karyawan?.Nama || "-";
          }

          return {
            periodeName: namaPeriode,
            avgScore: Number(avg.toFixed(2)),
            topScore: Number(max.toFixed(2)),
            count: items.length,
          };
        });

        setTrendData(results);
        setTopEmployeeName(currentTopName);
      } catch (err) {
        console.error("Failed to fetch trend data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendData();
  }, [selectedPeriodeIds, periodeList]);

  /* ── Handlers ── */
  const handleTogglePeriode = (id: number) => {
    setSelectedPeriodeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedPeriodeIds(periodeList.map((p) => p.id));
  };

  const handleClearAll = () => {
    setSelectedPeriodeIds([]);
  };

  /* ── Summary stats ── */
  const summary = useMemo(() => {
    if (!trendData.length) return null;
    const totalParticipants = trendData.reduce((s, d) => s + d.count, 0);
    const overallAvg = totalParticipants
      ? trendData.reduce((s, d) => s + d.avgScore * d.count, 0) / totalParticipants
      : 0;
    const overallTop = Math.max(...trendData.map((d) => d.topScore));
    return { totalParticipants, overallAvg: overallAvg.toFixed(1), overallTop: overallTop.toFixed(1) };
  }, [trendData]);

  /* ── Chart config (memoized) ── */
  const chartOptions: any = useMemo(() => ({
    chart: {
      type: "area",
      height: 360,
      fontFamily: "inherit",
      toolbar: { show: false },
      animations: { enabled: true, easing: "easeinout", speed: 800 },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3 },
    xaxis: {
      categories: trendData.map((d) => d.periodeName.replace(/\s*\(\d+\)\s*$/, "")),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { rotate: -30, style: { fontSize: "11px" } },
    },
    yaxis: {
      title: { text: "Nilai Skala" },
      min: 0,
      max: 100,
    },
    fill: { opacity: 0.15, type: "solid" },
    tooltip: {
      shared: true,
      y: { formatter: (val: number) => val.toFixed(2) + " poin" },
    },
    markers: { size: 4, hover: { size: 6 } },
    grid: { borderColor: "rgba(0,0,0,0.05)", strokeDashArray: 4 },
    colors: ["#5D87FF", "#49BEFF", "#FFAE1F"],
    legend: { show: true, position: "top" },
  }), [trendData]);

  const chartSeries = useMemo(() => [
    { name: "Rata-rata Nilai", data: trendData.map((d) => d.avgScore) },
    { name: "Nilai Tertinggi", data: trendData.map((d) => d.topScore) },
  ], [trendData]);

  return (
    <CardBox className="p-0">
      {/* ── Header ── */}
      <div className="p-6 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Icon icon="solar:chart-line-duotone" className="text-primary h-5 w-5" />
              <h4 className="text-lg font-bold text-dark dark:text-white">Tren Performa Karyawan</h4>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {loading
                ? "Memuat data..."
                : topEmployeeName
                ? `Peringkat teratas: ${topEmployeeName}`
                : "Pilih minimal 1 periode untuk menampilkan tren"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" color="light" onClick={handleSelectAll} className="dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
              Pilih Semua
            </Button>
            <Button size="sm" color="light" onClick={handleClearAll} className="dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
              Hapus
            </Button>
          </div>
        </div>
      </div>

      {/* ── Period filters ── */}
      <div className="px-6 pb-5">
        <div className="flex flex-wrap gap-2">
          {periodeList.map((p) => {
            const active = selectedPeriodeIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => handleTogglePeriode(p.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? "bg-primary text-white border-primary"
                    : "bg-white dark:bg-white/5 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-white/10 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary"
                }`}
              >
                {p.NamaPeriode} {p.Tahun ? `(${p.Tahun})` : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Summary stats bar ── */}
      {!loading && summary && (
        <div className="mx-6 mb-5 flex flex-wrap gap-4 px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Icon icon="solar:users-group-rounded-bold" className="h-4 w-4 text-primary" />
            <span className="text-xs text-slate-500">Total Partisipan</span>
            <span className="text-xs font-bold text-dark dark:text-white">{summary.totalParticipants}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon icon="solar:chart-line-bold" className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-slate-500">Rata-rata Keseluruhan</span>
            <span className="text-xs font-bold text-dark dark:text-white">{summary.overallAvg}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon icon="solar:medal-star-bold" className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-slate-500">Skor Tertinggi</span>
            <span className="text-xs font-bold text-dark dark:text-white">{summary.overallTop}</span>
          </div>
        </div>
      )}

      {/* ── Chart area ── */}
      <div className="px-6 pb-6">
        <div className="h-[360px] flex items-center justify-center rounded-xl bg-lightgray/30 dark:bg-white/[0.02]">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Spinner size="xl" />
              <span className="text-xs text-slate-400">Memuat data tren...</span>
            </div>
          ) : selectedPeriodeIds.length === 0 ? (
            <div className="flex flex-col items-center gap-2">
              <Icon icon="solar:chart-line-outline" className="h-10 w-10 text-slate-200 dark:text-slate-700" />
              <span className="text-sm text-slate-400 dark:text-slate-500">Pilih minimal 1 periode untuk menampilkan tren</span>
            </div>
          ) : trendData.length === 0 ? (
            <div className="flex flex-col items-center gap-2">
              <Icon icon="solar:database-outline" className="h-10 w-10 text-slate-200 dark:text-slate-700" />
              <span className="text-sm text-slate-400 dark:text-slate-500">Belum ada data penilaian tersedia</span>
            </div>
          ) : (
            <div className="w-full">
              <Chart options={chartOptions} series={chartSeries} type="area" height={360} />
            </div>
          )}
        </div>
      </div>
    </CardBox>
  );
};

export default TrendChart;