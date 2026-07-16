"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import TrendChart from "@/app/components/dashboards/Dashboard1/TrendChart";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { Spinner } from "flowbite-react";
import karyawanService from "@/services/karyawanService";
import periodeService from "@/services/periodeService";
import kpiService from "@/services/kpiService";
import spkService from "@/services/spkService";
import divisiService from "@/services/divisiService";
import type { Periode } from "@/services/periodeService";
import type { SpkReport } from "@/services/spkService";
import type { Divisi } from "@/services/divisiService";

/* ── Helpers ── */
const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  draft:     { label: "Draft",     color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-700", icon: "solar:pen-new-square-bold" },
  open:      { label: "Open",      color: "text-blue-600",  bg: "bg-blue-100 dark:bg-blue-900/30",  icon: "solar:lock-open-bold" },
  processed: { label: "Processed", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30", icon: "solar:cpu-bolt-bold" },
  locked:    { label: "Locked",    color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30", icon: "solar:lock-bold" },
};

const scoreRanges = [
  { label: "Sangat Baik", min: 80, max: 100, color: "bg-emerald-500", textColor: "text-emerald-600" },
  { label: "Baik",        min: 60, max: 79.99, color: "bg-blue-500", textColor: "text-blue-600" },
  { label: "Cukup",       min: 40, max: 59.99, color: "bg-amber-500", textColor: "text-amber-600" },
  { label: "Kurang",      min: 0,  max: 39.99, color: "bg-red-500", textColor: "text-red-600" },
];

function formatDate(date: Date) {
  const days = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

/* ════════════════════════════════════════════ */
const DashboardPage = () => {
  // ── State ──
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalKaryawan, setTotalKaryawan] = useState(0);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [totalKpi, setTotalKpi] = useState(0);
  const [topPerformers, setTopPerformers] = useState<SpkReport[]>([]);
  const [allReportItems, setAllReportItems] = useState<SpkReport[]>([]);
  const [activePeriode, setActivePeriode] = useState<Periode | null>(null);
  const [latestLockedPeriode, setLatestLockedPeriode] = useState<Periode | null>(null);
  const [lockedReportCount, setLockedReportCount] = useState(0);
  const [prevLockedReportCount, setPrevLockedReportCount] = useState(0);
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [karyawanPerDivisi, setKaryawanPerDivisi] = useState<Record<string, number>>({});

  // ── Refresh handler ──
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);

      // 1. Parallel fetch: karyawan, periode, divisi
      const [karyawanRes, periodeRes, divisiRes] = await Promise.all([
        karyawanService.getAll({ pageSize: 1 }),
        periodeService.getAll(1, 200),
        divisiService.getAll(1, 100),
      ]);

      const kTotal = karyawanRes.meta?.total ?? karyawanRes.data?.length ?? 0;
      setTotalKaryawan(kTotal);

      const periodeList = periodeRes.data || [];
      setPeriodes(periodeList);

      // Divisi list
      const divisiData = divisiRes.data || [];
      setDivisiList(divisiData);

      // Karyawan per divisi count
      const kPerDiv: Record<string, number> = {};
      divisiData.forEach((d) => {
        const name = d.namaDivisi || d.name || "Lainnya";
        kPerDiv[name] = d.karyawanCount ?? 0;
      });
      setKaryawanPerDivisi(kPerDiv);

      // Active & locked periods
      const active = periodeList.find((p) => p.Status === "open" || p.isAktif) || null;
      setActivePeriode(active);

      const locked = periodeList
        .filter((p) => p.Status === "locked")
        .sort((a, b) => (b.Tahun || 0) - (a.Tahun || 0) || b.Id - a.Id);
      const latestLocked = locked[0] || null;
      const prevLocked = locked[1] || null;
      setLatestLockedPeriode(latestLocked);

      // 2. KPI for active periode
      if (active) {
        const kpiRes = await kpiService.getByPeriode(active.Id, 1, 100);
        setTotalKpi(kpiRes.data?.length || 0);
      } else {
        setTotalKpi(0);
      }

      // 3. Report data from latest locked period (full + top 5)
      if (latestLocked) {
        const reportRes = await spkService.getReport(latestLocked.Id, 1, 200);
        const items = reportRes.data || [];
        setAllReportItems(items);
        setTopPerformers(items.slice(0, 5));
        setLockedReportCount(items.length);
      } else {
        setAllReportItems([]);
        setTopPerformers([]);
        setLockedReportCount(0);
      }

      // 4. Previous locked period count for trend comparison
      if (prevLocked) {
        const prevRes = await spkService.getReport(prevLocked.Id, 1, 1);
        setPrevLockedReportCount(prevRes.data?.length || 0);
      } else {
        setPrevLockedReportCount(0);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  // ── Computed: Trend % ──
  const trendPct = useMemo(() => {
    if (!prevLockedReportCount || !lockedReportCount) return null;
    return ((lockedReportCount - prevLockedReportCount) / prevLockedReportCount) * 100;
  }, [lockedReportCount, prevLockedReportCount]);

  // ── Computed: Score Distribution ──
  const scoreDistribution = useMemo(() => {
    return scoreRanges.map((range) => {
      const count = allReportItems.filter((item) => {
        const raw = item.nilai_akhir ?? item.totalScore ?? item.NilaiSkala ?? 0;
        const score = raw <= 1 ? raw * 100 : raw;
        return score >= range.min && score <= range.max;
      }).length;
      return { ...range, count };
    });
  }, [allReportItems]);

  const maxScoreCount = useMemo(() => Math.max(...scoreDistribution.map((s) => s.count), 1), [scoreDistribution]);

  // ── Computed: Divisi breakdown sorted by count ──
  const divisiBreakdown = useMemo(() => {
    return Object.entries(karyawanPerDivisi)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [karyawanPerDivisi]);
  const maxDivisiCount = useMemo(() => Math.max(...divisiBreakdown.map(([, c]) => c), 1), [divisiBreakdown]);

  // ── Stats Cards ──
  const stats = useMemo(() => [
    {
      title: "Total Karyawan",
      value: totalKaryawan,
      suffix: "orang",
      icon: "solar:users-group-rounded-bold-duotone",
      color: "text-primary",
      bgCard: "bg-primary/5 dark:bg-primary/10",
      href: "/apps/karyawan",
    },
    {
      title: "Periode Aktif",
      value: activePeriode ? 1 : 0,
      suffix: activePeriode ? activePeriode.NamaPeriode : "Tidak ada",
      icon: "solar:calendar-bold-duotone",
      color: "text-secondary",
      bgCard: "bg-secondary/5 dark:bg-secondary/10",
      href: "/apps/periode-kpi",
    },
    {
      title: "Total KPI",
      value: totalKpi,
      suffix: "kriteria",
      icon: "solar:documents-line-duotone",
      color: "text-warning",
      bgCard: "bg-warning/5 dark:bg-warning/10",
      href: "/apps/data-kpi",
    },
    {
      title: "Laporan Ranking",
      value: lockedReportCount,
      suffix: latestLockedPeriode ? latestLockedPeriode.NamaPeriode : "Belum ada",
      icon: "solar:chart-square-bold-duotone",
      color: "text-success",
      bgCard: "bg-success/5 dark:bg-success/10",
      href: "/apps/report",
      trend: trendPct,
    },
  ], [totalKaryawan, activePeriode, totalKpi, lockedReportCount, latestLockedPeriode, trendPct]);

  // ── Workflow Steps ──
  const steps = [
    { label: "Siapkan Periode Penilaian", desc: "Buat periode baru dan tetapkan sebagai periode aktif.", href: "/apps/periode-kpi", done: !!activePeriode },
    { label: "Atur Attribute / Satuan", desc: "Definisikan satuan pengukuran untuk tiap kriteria KPI.", href: "/apps/attribute" },
    { label: "Lengkapi Kriteria KPI", desc: "Masukkan daftar kriteria beserta target dan bobotnya.", href: "/apps/data-kpi", done: totalKpi > 0 },
    { label: "Input Perbandingan", desc: "Masukkan perbandingan prioritas antar kriteria penilaian.", href: "/apps/perbandingan" },
    { label: "Input Penilaian Karyawan", desc: "Isi nilai penilaian untuk tiap karyawan berdasarkan kriteria yang berlaku.", href: "/apps/penilaian" },
    { label: "Lihat Hasil & Ranking", desc: "Tinjau hasil perhitungan dan ranking karyawan terbaik.", href: "/apps/report", done: lockedReportCount > 0 },
  ];

  // ── Periode Status Counts ──
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { draft: 0, open: 0, processed: 0, locked: 0 };
    periodes.forEach((p) => {
      const s = (p.Status || "draft").toLowerCase();
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [periodes]);

  /* ════════════ Render ════════════ */
  return (
    <div className="flex flex-col gap-7">
      {/* ══════════ 1. HEADER BAR ══════════ */}
      <div className="bg-white dark:bg-boxdark rounded-xl border border-ld p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
            <Icon icon="solar:dashboard-bold-duotone" className="text-primary h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-dark dark:text-white">Dashboard</h1>
            <p className="text-xs text-slate-400">Ringkasan operasional penilaian kinerja · {formatDate(new Date())}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activePeriode && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {activePeriode.NamaPeriode}
            </span>
          )}
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            <Icon icon={refreshing ? "solar:refresh-bold" : "solar:refresh-linear"} className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ══════════ 2. METRIC CARDS with Trend ══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <div key={index}>
            <CardBox className="hover:shadow-lg transition-all duration-300 h-full border border-ld hover:border-primary/20 group p-5">
              <Link href={stat.href} className="flex flex-col gap-3 h-full">
                <div className="flex items-center justify-between">
                  <div className={`h-10 w-10 rounded-lg ${stat.bgCard} flex items-center justify-center shrink-0 ${stat.color} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon icon={stat.icon} height={20} />
                  </div>
                  {/* Trend badge */}
                  {"trend" in stat && stat.trend != null && (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${stat.trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      <Icon
                        icon={stat.trend >= 0 ? "solar:arrow-up-bold" : "solar:arrow-down-bold"}
                        className="h-3 w-3"
                      />
                      {Math.abs(stat.trend).toFixed(1)}%
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-[13px] text-slate-400 dark:text-slate-500 font-medium">{stat.title}</p>
                  {loading ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Spinner size="xs" />
                      <span className="text-[13px] text-slate-300">Memuat...</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-[22px] font-bold text-dark dark:text-white tabular-nums">{stat.value}</h3>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">{stat.suffix}</span>
                    </div>
                  )}
                </div>
              </Link>
            </CardBox>
          </div>
        ))}
      </div>

      {/* ══════════ 3. TOP RANKING + PERIODE STATUS ══════════ */}
      <div className="grid grid-cols-12 gap-6">
        {/* Top 5 Ranking */}
        <div className="lg:col-span-7 col-span-12">
          <CardBox className="p-0 h-full">
            <div className="flex justify-between items-center p-6 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Icon icon="solar:medal-star-bold" className="text-primary h-5 w-5" />
                  <h4 className="text-lg font-bold text-dark dark:text-white">Top 5 Ranking</h4>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  {latestLockedPeriode
                    ? `Periode ${latestLockedPeriode.NamaPeriode}`
                    : "Belum ada data ranking terkunci"}
                </p>
              </div>
              <Link href="/apps/report" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                Lihat Semua →
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
            ) : topPerformers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <Icon icon="solar:chart-square-outline" className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm text-slate-400 font-medium">Belum ada data ranking</p>
                <p className="text-xs text-slate-300 mt-1">Lakukan finalisasi periode terlebih dahulu</p>
              </div>
            ) : (
              <div className="px-6 pb-6 space-y-2">
                {topPerformers.map((item, idx) => {
                  const score = item.nilai_akhir ?? item.totalScore ?? item.NilaiSkala ?? 0;
                  const scorePct = score <= 1 ? score * 100 : score;
                  const rank = item.rank ?? item.Ranking ?? (idx + 1);
                  const medalColors = [
                    "from-amber-400 to-amber-500",
                    "from-slate-300 to-slate-400",
                    "from-amber-600 to-amber-700",
                    "from-slate-200 to-slate-300",
                    "from-slate-200 to-slate-300",
                  ];
                  return (
                    <div key={item.Id || idx} className="flex items-center gap-3 p-3 rounded-xl border border-ld hover:border-primary/20 hover:bg-lightprimary/10 transition-all duration-200">
                      <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${medalColors[idx] || medalColors[4]} flex items-center justify-center shrink-0 shadow-sm`}>
                        <span className="text-sm font-black text-white leading-none">{rank}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-dark dark:text-white truncate">{item.nama || item.Karyawan?.Nama || "-"}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{item.nik || item.Karyawan?.Nik || "-"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-lg font-black text-primary tabular-nums">{scorePct.toFixed(1)}</span>
                        <span className="text-[10px] text-slate-400 ml-0.5">%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBox>
        </div>

        {/* Periode Status */}
        <div className="lg:col-span-5 col-span-12">
          <CardBox className="p-6 h-full">
            <div className="flex items-center gap-2 mb-5">
              <Icon icon="solar:calendar-mark-bold" className="text-primary h-5 w-5" />
              <h4 className="text-lg font-bold text-dark dark:text-white">Status Periode</h4>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12"><Spinner size="md" /></div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <div key={key} className={`rounded-xl p-3.5 ${cfg.bg} border border-transparent hover:border-ld transition-all duration-200`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon icon={cfg.icon} className={`h-4 w-4 ${cfg.color}`} />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{cfg.label}</span>
                      </div>
                      <span className={`text-2xl font-black ${cfg.color}`}>{statusCounts[key] || 0}</span>
                    </div>
                  ))}
                </div>

                {activePeriode ? (
                  <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Periode Aktif</span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ACTIVE
                      </span>
                    </div>
                    <h5 className="text-base font-bold text-dark dark:text-white">{activePeriode.NamaPeriode}</h5>
                    <p className="text-xs text-slate-400 mt-1">{activePeriode.Tahun} · {activePeriode.NamaDivisi || "Semua Divisi"}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Link href="/apps/penilaian" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
                        <Icon icon="solar:play-bold" className="h-3.5 w-3.5" />
                        Mulai Penilaian
                      </Link>
                      <Link href="/apps/report" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        Lihat Laporan
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-4 text-center">
                    <Icon icon="solar:calendar-add-bold" className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 font-medium">Tidak ada periode aktif</p>
                    <Link href="/apps/periode-kpi" className="text-xs text-primary font-semibold hover:text-primary/80 mt-1 inline-block">Buat Periode Baru</Link>
                  </div>
                )}
              </>
            )}
          </CardBox>
        </div>
      </div>

      {/* ══════════ 4. SCORE DISTRIBUTION + DIVISI BREAKDOWN ══════════ */}
      <div className="grid grid-cols-12 gap-6">
        {/* Score Distribution */}
        <div className="lg:col-span-7 col-span-12">
          <CardBox className="p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Icon icon="solar:chart-bar-bold" className="text-primary h-5 w-5" />
                  <h4 className="text-lg font-bold text-dark dark:text-white">Distribusi Skor</h4>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  {latestLockedPeriode
                    ? `${allReportItems.length} karyawan · Periode ${latestLockedPeriode.NamaPeriode}`
                    : "Belum ada data penilaian"}
                </p>
              </div>
              <Link href="/apps/report" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">Full Report →</Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12"><Spinner size="md" /></div>
            ) : allReportItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Icon icon="solar:chart-bar-outline" className="h-10 w-10 text-slate-200 dark:text-slate-700 mb-2" />
                <p className="text-sm text-slate-400">Belum ada data untuk ditampilkan</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {scoreDistribution.map((range) => (
                    <div key={range.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${range.color}`} />
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{range.label}</span>
                          <span className="text-[11px] text-slate-400">({range.min}–{range.max})</span>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{range.count}</span>
                          <span className="text-[11px] text-slate-400">
                            ({allReportItems.length ? ((range.count / allReportItems.length) * 100).toFixed(0) : 0}%)
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${range.color}`}
                          style={{ width: `${(range.count / maxScoreCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary bar */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-4 flex-wrap">
                    {scoreDistribution.map((range) => (
                      <div key={range.label} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${range.color}`} />
                        <span className="text-[11px] text-gray-500">{range.label}</span>
                        <span className="text-[11px] font-semibold text-gray-900">{range.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardBox>
        </div>

        {/* Divisi Breakdown */}
        <div className="lg:col-span-5 col-span-12">
          <CardBox className="p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Icon icon="solar:building-bold" className="text-secondary h-5 w-5" />
                  <h4 className="text-lg font-bold text-dark dark:text-white">Karyawan per Divisi</h4>
                </div>
                <p className="text-sm text-slate-400 mt-1">{divisiList.length} divisi terdaftar</p>
              </div>
              <Link href="/apps/divisi" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">Lihat Semua →</Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12"><Spinner size="md" /></div>
            ) : divisiBreakdown.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Icon icon="solar:building-outline" className="h-10 w-10 text-slate-200 dark:text-slate-700 mb-2" />
                <p className="text-sm text-slate-400">Belum ada data divisi</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                {divisiBreakdown.map(([name, count]) => (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[180px]">{name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 tabular-nums">{count}</span>
                        <span className="text-[11px] text-slate-400">
                          ({totalKaryawan ? ((count / totalKaryawan) * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 bg-secondary"
                        style={{ width: `${(count / maxDivisiCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBox>
        </div>
      </div>

      {/* ══════════ 5. TREND CHART ══════════ */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <TrendChart />
        </div>
      </div>

      {/* ══════════ 6. WORKFLOW & TIPS ══════════ */}
      <div className="grid grid-cols-12 gap-6">
        <div className="lg:col-span-7 col-span-12">
           <CardBox className="p-0">
              <div className="flex justify-between items-center p-6 pb-4">
                 <div>
                   <h4 className="text-lg font-bold text-dark dark:text-white">Alur Kerja Penilaian</h4>
                   <p className="text-sm text-slate-400 mt-1">Ikuti langkah-langkah berikut untuk proses penilaian</p>
                 </div>
              </div>
              <div className="space-y-2.5 px-6 pb-6">
                {steps.map((step, idx) => (
                  <Link
                    key={step.label}
                    href={step.href}
                    className="flex items-start gap-3 rounded-xl border border-ld p-3.5 hover:bg-lightprimary/30 hover:border-primary/20 transition-all duration-200 group"
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center mt-0.5 transition-colors duration-200 ${
                      step.done
                        ? "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white"
                        : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
                    }`}>
                      {step.done
                        ? <Icon icon="solar:check-circle-bold" className="h-4 w-4" />
                        : <span className="text-sm font-bold">{idx + 1}</span>
                      }
                    </div>
                    <div>
                      <h5 className="font-semibold text-dark dark:text-white text-[15px]">{step.label}</h5>
                      <p className="text-sm text-slate-400 mt-0.5">{step.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
           </CardBox>
        </div>
        <div className="lg:col-span-5 col-span-12">
           <CardBox className="p-6">
              <h4 className="text-lg font-bold mb-5 text-dark dark:text-white">Tips Penggunaan</h4>
              <div className="flex flex-col gap-3 text-sm">
                <div className="rounded-xl bg-lightprimary/50 p-3.5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon icon="solar:lightbulb-bold" className="text-primary" height={16} />
                    <span className="font-semibold text-primary">Periode Aktif</span>
                  </div>
                  <p className="text-slate-500 text-[13px]">Gunakan satu periode aktif agar perhitungan perbandingan dan penilaian tetap konsisten.</p>
                </div>
                <div className="rounded-xl bg-lightsuccess/50 p-3.5 border border-success/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon icon="solar:check-circle-bold" className="text-success" height={16} />
                    <span className="font-semibold text-success">Finalisasi</span>
                  </div>
                  <p className="text-slate-500 text-[13px]">Pastikan semua nilai penilaian sudah terisi sebelum melakukan finalisasi ranking.</p>
                </div>
                <div className="rounded-xl bg-lightinfo/50 p-3.5 border border-info/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon icon="solar:info-circle-bold" className="text-info" height={16} />
                    <span className="font-semibold text-info">Menu Pengembang</span>
                  </div>
                  <p className="text-slate-500 text-[13px]">Menu Pengembang hanya untuk administrator guna memvalidasi perhitungan penilaian kinerja.</p>
                </div>
              </div>
           </CardBox>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
