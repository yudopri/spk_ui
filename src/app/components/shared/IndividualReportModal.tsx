"use client";
import React from "react";
import { Table, Modal, Badge, Progress, Button } from "flowbite-react";
import { Icon } from "@iconify/react";

interface IndividualReportProps {
  show: boolean;
  onClose: () => void;
  data: {
    metadata: {
      Nama: string;
      NIK: string;
      Periode: string;
      Tahun: number;
      DibuatOleh?: string;
      DisetujuiOleh?: string;
      Status?: string;
    };
    rincian: Array<{
      group: string;
      items: Array<{
        Kriteria: string;
        Realisasi: string | number;
        Satuan: string;
        group_id?: number;
        nama_grup?: string;
        Target?: string | number;
      }>;
    }>;
    kesimpulan: {
      Ranking: number;
      Skor: string | number;
      Status?: string;
    };
  } | null;
}

const getPerformanceCategory = (score: number): {
  label: string;
  bsColor: "blue" | "emerald" | "amber" | "rose";
  bgClass: string;
  textClass: string;
} => {
  if (score >= 90) {
    return {
      label: "Excellent",
      bsColor: "emerald",
      bgClass: "bg-emerald-100 dark:bg-emerald-900/30",
      textClass: "text-emerald-700 dark:text-emerald-400",
    };
  } else if (score >= 75) {
    return {
      label: "Satisfactory",
      bsColor: "blue",
      bgClass: "bg-blue-100 dark:bg-blue-900/30",
      textClass: "text-blue-700 dark:text-blue-400",
    };
  } else if (score >= 60) {
    return {
      label: "Average",
      bsColor: "amber",
      bgClass: "bg-amber-100 dark:bg-amber-900/30",
      textClass: "text-amber-700 dark:text-amber-400",
    };
  }
  return {
    label: "Needs Improvement",
    bsColor: "rose",
    bgClass: "bg-rose-100 dark:bg-rose-900/30",
    textClass: "text-rose-700 dark:text-rose-400",
  };
};

const formatCurrency = (value: string | number): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatNumber = (value: string | number, decimals = 4): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return num.toFixed(decimals);
};

