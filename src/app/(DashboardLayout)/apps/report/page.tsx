"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Table, Button, Badge, Spinner, Alert, Modal, Label, Textarea, TextInput, Select } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import dynamic from "next/dynamic";
import spkService, { SpkReport } from "@/services/spkService";
import periodeService, { Periode } from "@/services/periodeService";
import karyawanService from "@/services/karyawanService";
import kpiService from "@/services/kpiService";
import { usePermission } from "@/hooks/usePermission";
import IndividualReportModal from "@/app/components/shared/IndividualReportModal";
import { isManagerRole } from "@/utils/accessControl";

// Shared Components
import DataTable, { Column } from "@/app/components/shared/DataTable";
import DataPagination from "@/app/components/shared/DataPagination";
import DataSearch from "@/app/components/shared/DataSearch";
import DataFilter from "@/app/components/shared/DataFilter";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const ReportHasil = () => {
  const { user, isKaryawan, isAdminLike, isManager } = usePermission();
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number>(0);
  const [selectedLokasi, setSelectedLokasi] = useState<string>("");
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [lokasiOptions, setLokasiOptions] = useState<{id: any, name: string}[]>([]);
  const [groups, setGroups] = useState<{id: number, NamaGroup: string}[]>([]);
  const [reports, setReports] = useState<SpkReport[]>([]);
  const [chartReports, setChartReports] = useState<SpkReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPeriode, setSelectedPeriode] = useState<Periode | null>(null);

  // Manager UI state - must be declared early since columns use it
  const [isManagerUI, setIsManagerUI] = useState(false);
  
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setIsManagerUI(isManagerRole(role));
  }, []);

  // Pagination & Search
  const [reportPage, setReportPage] = useState(1);
  const [reportPageSize, setReportPageSize] = useState(10);
  const [totalReports, setTotalReports] = useState(0);
  const [search, setSearch] = useState("");
  const searchDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }

    searchDebounceTimer.current = setTimeout(() => {
      setSearch(value);
      setReportPage(1);
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
    };
  }, []);

  const isFinal = selectedPeriode?.Status === 'locked';

  // Individual Report State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [individualData, setIndividualData] = useState<any>(null);
  const [printingId, setPrintingId] = useState<number | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewReportId, setReviewReportId] = useState<number | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    status: 'Reviewed' as 'Reviewed' | 'Draft' | 'Pending',
    catatan_prestasi: '',
    catatan_indisipliner: '',
    catatan_saran: ''
  });
