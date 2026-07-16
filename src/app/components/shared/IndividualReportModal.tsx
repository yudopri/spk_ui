"use client";
import React, { useState } from "react";
import { Modal, Badge, Button } from "flowbite-react";
import { Icon } from "@iconify/react";

/* --- Types --- */
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
      Divisi?: string;
      Jabatan?: string;
      Lokasi?: string;
    };
    rincian: Array<{
      group: string;
      group_id?: number;
      nama_grup?: string;
      BobotGroup?: number;
      bobot_group?: number;
      PencapaianGroup?: number;
      pencapaian_group?: number;
      KontribusiGroup?: number;
      kontribusi_group?: number;
      items: Array<{
        Kriteria: string;
        kriteria?: string;
        Realisasi: string | number;
        realisasi?: string | number;
        Satuan: string;
        satuan?: string;
        group_id?: number;
        nama_grup?: string;
        Target?: string | number;
        target?: string | number;
        BobotAHP?: number;
        bobot_ahp?: number;
        Bobot?: number;
        bobot?: number;
        Jenis?: string;
        jenis?: string;
        Tipe?: string;
        tipe?: string;
        Kontribusi?: number;
        kontribusi?: number;
        Pencapaian?: number;
        pencapaian?: number;
      }>;
    }>;
    kesimpulan: {
      Ranking: number;
      Skor: string | number;
      Status?: string;
      NilaiYi?: number;
      nilai_yi?: number;
      PersentaseKPI?: number;
      persentase_kpi?: number;
    };
    perhitungan?: {
      ahp_matrix?: number[][];
      ahp_group_matrix?: number[][];
      ahp_weights?: { nama: string; bobot: number }[];
      ahp_group_weights?: { nama: string; bobot: number }[];
      cr?: number;
      cr_group?: number;
      moora_normalization?: { kpi: string; nilai_normalisasi: number; tipe: string }[];
      moora_weighted?: { kpi: string; nilai_terbobot: number; tipe: string }[];
      yi_calculation?: { karyawan: string; yi: number };
    };
  } | null;
}

/* --- Helpers --- */
const getPredikat = (persentase: number): {
  label: string;
  bsColor: "emerald" | "blue" | "amber" | "orange" | "rose";
  bgClass: string;
  textClass: string;
  dotColor: string;
  barColor: string;
} => {
  if (persentase >= 90) return { label: "Sangat Baik", bsColor: "emerald", bgClass: "bg-emerald-100 dark:bg-emerald-900/30", textClass: "text-emerald-700 dark:text-emerald-400", dotColor: "bg-emerald-500", barColor: "bg-emerald-500" };
  if (persentase >= 80) return { label: "Baik", bsColor: "blue", bgClass: "bg-blue-100 dark:bg-blue-900/30", textClass: "text-blue-700 dark:text-blue-400", dotColor: "bg-blue-500", barColor: "bg-blue-500" };
  if (persentase >= 70) return { label: "Cukup", bsColor: "amber", bgClass: "bg-amber-100 dark:bg-amber-900/30", textClass: "text-amber-700 dark:text-amber-400", dotColor: "bg-amber-500", barColor: "bg-amber-500" };
  if (persentase >= 60) return { label: "Kurang", bsColor: "orange", bgClass: "bg-orange-100 dark:bg-orange-900/30", textClass: "text-orange-700 dark:text-orange-400", dotColor: "bg-orange-500", barColor: "bg-orange-500" };
  return { label: "Sangat Kurang", bsColor: "rose", bgClass: "bg-rose-100 dark:bg-rose-900/30", textClass: "text-rose-700 dark:text-rose-400", dotColor: "bg-rose-500", barColor: "bg-rose-500" };
};

const formatCurrency = (value: string | number): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
};

const formatNumber = (value: string | number, decimals = 4): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return num.toFixed(decimals);
};