const IndividualReportModal = ({ show, onClose, data }: IndividualReportProps) => {
  if (!data || !data.kesimpulan) return null;

  const skorValue = typeof data.kesimpulan.Skor === 'string'
    ? parseFloat(data.kesimpulan.Skor)
    : Number(data.kesimpulan.Skor);

  const finalScore = Number.isFinite(skorValue)
    ? (skorValue <= 1 ? skorValue * 100 : skorValue)
    : 0;

  const score = Number(finalScore.toFixed(2));
  const ranking = data.kesimpulan.Ranking;
  const status = data.kesimpulan.Status || data.metadata.Status || "Processed";

  const performanceCategory = getPerformanceCategory(score);
  const groups = data.rincian || [];
  const allItems = groups.flatMap((g) => g.items);
  const totalKPI = allItems.length;

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  if (!data || !data.kesimpulan) return null;

  const handlePrint = () => {
    const printContent = document.getElementById("printable-report");
    if (!printContent) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      window.print();
      return;
    }

    const stylesheets = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((r) => r.cssText).join("\n");
        } catch {
          return "";
        }
      })
      .join("\n");

    // Gunakan cloneNode(true) alih-alih innerHTML untuk mencegah XSS
    const clonedContent = printContent.cloneNode(true) as HTMLElement;

    printWindow.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Laporan Hasil Penilaian Kinerja - PT. Wira Buana Arum</title>
  <style>${stylesheets}</style>
  <style>
    @page { size: A4; margin: 15mm 20mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #12263a; background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-size: 11px;
    }
    table { border-collapse: collapse !important; width: 100%; }
    th, td { border: 1px solid #d7e1ea !important; padding: 6px 10px; }
    .bg-primary { background-color: #1f4f78 !important; color: #fff !important; }
    .text-primary { color: #1f4f78 !important; }
    .bg-gray-50 { background-color: #f2f6fa !important; }
    .bg-gray-100 { background-color: #edf3f8 !important; }
    .border-primary { border-color: #1f4f78 !important; }
    .border-gray-200 { border-color: #d7e1ea !important; }
    .bg-yellow-400 { background-color: #facc15 !important; }
  </style>
</head>
<body></body>
</html>`);
    printWindow.document.body.appendChild(clonedContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  return (
    <Modal show={show} onClose={onClose} size="5xl" className="print-modal">
      <Modal.Header className="print:hidden border-b border-border bg-slate-50 dark:bg-slate-900/30">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Icon icon="solar:document-text-bold" className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Laporan Penilaian Kinerja</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">PT. Wira Buana Arum - HRIS System</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={status === "Final" ? "emerald" : "amber"} className="text-xs font-semibold text-[10px] px-3 py-1">
            {status}
          </Badge>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <Icon icon="solar:close-circle-bold" className="h-5 w-5 text-slate-400" />
          </button>
        </div>
      </Modal.Header>
      <Modal.Body className="p-0 bg-slate-50 dark:bg-slate-900/50 overflow-y-auto max-h-[85vh]">
        <div id="printable-report" className="p-6 sm:p-8 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-inter">

          {/* ── Header Dokumen ── */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <Icon icon="solar:buildings-2-bold" className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">PT. Wira Buana Arum</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Human Resource Information System</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-base font-bold text-primary">Laporan Penilaian Kinerja</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Dokumen Internal - Bagian SDM</p>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-primary via-slate-200 dark:via-slate-700 to-slate-200 dark:to-slate-700" />
          </div>

          {/* ── Executive Summary Card ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Score Card */}
            <div className={`rounded-xl p-5 border-2 ${performanceCategory.bgClass.replace('dark:bg-', 'dark:border-')} border-${performanceCategory.bsColor}-400`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Indeks Skor Akhir
                </span>
                <Icon icon={`solar:star-${performanceCategory.bsColor}-bold`} className="h-5 w-5 opacity-80" />
              </div>
              <div className="text-center">
                <span className="block text-4xl font-black text-primary">{score}</span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">/ 100</span>
              </div>
              <div className="mt-4 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r from-${performanceCategory.bsColor}-600 to-${performanceCategory.bsColor}-400 rounded-full transition-all duration-500`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <div className={`inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${performanceCategory.bgClass} ${performanceCategory.textClass}`}>
                <div className="flex items-center gap-1.5">
                  <Icon icon="solar:check-circle-bold" className="h-3 w-3" />
                  {performanceCategory.label}
                </div>
              </div>
            </div>

            {/* Ranking Card */}
            <div className={`rounded-xl p-5 border-2 bg-slate-100 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Peringkat
                </span>
                <Icon icon={`solar:medal-${ranking <= 3 ? 'gold' : 'silver'}-bold`} className="h-5 w-5 text-slate-400" />
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Rank</span>
                  <span className="text-5xl font-black text-slate-800 dark:text-white leading-none">{ranking}</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium">dari total karyawan terbaik</p>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                <Icon icon="solar:users-group-bold" className="h-3.5 w-3.5" />
                <span>{totalKPI}评估项已评分</span>
              </div>
            </div>

            {/* KPI Breakdown Card */}
            <div className="rounded-xl p-5 border-2 bg-slate-100 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  总体概况
                </span>
                <Icon icon={`solar:radar-bold`} className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">已完成评估</span>
                  <span className="text-sm font-bold text-primary">{groups.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">评估指标总数</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{totalKPI}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">评估期间</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-white">{data.metadata.Periode}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Employee & Period Info ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-primary px-4 py-3 flex items-center gap-2.5">
                <Icon icon="solar:user-bold" className="h-4 w-4 text-white/90" />
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-white">员工信息</h3>
              </div>
              <div className="p-4 space-y-2.5">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">姓名</span>
                  <div className="text-right min-w-0">
                    <span className="text-sm font-bold text-slate-800 dark:text-white block truncate">{data.metadata.Nama}</span>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">工号</span>
                  <div className="text-right min-w-0">
                    <span className="text-sm font-mono font-bold text-primary">{data.metadata.NIK}</span>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">评估周期</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{data.metadata.Periode}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-primary px-4 py-3 flex items-center gap-2.5">
                <Icon icon="solar:calendar-bold" className="h-4 w-4 text-white/90" />
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-white">评估周期信息</h3>
              </div>
              <div className="p-4 space-y-2.5">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">评估年度</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{data.metadata.Tahun}</span>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">评估状态</span>
                  <Badge color={status === "Final" ? "emerald" : "amber"} className="text-xs font-semibold text-[10px] px-2.5 py-1 h-auto ml-auto">
                    {status}
                  </Badge>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">创建日期</span>
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{today}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── KPI Details ── */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">详细评估指标</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{groups.length} 组 · {totalKPI} 项</span>
              </div>
            </div>

            <div className="space-y-4">
              {groups.map((grp, gIdx) => (
                <div key={gIdx} className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="bg-slate-800 dark:bg-slate-700/80 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                        {gIdx + 1}
                      </span>
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-100">{grp.group}</h4>
                    </div>
                    <Badge color="slate" className="text-xs font-semibold text-[10px] px-2.5 py-1 h-auto">
                      {grp.items.length} 项评估
                    </Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase tracking-wider">
                          <th className="p-2.5 text-center border-b border-r border-slate-200 dark:border-slate-600 font-semibold text-slate-600 dark:text-slate-300 w-12">#</th>
                          <th className="p-2.5 text-left border-b border-r border-slate-200 dark:border-slate-600 font-semibold text-slate-600 dark:text-slate-300">评估指标</th>
                          <th className="p-2.5 text-center border-b border-r border-slate-200 dark:border-slate-600 font-semibold text-slate-600 dark:text-slate-300 w-32">目标</th>
                          <th className="p-2.5 text-center border-b border-r border-slate-200 dark:border-slate-600 font-semibold text-slate-600 dark:text-slate-300 w-28">实际结果</th>
                          <th className="p-2.5 text-center border-b border-slate-200 dark:border-slate-600 font-semibold text-slate-600 dark:text-slate-300 w-16">单位</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grp.items.map((item, idx) => {
                          const isCurrency =
                            typeof item.Realisasi === "string" &&
                            (item.Satuan === "Rp" || parseFloat(item.Realisasi) > 1000);
                          const displayValue = isCurrency
                            ? `Rp ${formatCurrency(item.Realisasi).replace(/\./g, "")}`
                            : formatNumber(item.Realisasi, item.Satuan === "%" ? 1 : 2);
                          const targetDisplay = item.Target != null
                            ? (item.Satuan === "%" ? `${parseFloat(String(item.Target)).toFixed(1)}%` : formatNumber(item.Target, 2))
                            : "-";

                          const calculationProgress = (typeof item.Realisasi === 'number' && typeof item.Target === 'number')
                            ? Math.min(((item.Realisasi / item.Target) * 100), 100)
                            : null;

                          return (
                            <tr key={idx} className={idx % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50 dark:bg-slate-700/20 border-t border-slate-100 dark:border-slate-600/30"}>
                              <td className="p-2.5 text-center border-r border-slate-200 dark:border-slate-600 font-mono text-slate-400 dark:text-slate-500">
                                {String(idx + 1).padStart(2, "0")}
                              </td>
                              <td className="p-2.5 border-r border-slate-200 dark:border-slate-600 font-medium text-slate-800 dark:text-slate-200">
                                <div className="font-bold">{item.Kriteria}</div>
                              </td>
                              <td className="p-2.5 border-r border-slate-200 dark:border-slate-600 text-center">
                                <div className="font-mono text-slate-500 dark:text-slate-400">{targetDisplay}</div>
                              </td>
                              <td className="p-2.5 border-r border-slate-200 dark:border-slate-600">
                                <div className="font-bold text-primary font-mono">
                                  {displayValue}
                                </div>
                                {calculationProgress !== null && (
                                  <div className="mt-1.5 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full bg-primary rounded-full transition-all duration-500`}
                                      style={{ width: `${calculationProgress}%` }}
                                    />
                                  </div>
                                )}
                              </td>
                              <td className="p-2.5 text-center text-slate-500 dark:text-slate-400 font-medium">
                                <span className={`px-2 py-1 rounded font-semibold text-[10px] ${
                                  item.Satuan === "%"
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    : item.Satuan === "Rp"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300"
                                }`}>
                                  {item.Satuan}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Overall Performance Rating ── */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-1.5 w-1.5 bg-primary rounded-full" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">评估结果总结</h3>
            </div>
            <div className="rounded-xl border-2 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/30 border-primary/30 p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Icon icon={`solar:chart-big-bed-bold`} className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">整体评分</p>
                      <p className="text-base font-bold text-slate-800 dark:text-white">共计 {totalKPI} 个评估指标</p>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-blue-600 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">评分范围: 0 - 100</span>
                    <span className="font-bold text-primary">{score} 分</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`text-center px-6 py-4 rounded-xl border-2 ${performanceCategory.bgClass.replace('dark:bg-', 'dark:border-')} border-${performanceCategory.bsColor}-400`}>
                    <Icon icon={`solar:star-${performanceCategory.bsColor}-bold`} className="h-8 w-8 mb-2 opacity-80" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">评分级别</span>
                    <span className="text-2xl font-black ${performanceCategory.textClass}">{performanceCategory.label}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Signatures ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <Icon icon="solar:pen-bold" className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">评估人</h3>
              </div>
              <div className="border-t border-dashed border-slate-300 dark:border-slate-600 pt-3 mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center shrink-0">
                    <Icon icon="solar:user-circle-bold" className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                      {data.metadata.DibuatOleh?.split("(")[0].trim() || "________________"}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                      {data.metadata.DibuatOleh?.includes("(")
                        ? data.metadata.DibuatOleh.split("(")[1].replace(")", "").trim()
                        : "Head of Department"}
                    </p>
                  </div>
                </div>
                <div className="h-16 border-b-2 border-slate-800 dark:border-slate-600 rounded-md"></div>
              </div>
            </div>

            <div className="rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <Icon icon="solar:verified-check-bold" className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">审核人</h3>
              </div>
              <div className="border-t border-dashed border-slate-300 dark:border-slate-600 pt-3 mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center shrink-0">
                    <Icon icon="solar:check-circle-bold" className="h-6 w-6 text-primary dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                      {data.metadata.DisetujuiOleh?.split("(")[0].trim() || (data.metadata.Status === "Final" ? "系统验证" : "________________")}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                      {data.metadata.DisetujuiOleh?.includes("(")
                        ? data.metadata.DisetujuiOleh.split("(")[1].replace(")", "").trim()
                        : data.metadata.Status === "Final" ? "HR System" : "Manager"}
                    </p>
                  </div>
                  {status === "Final" && (
                    <Badge color="emerald" className="ml-2">
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="h-16 border-b-2 border-slate-800 dark:border-slate-600 rounded-md"></div>
              </div>
            </div>
          </div>

          {/* ── Document Footer ── */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-3">
                <Icon icon="solar:calendar-check-bold" className="h-4 w-4" />
                <span>评估日期: {today}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span>DocID:</span>
                <span className="font-bold text-primary">HR/SPK/{data.metadata.Tahun}/{data.metadata.NIK}</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon icon="solar:authenticator-bold" className="h-4 w-4" />
                <span>内部文档 - HR Department</span>
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 15mm 20mm;
            }
            html, body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: white !important;
              overflow: visible !important;
            }
            #__next {
              display: none !important;
            }
            body > div {
              display: block !important;
            }
            [role="dialog"],
            [role="dialog"] > div,
            .fixed.inset-0 {
              position: static !important;
              background: none !important;
              overflow: visible !important;
              display: block !important;
            }
            .print-modal {
              position: static !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              background: white !important;
              display: block !important;
            }
            #printable-report {
              padding: 0 !important;
              margin: 0 !important;
            }
            .print\:hidden {
              display: none !important;
            }
            table {
              border-collapse: collapse !important;
            }
            th, td {
              border: 1px solid #d7e1ea !important;
            }
            .bg-primary {
              background-color: #1f4f78 !important;
            }
            .text-primary {
              color: #1f4f78 !important;
            }
            .border-primary {
              border-color: #1f4f78 !important;
            }
            .bg-gradient-to-r {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}</style>
      </Modal.Body>
      <Modal.Footer className="print:hidden flex flex-col sm:flex-row gap-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <Button color="primary" onClick={handlePrint} className="w-full sm:w-auto font-medium">
          <Icon icon="solar:printer-bold" className="mr-2 h-5 w-5" />
          Cetak Sekarang
        </Button>
        <Button color="gray" onClick={onClose} className="w-full sm:w-auto font-medium">
          Tutup
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default IndividualReportModal;