const formatScore = (value?: number) => {
  if (!value) return 0;

  const score = value <= 1 ? value * 100 : value;

  return Number(score.toFixed(2));
};

  const getRankValue = (item: SpkReport) => Number(item.rank || item.Ranking || 0);
  const getFinalScoreValue = (item: SpkReport) => Number(item.nilai_yi ?? item.NilaiYi ?? item.nilai_akhir ?? item.totalScore ?? item.NilaiSkala ?? 0);

  const allReviewed = useMemo(() => {
    if (reports.length === 0) return false;
    return reports.every(r => r.status === 'Reviewed' || r.Status === 'Reviewed');
  }, [reports]);

  const columns: Column<SpkReport>[] = [
    {
      header: "Rank",
      headerClasses: "text-center",
      cellClasses: "text-center font-bold text-lg text-primary",
      render: (item: SpkReport) => {
        const rank = (item as any).displayRank ?? item.rank ?? item.Ranking;
        const rankNum = Number(rank);
        if (rankNum === 1) return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400 text-white font-black text-sm">1</span>;
        if (rankNum === 2) return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-400 text-white font-black text-sm">2</span>;
        if (rankNum === 3) return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-400 text-white font-black text-sm">3</span>;
        return rank;
      },
    },
    {
      header: "Nama",
      cellClasses: "text-left font-black text-gray-900 dark:text-white uppercase text-xs tracking-tight",
      render: (item: SpkReport) => item.nama || item.Karyawan?.name || item.Karyawan?.Nama,
    },
    {
      header: "Divisi",
      cellClasses: "text-left text-xs text-gray-600 dark:text-gray-300",
      render: (item: SpkReport) => {
        const divisi = item.divisi || item.Divisi || (item.Karyawan as any)?.Divisi || (item.Karyawan as any)?.divisi || "-";
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium">{divisi || "-"}</span>;
      },
    },
    {
      header: "Nilai Yi",
      headerClasses: "text-center",
      cellClasses: "text-center font-mono text-xs font-bold text-primary tabular-nums",
      render: (item: SpkReport) => {
        const yi = getFinalScoreValue(item);
        return Number(yi).toFixed(6);
      },
    },
    {
      header: "Pencapaian KPI",
      headerClasses: "text-center",
      cellClasses: "text-center",
      render: (item: SpkReport) => {
        const pct = Number(item.achievement ?? item.Achievement ?? item.persentase_kpi ?? item.PersentaseKPI ?? 0);
        const predikat = getPredikat(pct);
        return (
          <div className="flex flex-col items-center gap-1">
            <span className="font-black text-sm tabular-nums">{pct > 0 ? pct.toFixed(1) + "%" : "-"}</span>
            <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${predikat.barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      header: "Predikat",
      headerClasses: "text-center",
      cellClasses: "text-center",
      render: (item: SpkReport) => {
        const pct = Number(item.achievement ?? item.Achievement ?? item.persentase_kpi ?? item.PersentaseKPI ?? 0);
        const predikat = getPredikat(pct);
        return <Badge color={predikat.bsColor} className="text-[10px] font-bold px-2.5 py-1">{predikat.label}</Badge>;
      },
    },
    {
      header: "Status",
      headerClasses: "text-center",
      cellClasses: "text-center",
      render: (item: SpkReport) => getStatusBadge(isFinal ? "locked" : (item.status || item.Status)),
    },
    {
      header: "Aksi",
      headerClasses: "text-center",
      cellClasses: "text-center",
      render: (item: SpkReport) => (
        <div className="flex justify-center gap-1.5">
          {isManagerUI && !isFinal && (
            <Button 
              color="info" 
              size="xs" 
              pill 
              onClick={() => {
                setReviewReportId(Number(item.id || item.Id || 0));
                
                const c = item.catatan || (item as any).Catatan;
                let p = "", i = "", s = "";
                
                if (typeof c === 'object' && c !== null) {
                  p = (c as any).p || "";
                  i = (c as any).i || "";
                  s = (c as any).s || "";
                } else if (typeof c === 'string') {
                  try {
                    if (c.startsWith('{')) {
                      const parsed = JSON.parse(c);
                      p = parsed.p || "";
                      i = parsed.i || "";
                      s = parsed.s || "";
                    } else {
                      p = c;
                    }
                  } catch (e) {
                    p = c;
                  }
                }

                setReviewForm({
                  status: (item.status as any) || (item.Status as any) || 'Reviewed',
                  catatan_prestasi: p,
                  catatan_indisipliner: i,
                  catatan_saran: s
                });
                setShowReviewModal(true);
              }}
            >
              <Icon icon="solar:notes-minimalistic-bold" className="h-3.5 w-3.5" />
              <span className="ml-1 text-[10px]">Review</span>
            </Button>
          )}
          <Button color="light" size="xs" pill onClick={() => handleFetchIndividual(getReportRowId(item))}>
            {printingId === getReportRowId(item) ? <Spinner size="xs" /> : <Icon icon="solar:eye-bold" className="h-3.5 w-3.5" />}
            <span className="ml-1 text-[10px]">Lihat</span>
          </Button>
          <Button 
            color="dark" 
            size="xs" 
            pill 
            disabled={!isFinal || (printingId === getReportRowId(item))}
            onClick={() => handlePrintPdf(getReportRowId(item))}
          >
            <Icon icon="solar:printer-bold" className="h-3.5 w-3.5" />
            <span className="ml-1 text-[10px]">PDF</span>
          </Button>
        </div>
      ),
    },
  ];

  const getReportRowId = (item: SpkReport) => Number(item.Karyawan?.id || item.Karyawan?.Id || item.id || item.Id || 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resP, resL] = await Promise.all([
          periodeService.getAll(1, 100),
          karyawanService.getWorkLocations()
        ]);
        setPeriodes(resP.data);
        setLokasiOptions(resL.data);
        if (resP.data.length > 0) {
          setSelectedPeriodeId(resP.data[0].id || resP.data[0].Id);
        }
      } catch (err: any) {
        setError("Gagal mengambil data filter");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!selectedPeriodeId) return;
      try {
        const res = await kpiService.getGroups(selectedPeriodeId);
        setGroups(res.data || []);
      } catch (err) {
        console.error("Gagal mengambil grup KPI", err);
      }
    };
    fetchGroups();
  }, [selectedPeriodeId]);

  useEffect(() => {
    const fetchReport = async () => {
      if (!selectedPeriodeId) return;
      try {
        setLoading(true);
        
        // Refresh detail periode dari DB untuk sinkronisasi status terbaru
        const resP_Single = await periodeService.getAll(1, 100);
        const latestP = resP_Single.data.find((p: any) => (p.id || p.Id) === selectedPeriodeId);
        if (latestP) setSelectedPeriode(latestP);

        const res = await spkService.getReport(selectedPeriodeId, reportPage, reportPageSize, selectedLokasi || undefined, search, '', {}, selectedGroupId || undefined);
        const rawReports = res.data || [];
        setTotalReports(res.meta?.total || (res as any).totalCount || 0);
        
          const isManagerUI_Local = isManagerRole(localStorage.getItem('userRole'));
        const scoped = rawReports.filter((item: SpkReport) => {
          if (isKaryawan) {
            const employeeId = Number((item.id || item.Karyawan?.Id) ?? 0);
            return employeeId === Number(user?.employee_id ?? 0);
          }

          if (isAdminLike && user?.dept_id && !isManagerUI_Local) {
            const currentDivisiId = (item as any)?.Periode?.DivisiId ?? (item as any)?.Periode?.departemen_id;
            // Jika DivisiId null/undefined (Semua Divisi), maka semua Kadiv bisa melihat
            if (currentDivisiId === null || currentDivisiId === undefined || currentDivisiId === 0) {
              return true;
            }
            return Number(currentDivisiId) === Number(user.dept_id);
          }

          return true;
        });

        const ranked = [...scoped].sort((a, b) => {
          const rankA = getRankValue(a);
          const rankB = getRankValue(b);
          if (rankA > 0 && rankB > 0 && rankA !== rankB) return rankA - rankB;
          return getFinalScoreValue(b) - getFinalScoreValue(a);
        });

        setReports(ranked);
        // Chart mengikuti data tabel (1 fetch saja, tanpa refetch terpisah)
        setChartReports(ranked);
        setError(null);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Gagal mengambil laporan hasil");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [selectedPeriodeId, selectedLokasi, reportPage, reportPageSize, search, selectedGroupId, isKaryawan, isAdminLike, isManager, user?.employee_id, user?.dept_id]);

  const handleFetchIndividual = async (karyawanId: number) => {
    try {
      setPrintingId(karyawanId);
      setReportLoading(true);
      setReportError(null);
      const res = await spkService.getIndividualReport(selectedPeriodeId, karyawanId);
      // res is already the full API response {success, title, columns, data, metadata, kesimpulan}
      if (res?.success && res?.metadata && res?.kesimpulan) {
        setIndividualData(res);
        setShowPrintModal(true);
      } else {
        setReportError(res?.message || "Gagal mengambil data laporan individual");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Gagal mengambil data laporan individual";
      setReportError(msg);
      setIndividualData(null);
    } finally {
      setReportLoading(false);
      setPrintingId(null);
    }
  };

  const handleExportSummary = async () => {
    if (!selectedPeriodeId) return;
    try {
      setExporting(true);
      const url = `/spk/report/summary/${selectedPeriodeId}?format=excel`;
      await spkService.downloadReport(url, `Rekapitulasi_Hasil_Periode_${selectedPeriodeId}.xlsx`);
    } catch (err) {
      setError("Gagal melakukan ekspor rekapitulasi");
    } finally {
      setExporting(false);
    }
  };

  const handlePrintPdf = async (karyawanId: number) => {
    if (!selectedPeriodeId) return;
    try {
      setPrintingId(karyawanId);
      const url = `/spk/report/individual/${selectedPeriodeId}/${karyawanId}?format=pdf`;
      await spkService.downloadReport(url, `Laporan_KPI_${karyawanId}.pdf`);
    } catch (err) {
      setError("Gagal mengunduh laporan PDF");
    } finally {
      setPrintingId(null);
    }
  };

  const handleReview = async () => {
    if (!reviewReportId) return;
    try {
      setReviewLoading(true);
      
      const combinedNote = {
        p: reviewForm.catatan_prestasi,
        i: reviewForm.catatan_indisipliner,
        s: reviewForm.catatan_saran
      };

      const res = await spkService.reviewMooraResult(reviewReportId, combinedNote, reviewForm.status);
      if (res.success) {
        setShowReviewModal(false);
        setReviewForm({
            status: 'Reviewed',
            catatan_prestasi: '',
            catatan_indisipliner: '',
            catatan_saran: ''
        });
        setReviewReportId(null);
        
        // Refresh data tanpa reload halaman - update status di reports array
        setReports(prev => prev.map(r => {
          const rId = r.id || r.Id;
          if (rId === reviewReportId) {
            return {
              ...r,
              status: reviewForm.status,
              Status: reviewForm.status,
              catatan: combinedNote,
              Catatan: combinedNote,
            };
          }
          return r;
        }));
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal menyimpan review");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleUpdateStatus = async (status: 'locked' | 'draft') => {
    if (!selectedPeriodeId) return;
    if (!confirm(`Apakah Anda yakin ingin mengubah status periode ini menjadi ${status}?` + 
      (status === 'locked' ? '\n\nSnapshot akan dikunci untuk periode ini.' : ''))) return;

    try {
      setUpdating(true);
      const res = await spkService.updateStatus(selectedPeriodeId, status);
      if (res.success) {
        // Refresh data secara menyeluruh untuk sinkronisasi realtime
        const resP = await periodeService.getAll(1, 100);
        setPeriodes(resP.data);
        
        // Update selectedPeriode secara manual untuk segera mengubah state UI
        const updatedP = resP.data.find((p: any) => (p.id || p.Id) === selectedPeriodeId);
        if (updatedP) setSelectedPeriode(updatedP);
        
        // Refresh laporan dengan filter & pagination saat ini
        const resR = await spkService.getReport(selectedPeriodeId, reportPage, reportPageSize, selectedLokasi || undefined, search, '', {}, selectedGroupId || undefined);
        const rawRefresh = resR.data || [];
        setTotalReports(resR.meta?.total || 0);
        const rankedRefresh = [...rawRefresh].sort((a, b) => {
          const rankA = getRankValue(a);
          const rankB = getRankValue(b);
          if (rankA > 0 && rankB > 0 && rankA !== rankB) return rankA - rankB;
          return getFinalScoreValue(b) - getFinalScoreValue(a);
        });
        setReports(rankedRefresh);
        // Chart mengikuti data tabel (tanpa refetch terpisah)
        setChartReports(rankedRefresh);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || `Gagal mengubah status menjadi ${status}`);
    } finally {
      setUpdating(false);
    }
  };

  const chartOptions: any = {
    chart: {
      type: 'bar',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      toolbar: { show: false },
      background: 'transparent',
      stacked: false,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: { enabled: true, delay: 150 },
        dynamicAnimation: { enabled: true, speed: 350 }
      }
    },
    colors: ['#5D87FF'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        borderRadiusApplication: 'end',
        barHeight: '55%',
        distributed: false,
        dataLabels: { position: 'top' }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'horizontal',
        shadeIntensity: 0.25,
        gradientToColors: ['#49BEFF'],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.85,
        stops: [0, 100]
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(2);
      },
      offsetX: 24,
      textAnchor: 'start',
      style: {
        fontSize: '11px',
        fontWeight: 700,
        colors: ['#5A6A85']
      }
    },
    legend: { show: false },
    xaxis: {
      categories: chartReports.map(r => r.nama || r.Karyawan?.name || r.Karyawan?.Nama || "Unknown"),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: '#5A6A85', fontSize: '11px' },
        formatter: (val: string) => Number(val).toFixed(0)
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#5A6A85', fontSize: '12px', fontWeight: 600 }
      }
    },
    grid: {
      borderColor: 'rgba(0,0,0,0.05)',
      strokeDashArray: 4,
      padding: { left: 10, right: 20 }
    },
    tooltip: {
      theme: 'light',
      y: { title: { formatter: () => "Nilai Skala:" } }
    }
  };

  const chartSeries = [{
    name: 'Nilai Akhir',
    data: chartReports.map(r => formatScore(getFinalScoreValue(r)))
  }];

  const bestEmployee = chartReports.length > 0 ? chartReports[0] : null;

  const getPredikat = (pct: number) => {
    if (pct >= 90) return { label: "Sangat Baik", bsColor: "success" as const, barColor: "bg-emerald-500" };
    if (pct >= 80) return { label: "Baik", bsColor: "info" as const, barColor: "bg-blue-500" };
    if (pct >= 70) return { label: "Cukup", bsColor: "warning" as const, barColor: "bg-amber-500" };
    if (pct >= 60) return { label: "Kurang", bsColor: "failure" as const, barColor: "bg-orange-500" };
    return { label: "Sangat Kurang", bsColor: "failure" as const, barColor: "bg-rose-500" };
  };

  const canExport = selectedPeriodeId > 0 && isFinal;

  const getStatusBadge = (status?: string) => {
    const s = (status || 'Draft').toLowerCase();
    if (s === 'reviewed') return <Badge color="success" icon={() => <Icon icon="solar:check-circle-bold" className="mr-1 h-3 w-3" />}>Reviewed</Badge>;
    if (s === 'pending') return <Badge color="warning" icon={() => <Icon icon="solar:clock-circle-bold" className="mr-1 h-3 w-3" />}>Pending</Badge>;
    return <Badge color="gray" icon={() => <Icon icon="solar:file-text-bold" className="mr-1 h-3 w-3" />}>Draft</Badge>;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Stepper for Laporan */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto overflow-x-auto gap-4">
          {[ 
            { step: 1, label: "Grup KPI", icon: "solar:settings-bold" },
            { step: 2, label: "Bandingkan Grup", icon: "solar:folder-2-bold" },
            { step: 3, label: "Bandingkan KPI", icon: "solar:documents-bold" },
            { step: 4, label: "Input Realisasi", icon: "solar:pen-new-square-bold" },
            { step: 5, label: "Hasil & Review", icon: "solar:chart-square-bold" }
          ].map((s, idx) => {
            const isCurrent = s.step === 5;
            const isDone = s.step < 5;
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ranking Kinerja Karyawan</h1>
          <p className="text-sm text-gray-500">Hasil perhitungan penilaian kinerja per periode</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
             <DataSearch 
                placeholder="Cari Karyawan..." 
               debounceTime={0}
               onSearch={handleSearchChange}
             />
             <DataFilter
                value={selectedLokasi}
                onChange={(val) => {
                  setSelectedLokasi(val);
                  setReportPage(1);
                }}
                options={lokasiOptions.map(l => ({ value: String(l.name), label: l.name }))}
                placeholder="Semua Lokasi"
                className="w-full md:w-48"
             />
              <DataFilter
                 value={selectedPeriodeId}
                 onChange={(val) => {
                   setSelectedPeriodeId(Number(val));
                   setSelectedGroupId(0);
                   setReportPage(1);
                 }}
                 options={periodes.map(p => ({ 
                   value: p.id || p.Id, 
                   label: `${p.NamaPeriode || p.namaPeriode} - ${p.NamaDivisi || p.divisi?.namaDivisi || ""}`
                 }))}
                 placeholder="Pilih Periode"
                 className="w-full md:w-56"
              />
              <DataFilter
                 value={selectedGroupId}
                 onChange={(val) => {
                   setSelectedGroupId(Number(val));
                   setReportPage(1);
                 }}
                 options={[{ value: 0, label: "Semua Grup KPI" }, ...groups.map(g => ({ value: g.id, label: g.NamaGroup }))]}
                 placeholder="Pilih Grup KPI"
                 className="w-full md:w-48"
              />
             
             <div className="flex gap-2 w-full md:w-auto">
                {!isFinal && (
                  <Button 
                    color="success" 
                    size="sm" 
                    onClick={() => handleUpdateStatus('locked')} 
                    disabled={updating || !isManagerUI || !allReviewed}
                    title={!isManagerUI ? "Hanya Manager yang dapat mengunci snapshot" : !allReviewed ? "Semua karyawan harus direview terlebih dahulu" : ""}
                  >
                    {updating ? <Spinner size="sm" /> : <Icon icon="solar:check-read-linear" className="mr-2 h-4 w-4" />}
                    Kunci Periode
                  </Button>
                )}
                {isFinal && isManagerUI && (
                  <Button 
                    color="warning" 
                    size="sm" 
                    onClick={() => handleUpdateStatus('draft')} 
                    disabled={updating}
                  >
                    {updating ? <Spinner size="sm" /> : <Icon icon="solar:undo-left-round-linear" className="mr-2 h-4 w-4" />}
                    Buka Kembali
                  </Button>
                )}
                <Button color="dark" size="sm" className="flex items-center" onClick={handleExportSummary} disabled={!canExport}>
                    {exporting ? <Spinner size="sm" className="mr-2" /> : <Icon icon="solar:file-send-bold" className="mr-2 h-4 w-4" />}
                    Unduh Rekap Excel
                </Button>
             </div>
        </div>
      </div>

      {!isFinal && !loading && (
        <Alert color="warning" className="mb-4" icon={() => <Icon icon="solar:info-circle-bold" className="h-5 w-5" />}>
          Periode ini masih berstatus <b>DRAFT</b>.
          {isManagerUI ? " Kunci periode setelah semua karyawan direview." : " Menunggu persetujuan Manager."}
        </Alert>
      )}

      {error && <Alert color="failure" className="mb-4" onDismiss={() => setError(null)}>{error}</Alert>}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
           <CardBox>
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-bold text-gray-800 dark:text-white">Visualisasi Ranking Kinerja</h4>
                  <Badge color="info">Skor Akhir</Badge>
              </div>
              {loading ? (
                <div className="flex justify-center p-20"><Spinner size="xl" /></div>
              ) : reports.length > 0 || chartReports.length > 0 ? (
                <Chart
                  options={chartOptions}
                  series={chartSeries}
                  type="bar"
                  height={Math.max(320, chartReports.length * 42)}
                  width="100%"
                />
              ) : (
                <div className="text-center py-20 text-gray-500 italic">Tidak ada data untuk periode ini</div>
              )}
           </CardBox>
        </div>

        <div className="col-span-12 lg:col-span-4">
            <CardBox className="h-full">
                <h4 className="text-lg font-bold mb-4 text-gray-800 dark:text-white text-center">🏆 Karyawan Terbaik</h4>
                {bestEmployee ? (
                  <div className="flex flex-col items-center justify-center space-y-3 py-6 text-center">
                      <div className="relative">
                          <img 
                              src={`https://ui-avatars.com/api/?name=${bestEmployee.nama || bestEmployee.Karyawan?.name || bestEmployee.Karyawan?.Nama}&background=random&size=128`}
                              alt="Best Employee" 
                              className="w-24 h-24 rounded-full border-4 border-yellow-400 p-1"
                          />
                          <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1.5 rounded-full shadow-lg">
                              <Icon icon="solar:crown-minimalistic-bold" className="h-5 w-5" />
                          </div>
                      </div>
                      <div>
                          <h2 className="text-xl font-black text-primary uppercase">{bestEmployee.nama || bestEmployee.Karyawan?.name || bestEmployee.Karyawan?.Nama}</h2>
                          <p className="text-xs text-gray-500 mt-1">{bestEmployee.divisi || bestEmployee.Divisi || (bestEmployee.Karyawan as any)?.Divisi || (bestEmployee.Karyawan as any)?.divisi || "-"}</p>
                      </div>
                      <div className="flex flex-col gap-2 w-full px-4">
                          <div className="flex justify-between text-xs bg-primary/5 px-3 py-1.5 rounded-lg">
                              <span className="text-gray-500">Nilai Yi</span>
                              <span className="font-bold text-primary">{(bestEmployee.nilai_yi || bestEmployee.NilaiYi || bestEmployee.nilai_akhir || bestEmployee.totalScore || bestEmployee.NilaiSkala || 0).toFixed(6)}</span>
                          </div>
                          {(() => {
                            const rawPct = bestEmployee.persentase_kpi || bestEmployee.PersentaseKPI || 0;
                            const pct = rawPct > 0 && rawPct <= 1 ? rawPct * 100 : rawPct;
                            const pred = getPredikat(pct);
                            return pct > 0 ? (
                              <>
                                <div className="flex justify-between text-xs bg-primary/5 px-3 py-1.5 rounded-lg">
                                    <span className="text-gray-500">Pencapaian KPI</span>
                                    <span className="font-bold text-primary">{pct.toFixed(1)}%</span>
                                </div>
                                <Badge color={pred.bsColor} className="text-xs font-bold mx-auto">{pred.label}</Badge>
                              </>
                            ) : null;
                          })()}
                      </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400 italic">Belum ada data ranking</div>
                )}
            </CardBox>
        </div>
        
        <div className="col-span-12">
          <CardBox>
          <h4 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Daftar Ranking Karyawan</h4>
            
            <DataTable
              loading={loading}
              data={reports}
              columns={columns}
              rowKey={(item) => item.Id || item.id || 0}
            />

            <DataPagination
              currentPage={reportPage}
              totalPages={Math.ceil(totalReports / reportPageSize)}
              onPageChange={setReportPage}
              pageSize={reportPageSize}
              onPageSizeChange={(size) => {
                setReportPageSize(size);
                setReportPage(1);
              }}
              totalItems={totalReports}
            />
          </CardBox>
        </div>
      </div>

      {/* Review & Notes Modal */}
      <Modal show={showReviewModal} onClose={() => setShowReviewModal(false)} size="lg">
        <Modal.Header>Review Hasil Penilaian</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label value="Keputusan Review" />
              <Select 
                value={reviewForm.status} 
                onChange={(e) => setReviewForm({...reviewForm, status: e.target.value as any})}
              >
                <option value="Reviewed">SETUJUI</option>
                <option value="Pending">TUNDA</option>
                <option value="Draft">KEMBALIKAN KE DRAFT</option>
              </Select>
            </div>
            
            <div className="border-t pt-4 space-y-3">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-widest">Catatan Evaluasi</h4>
              
              <div>
                <Label value="1. Catatan Prestasi" className="text-[10px] uppercase" />
                <Textarea 
                  placeholder="Contoh: Sangat proaktif dalam tim..."
                  rows={2}
                  value={reviewForm.catatan_prestasi}
                  onChange={(e) => setReviewForm({...reviewForm, catatan_prestasi: e.target.value})}
                />
              </div>

              <div>
                <Label value="2. Catatan Indisipliner" className="text-[10px] uppercase" />
                <Textarea 
                  placeholder="Contoh: Terlambat tanpa izin 2x..."
                  rows={2}
                  value={reviewForm.catatan_indisipliner}
                  onChange={(e) => setReviewForm({...reviewForm, catatan_indisipliner: e.target.value})}
                />
              </div>

              <div>
                <Label value="3. Saran Pengembangan" className="text-[10px] uppercase" />
                <Textarea 
                  placeholder="Contoh: Tingkatkan ketelitian data..."
                  rows={2}
                  value={reviewForm.catatan_saran}
                  onChange={(e) => setReviewForm({...reviewForm, catatan_saran: e.target.value})}
                />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" onClick={handleReview} disabled={reviewLoading}>
            {reviewLoading ? <Spinner size="sm" /> : "Simpan"}
          </Button>
          <Button color="gray" onClick={() => setShowReviewModal(false)}>Batal</Button>
        </Modal.Footer>
      </Modal>

      {/* Individual Report Modal */}
      {reportLoading && (
        <Modal show={true} size="sm">
          <Modal.Body className="flex flex-col items-center justify-center py-10 gap-4">
            <Spinner size="xl" color="info" />
            <p className="text-sm text-gray-500">Memuat laporan individual...</p>
          </Modal.Body>
        </Modal>
      )}
      {reportError && !reportLoading && (
        <Alert color="failure" className="mb-4" onDismiss={() => setReportError(null)}>
          {reportError}
        </Alert>
      )}
      {individualData && (
        <IndividualReportModal
          show={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          data={individualData}
        />
      )}
    </div>
  );
};

export default ReportHasil;