const toNum = (v: any): number => {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
};
/* --- Component --- */
const IndividualReportModal = ({ show, onClose, data }: IndividualReportProps) => {
  const [showCalculation, setShowCalculation] = useState(false);

  if (!data || !data.kesimpulan) return null;

  /* Derived values */
  const skorRaw = toNum(data.kesimpulan.Skor);
  const yiRaw = data.kesimpulan.NilaiYi ?? data.kesimpulan.nilai_yi;
  const yiValue = yiRaw !== undefined && yiRaw !== null && toNum(yiRaw) > 0
    ? toNum(yiRaw)
    : (skorRaw > 0 && skorRaw <= 1 ? skorRaw : (skorRaw > 1 ? skorRaw / 100 : 0));

  const persentaseKPIRaw = data.kesimpulan.PersentaseKPI ?? data.kesimpulan.persentase_kpi;
  const persentaseKPI = persentaseKPIRaw !== undefined && persentaseKPIRaw !== null && toNum(persentaseKPIRaw) > 0
    ? toNum(persentaseKPIRaw) > 100 ? toNum(persentaseKPIRaw) : toNum(persentaseKPIRaw) * 100
    : (yiValue > 0 ? yiValue * 100 : 0);

  const score = Number(persentaseKPI.toFixed(2));
  const ranking = data.kesimpulan.Ranking;
  const status = data.kesimpulan.Status || data.metadata.Status || "Processed";
  const predikat = getPredikat(score);

  const groups = data.rincian || [];
  const allItems = groups.flatMap((g) => g.items);
  const totalKPI = allItems.length;

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  /* Group metrics */
  const groupMetrics = groups.map((grp) => {
    const items = grp.items || [];
    const bobotGroup = grp.BobotGroup ?? grp.bobot_group ?? null;
    const pencapaianGroup = grp.PencapaianGroup ?? grp.pencapaian_group ?? null;
    const kontribusiGroup = grp.KontribusiGroup ?? grp.kontribusi_group ?? null;

    let calculatedPencapaian = 0;
    let calculatedBobot = 0;
    let calculatedKontribusi = 0;
    let totalBobotItems = 0;

    items.forEach((item) => {
      const target = toNum(item.Target ?? item.target);
      const realisasi = toNum(item.Realisasi ?? item.realisasi);
      const bobot = toNum(item.BobotAHP ?? item.bobot_ahp ?? item.Bobot ?? item.bobot);
      const kontribusi = toNum(item.Kontribusi ?? item.kontribusi);
      totalBobotItems += bobot;

      if (target > 0) {
        const isCost = (item.Jenis || item.jenis || item.Tipe || item.tipe || "").toLowerCase() === "cost";
        const achievement = isCost ? Math.min(target / realisasi, 1) * 100 : Math.min(realisasi / target, 1) * 100;
        calculatedPencapaian += achievement * bobot;
      }
      calculatedKontribusi += kontribusi;
    });

    return {
      name: grp.group,
      bobot: bobotGroup ?? (totalBobotItems > 0 ? totalBobotItems : null),
      pencapaian: pencapaianGroup ?? (totalBobotItems > 0 ? calculatedPencapaian / totalBobotItems : null),
      kontribusi: kontribusiGroup ?? (calculatedKontribusi > 0 ? calculatedKontribusi : null),
      itemCount: items.length,
    };
  });

  /* Print handler */
  const handlePrint = () => {
    const printContent = document.getElementById("printable-report");
    if (!printContent) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) { window.print(); return; }

    const stylesheets = Array.from(document.styleSheets)
      .map((sheet) => { try { return Array.from(sheet.cssRules).map((r) => r.cssText).join("\n"); } catch { return ""; } })
      .join("\n");

    const clonedContent = printContent.cloneNode(true) as HTMLElement;
    clonedContent.querySelectorAll("[data-collapsible]").forEach((el) => {
      (el as HTMLElement).style.display = "block";
    });

    printWindow.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charSet="UTF-8" />
  <title>Laporan Hasil Penilaian Kinerja - ${data.metadata.Nama}</title>
  <style>
    @page { size: A4; margin: 15mm 20mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #12263a; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 11px; }
    table { border-collapse: collapse !important; width: 100%; }
    th, td { border: 1px solid #d7e1ea !important; padding: 6px 10px; }
    .bg-primary { background-color: #1f4f78 !important; color: #fff !important; }
    .text-primary { color: #1f4f78 !important; }
  </style>
</head>
<body></body>
</html>`);
    printWindow.document.body.appendChild(clonedContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
  };

  return (
    <Modal show={show} onClose={onClose} size="5xl" className="print-modal">
      {/* Modal Header */}
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
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
            <Icon icon="solar:close-circle-bold" className="h-5 w-5 text-slate-400" />
          </button>
        </div>
      </Modal.Header>

      {/* Modal Body */}
      <Modal.Body className="p-0" id="printable-report">
        <div className="divide-y divide-gray-100 dark:divide-gray-700">

          {/* ── Section 1: Informasi Karyawan ── */}
          <div className="p-6 bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-900/40 dark:to-blue-900/10">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="solar:user-bold" className="h-5 w-5 text-primary" />
              <h4 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Informasi Karyawan</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Nama", value: data.metadata.Nama, icon: "solar:user-circle-bold" },
                { label: "NIK", value: data.metadata.NIK, icon: "solar:hashtag-bold", mono: true },
                { label: "Divisi", value: data.metadata.Divisi || "-", icon: "solar:building-bold" },
                { label: "Jabatan", value: data.metadata.Jabatan || "-", icon: "solar:briefcase-bold" },
                { label: "Lokasi", value: data.metadata.Lokasi || "-", icon: "solar:map-point-bold" },
                { label: "Periode", value: `${data.metadata.Periode} (${data.metadata.Tahun})`, icon: "solar:calendar-bold" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2">
                  <Icon icon={item.icon} className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">{item.label}</p>
                    <p className={`text-sm font-semibold text-gray-800 dark:text-gray-100 ${item.mono ? "font-mono" : ""}`}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Section 2: Ringkasan Hasil ── */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="solar:chart-square-bold" className="h-5 w-5 text-primary" />
              <h4 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Ringkasan Hasil</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Ranking */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 rounded-xl p-4 text-center border border-primary/10">
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Ranking</p>
                <p className="text-3xl font-black text-primary">#{ranking}</p>
              </div>
              {/* Nilai Yi */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-800/30">
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Nilai Yi (MOORA)</p>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tabular-nums">{yiValue.toFixed(6)}</p>
              </div>
              {/* Pencapaian KPI */}
              <div className={`bg-gradient-to-br rounded-xl p-4 text-center border ${predikat.bgClass} border-current/10`}>
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Pencapaian KPI</p>
                <p className={`text-3xl font-black ${predikat.textClass} tabular-nums`}>{score.toFixed(1)}%</p>
              </div>
              {/* Predikat */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 text-center border border-slate-200 dark:border-slate-600">
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Predikat Kinerja</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${predikat.dotColor}`} />
                  <span className={`text-lg font-black ${predikat.textClass}`}>{predikat.label}</span>
                </div>
              </div>
            </div>
            {/* Status Badge */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-gray-500">Status Penilaian:</span>
              <Badge color={status === "Final" || status === "locked" ? "emerald" : status === "Reviewed" ? "success" : "amber"} className="text-xs font-semibold">
                {status}
              </Badge>
            </div>
          </div>

          {/* ── Section 3: Ringkasan Per Grup KPI ── */}
          {groupMetrics.length > 0 && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon icon="solar:folder-2-bold" className="h-5 w-5 text-primary" />
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Ringkasan Per Grup KPI</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {groupMetrics.map((gm, idx) => {
                  const grpPct = gm.pencapaian ?? 0;
                  const grpPredikat = getPredikat(grpPct);
                  const grpColors = [
                    { bg: "from-blue-500/10 to-blue-600/5", border: "border-blue-200 dark:border-blue-700/40", accent: "text-blue-600 dark:text-blue-400" },
                    { bg: "from-emerald-500/10 to-emerald-600/5", border: "border-emerald-200 dark:border-emerald-700/40", accent: "text-emerald-600 dark:text-emerald-400" },
                    { bg: "from-amber-500/10 to-amber-600/5", border: "border-amber-200 dark:border-amber-700/40", accent: "text-amber-600 dark:text-amber-400" },
                  ];
                  const c = grpColors[idx % grpColors.length];
                  return (
                    <div key={idx} className={`bg-gradient-to-br ${c.bg} rounded-xl p-4 border ${c.border}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-xs font-black uppercase tracking-wide text-gray-700 dark:text-gray-200 truncate">{gm.name}</h5>
                        <span className="text-[10px] text-gray-400">{gm.itemCount} KPI</span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mb-3">
                        <div className={`h-full rounded-full transition-all ${grpPredikat.barColor ?? "bg-primary"}`} style={{ width: `${Math.min(grpPct, 100)}%` }} />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Bobot Grup</span>
                          <span className={`font-bold ${c.accent}`}>{gm.bobot !== null ? (gm.bobot * 100).toFixed(1) + "%" : "-"}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Pencapaian</span>
                          <span className={`font-bold ${c.accent}`}>{grpPct > 0 ? grpPct.toFixed(1) + "%" : "-"}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Kontribusi</span>
                          <span className={`font-bold ${c.accent}`}>{gm.kontribusi !== null ? (gm.kontribusi * 100).toFixed(2) + "%" : "-"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Section 4: Detail KPI Table ── */}
          {allItems.length > 0 && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon icon="solar:documents-bold" className="h-5 w-5 text-primary" />
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Detail KPI</h4>
                <span className="text-xs text-gray-400 ml-auto">{totalKPI} item</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60">
                      <th className="px-3 py-2.5 text-left font-black uppercase tracking-wider text-[10px] text-gray-500">#</th>
                      <th className="px-3 py-2.5 text-left font-black uppercase tracking-wider text-[10px] text-gray-500">KPI</th>
                      <th className="px-3 py-2.5 text-left font-black uppercase tracking-wider text-[10px] text-gray-500">Grup</th>
                      <th className="px-3 py-2.5 text-center font-black uppercase tracking-wider text-[10px] text-gray-500">Bobot AHP</th>
                      <th className="px-3 py-2.5 text-center font-black uppercase tracking-wider text-[10px] text-gray-500">Jenis</th>
                      <th className="px-3 py-2.5 text-right font-black uppercase tracking-wider text-[10px] text-gray-500">Target</th>
                      <th className="px-3 py-2.5 text-right font-black uppercase tracking-wider text-[10px] text-gray-500">Realisasi</th>
                      <th className="px-3 py-2.5 text-right font-black uppercase tracking-wider text-[10px] text-gray-500">Pencapaian</th>
                      <th className="px-3 py-2.5 text-right font-black uppercase tracking-wider text-[10px] text-gray-500">Kontribusi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {allItems.map((item, idx) => {
                      const target = toNum(item.Target ?? item.target);
                      const realisasi = toNum(item.Realisasi ?? item.realisasi);
                      const bobot = toNum(item.BobotAHP ?? item.bobot_ahp ?? item.Bobot ?? item.bobot);
                      const kontribusi = toNum(item.Kontribusi ?? item.kontribusi);
                      const pencapaian = toNum(item.Pencapaian ?? item.pencapaian);
                      const jenis = (item.Jenis || item.jenis || item.Tipe || item.tipe || "").toLowerCase();
                      const isCost = jenis === "cost";
                      const satuan = item.Satuan || item.satuan || "";

                      let achievementPct = 0;
                      if (target > 0) {
                        achievementPct = isCost ? Math.min(target / realisasi, 1) * 100 : Math.min(realisasi / target, 1) * 100;
                      }

                      return (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-3 py-2 text-gray-400 font-mono">{idx + 1}</td>
                          <td className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-100 max-w-[200px] truncate" title={item.Kriteria || item.kriteria || ""}>{item.Kriteria || item.kriteria || "-"}</td>
                          <td className="px-3 py-2 text-gray-500 text-[10px]">{item.nama_grup || (item as any).group || "-"}</td>
                          <td className="px-3 py-2 text-center font-mono tabular-nums">{formatNumber(bobot)}</td>
                          <td className="px-3 py-2 text-center">
                            <Badge color={isCost ? "failure" : "success"} className="text-[9px] font-bold px-2 py-0.5">
                              {isCost ? "Cost" : "Benefit"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums">
                            {satuan?.toLowerCase() === "rp" || satuan?.toLowerCase() === "idr" ? formatCurrency(target) : `${Number(target).toLocaleString("id-ID")} ${satuan}`}
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums">
                            {satuan?.toLowerCase() === "rp" || satuan?.toLowerCase() === "idr" ? formatCurrency(realisasi) : `${Number(realisasi).toLocaleString("id-ID")} ${satuan}`}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${getPredikat(achievementPct).dotColor}`} style={{ width: `${Math.min(achievementPct, 100)}%` }} />
                              </div>
                              <span className="font-bold tabular-nums">{achievementPct.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-primary tabular-nums">{(kontribusi * 100).toFixed(2)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Section 5: Detail Perhitungan (Collapsible) ── */}
          {data.perhitungan && (
            <div className="p-6" data-collapsible>
              <button
                onClick={() => setShowCalculation(!showCalculation)}
                className="flex items-center gap-2 w-full text-left group"
              >
                <Icon icon="solar:calculator-bold" className="h-5 w-5 text-primary" />
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Detail Perhitungan AHP-MOORA</h4>
                <Icon
                  icon={showCalculation ? "solar:alt-arrow-up-bold" : "solar:alt-arrow-down-bold"}
                  className="h-4 w-4 text-gray-400 ml-auto transition-transform"
                />
              </button>

              {showCalculation && (
                <div className="mt-4 space-y-6">
                  {/* AHP Group Matrix */}
                  {data.perhitungan.ahp_group_matrix && data.perhitungan.ahp_group_weights && (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
                        <h5 className="text-xs font-bold text-gray-700 dark:text-gray-200">Matriks Perbandingan Berpasangan Antar Grup KPI (AHP)</h5>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr>
                              <th className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left font-bold text-gray-600"></th>
                              {data.perhitungan.ahp_group_weights.map((w, i) => (
                                <th key={i} className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-center font-bold text-gray-600">{w.nama}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.perhitungan.ahp_group_matrix.map((row, i) => (
                              <tr key={i}>
                                <td className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800">{data.perhitungan!.ahp_group_weights![i].nama}</td>
                                {row.map((val, j) => (
                                  <td key={j} className={`px-2 py-1.5 border border-gray-200 dark:border-gray-700 text-center font-mono ${i === j ? "bg-primary/5 text-primary font-bold" : ""}`}>
                                    {typeof val === "number" ? val.toFixed(4) : val}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                          {data.perhitungan.ahp_group_weights.map((w, i) => (
                            <span key={i}><strong>{w.nama}:</strong> {w.bobot.toFixed(4)}</span>
                          ))}
                        </div>
                        {data.perhitungan.cr_group !== undefined && (
                          <div className={`mt-2 text-xs font-bold ${data.perhitungan.cr_group <= 0.1 ? "text-emerald-600" : "text-rose-600"}`}>
                            CR Grup: {data.perhitungan.cr_group.toFixed(4)} {data.perhitungan.cr_group <= 0.1 ? "✓ Konsisten" : "✗ Tidak Konsisten"}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AHP KPI Matrix */}
                  {data.perhitungan.ahp_matrix && data.perhitungan.ahp_weights && (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
                        <h5 className="text-xs font-bold text-gray-700 dark:text-gray-200">Matriks Perbandingan Berpasangan Antar KPI (AHP)</h5>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr>
                              <th className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left font-bold text-gray-600"></th>
                              {data.perhitungan.ahp_weights.map((w, i) => (
                                <th key={i} className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-center font-bold text-gray-600 max-w-[80px] truncate" title={w.nama}>{w.nama}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.perhitungan.ahp_matrix.map((row, i) => (
                              <tr key={i}>
                                <td className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 max-w-[80px] truncate" title={data.perhitungan!.ahp_weights![i].nama}>{data.perhitungan!.ahp_weights![i].nama}</td>
                                {row.map((val, j) => (
                                  <td key={j} className={`px-2 py-1.5 border border-gray-200 dark:border-gray-700 text-center font-mono ${i === j ? "bg-primary/5 text-primary font-bold" : ""}`}>
                                    {typeof val === "number" ? val.toFixed(4) : val}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-gray-500">
                          {data.perhitungan.ahp_weights.map((w, i) => (
                            <span key={i}><strong>{w.nama}:</strong> {w.bobot.toFixed(4)}</span>
                          ))}
                        </div>
                        {data.perhitungan.cr !== undefined && (
                          <div className={`mt-2 text-xs font-bold ${data.perhitungan.cr <= 0.1 ? "text-emerald-600" : "text-rose-600"}`}>
                            CR: {data.perhitungan.cr.toFixed(4)} {data.perhitungan.cr <= 0.1 ? "✓ Konsisten" : "✗ Tidak Konsisten"}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* MOORA Normalization */}
                  {data.perhitungan.moora_normalization && data.perhitungan.moora_normalization.length > 0 && (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
                        <h5 className="text-xs font-bold text-gray-700 dark:text-gray-200">Matriks Normalisasi MOORA</h5>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr>
                              <th className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left font-bold text-gray-600">KPI</th>
                              <th className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-center font-bold text-gray-600">Nilai Normalisasi</th>
                              <th className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-center font-bold text-gray-600">Tipe</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.perhitungan.moora_normalization.map((row, i) => (
                              <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                <td className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 font-semibold">{row.kpi}</td>
                                <td className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 text-center font-mono">{row.nilai_normalisasi.toFixed(4)}</td>
                                <td className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 text-center">
                                  <Badge color={row.tipe.toLowerCase() === "cost" ? "failure" : "success"} className="text-[9px] font-bold">{row.tipe}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* MOORA Weighted */}
                  {data.perhitungan.moora_weighted && data.perhitungan.moora_weighted.length > 0 && (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
                        <h5 className="text-xs font-bold text-gray-700 dark:text-gray-200">Matriks Terbobot MOORA</h5>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr>
                              <th className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-left font-bold text-gray-600">KPI</th>
                              <th className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-center font-bold text-gray-600">Nilai Terbobot</th>
                              <th className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-center font-bold text-gray-600">Tipe</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.perhitungan.moora_weighted.map((row, i) => (
                              <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                <td className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 font-semibold">{row.kpi}</td>
                                <td className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 text-center font-mono">{row.nilai_terbobot.toFixed(4)}</td>
                                <td className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 text-center">
                                  <Badge color={row.tipe.toLowerCase() === "cost" ? "failure" : "success"} className="text-[9px] font-bold">{row.tipe}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Yi Calculation */}
                  {data.perhitungan.yi_calculation && (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
                        <h5 className="text-xs font-bold text-gray-700 dark:text-gray-200">Perhitungan Nilai Yi</h5>
                      </div>
                      <div className="p-4">
                        <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                          <p className="text-xs text-gray-500 mb-1">Formula: Yi = Σ(Benefit) − Σ(Cost)</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-gray-500">Yi =</span>
                            <span className="text-lg font-black text-primary font-mono tabular-nums">{data.perhitungan.yi_calculation.yi.toFixed(6)}</span>
                            <span className="text-xs text-gray-400">({data.perhitungan.yi_calculation.karyawan})</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal.Body>

      {/* Modal Footer */}
      <Modal.Footer className="print:hidden border-t border-border bg-slate-50 dark:bg-slate-900/30">
        <div className="flex items-center justify-between w-full">
          <p className="text-[10px] text-gray-400">Dicetak: {today} | {data.metadata.DibuatOleh ? `Dibuat oleh: ${data.metadata.DibuatOleh}` : ""}</p>
          <div className="flex gap-2">
            <Button color="gray" size="sm" onClick={onClose}>
              <Icon icon="solar:close-circle-bold" className="mr-1 h-4 w-4" /> Tutup
            </Button>
            <Button color="dark" size="sm" onClick={handlePrint}>
              <Icon icon="solar:printer-bold" className="mr-1 h-4 w-4" /> Cetak / PDF
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default IndividualReportModal;
