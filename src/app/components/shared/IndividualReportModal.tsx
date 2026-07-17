"use client";
import React, { useMemo } from "react";
import { Modal, Badge, Button } from "flowbite-react";
import { Icon } from "@iconify/react";

/* --- Types --- */
interface ReportItem {
  No: number;
  Group: string;
  Kriteria: string;
  Tipe: string;
  Realisasi: number;
  Achievement: number;
  Predikat: string;
  PersentaseKeberhasilan: string;
  Satuan: string;
  Target: string;
}

interface IndividualReportProps {
  show: boolean;
  onClose: () => void;
  data: {
    title?: string;
    columns?: string[];
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
    data: ReportItem[];
    kesimpulan: {
      Ranking: number;
      Skor: string | number;
      Status?: string;
      NilaiYi?: number;
      nilai_yi?: number;
      PersentaseKPI?: number;
      persentase_kpi?: number;
    };
  } | null;
}

/* --- Helpers --- */
const getPredikatByPct = (pct: number): {
  label: string;
  bsColor: "emerald" | "blue" | "amber" | "orange" | "rose";
  bgClass: string;
  textClass: string;
  dotColor: string;
  barColor: string;
} => {
  if (pct >= 90) return { label: "Sangat Baik", bsColor: "emerald", bgClass: "bg-emerald-100 dark:bg-emerald-900/30", textClass: "text-emerald-700 dark:text-emerald-400", dotColor: "bg-emerald-500", barColor: "bg-emerald-500" };
  if (pct >= 80) return { label: "Baik", bsColor: "blue", bgClass: "bg-blue-100 dark:bg-blue-900/30", textClass: "text-blue-700 dark:text-blue-400", dotColor: "bg-blue-500", barColor: "bg-blue-500" };
  if (pct >= 70) return { label: "Cukup", bsColor: "amber", bgClass: "bg-amber-100 dark:bg-amber-900/30", textClass: "text-amber-700 dark:text-amber-400", dotColor: "bg-amber-500", barColor: "bg-amber-500" };
  if (pct >= 60) return { label: "Kurang", bsColor: "orange", bgClass: "bg-orange-100 dark:bg-orange-900/30", textClass: "text-orange-700 dark:text-orange-400", dotColor: "bg-orange-500", barColor: "bg-orange-500" };
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

/** Group flat data items by Group field */
const groupByGroup = (items: ReportItem[]): { name: string; items: ReportItem[] }[] => {
  const map = new Map<string, ReportItem[]>();
  for (const item of items) {
    const key = item.Group || "Lainnya";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
};

/* --- Component --- */
const IndividualReportModal = ({ show, onClose, data }: IndividualReportProps) => {
  if (!data || !data.kesimpulan) return null;

  const items = data.data || [];
  const grouped = useMemo(() => groupByGroup(items), [items]);

  /* Derived values */
  const skorRaw = toNum(data.kesimpulan.Skor);
  const yiValue = skorRaw > 0 && skorRaw <= 1 ? skorRaw : (skorRaw > 1 ? skorRaw / 100 : 0);

  const persentaseKPIRaw = data.kesimpulan.PersentaseKPI ?? data.kesimpulan.persentase_kpi;
  const persentaseKPI = persentaseKPIRaw !== undefined && persentaseKPIRaw !== null && toNum(persentaseKPIRaw) > 0
    ? toNum(persentaseKPIRaw) > 100 ? toNum(persentaseKPIRaw) : toNum(persentaseKPIRaw) * 100
    : (yiValue > 0 ? yiValue * 100 : 0);

  const score = Number(persentaseKPI.toFixed(2));
  const ranking = data.kesimpulan.Ranking;
  const status = data.kesimpulan.Status || data.metadata.Status || "Processed";
  const predikat = getPredikatByPct(score);

  const totalKPI = items.length;

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  /* Group metrics - computed from flat data */
  const groupMetrics = grouped.map((grp) => {
    const groupItems = grp.items;
    const avgAchievement = groupItems.length > 0
      ? groupItems.reduce((sum, item) => sum + Math.min(item.Achievement, 150), 0) / groupItems.length
      : 0;
    const cappedPct = Math.min(avgAchievement, 100);
    return {
      name: grp.name,
      pencapaian: cappedPct,
      itemCount: groupItems.length,
      predikat: getPredikatByPct(cappedPct),
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Ranking */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 rounded-xl p-4 text-center border border-primary/10">
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Ranking</p>
                <p className="text-3xl font-black text-primary">#{ranking}</p>
              </div>
              {/* Skor MOORA */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-800/30">
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Skor (MOORA)</p>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tabular-nums">{yiValue.toFixed(6)}</p>
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
                  const grpPct = gm.pencapaian;
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
                        <div className={`h-full rounded-full transition-all ${gm.predikat.barColor ?? "bg-primary"}`} style={{ width: `${Math.min(grpPct, 100)}%` }} />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Pencapaian</span>
                          <span className={`font-bold ${c.accent}`}>{grpPct > 0 ? grpPct.toFixed(1) + "%" : "-"}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Predikat</span>
                          <span className={`font-bold ${gm.predikat.textClass}`}>{gm.predikat.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Section 4: Detail KPI Table ── */}
          {items.length > 0 && (
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
                      <th className="px-3 py-2.5 text-center font-black uppercase tracking-wider text-[10px] text-gray-500">Tipe</th>
                      <th className="px-3 py-2.5 text-right font-black uppercase tracking-wider text-[10px] text-gray-500">Target</th>
                      <th className="px-3 py-2.5 text-right font-black uppercase tracking-wider text-[10px] text-gray-500">Realisasi</th>
                      <th className="px-3 py-2.5 text-right font-black uppercase tracking-wider text-[10px] text-gray-500">Pencapaian</th>
                      <th className="px-3 py-2.5 text-left font-black uppercase tracking-wider text-[10px] text-gray-500">Predikat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {items.map((item, idx) => {
                      const isCost = (item.Tipe || "").toLowerCase() === "cost";
                      const satuan = item.Satuan || "";
                      const targetNum = toNum(item.Target);
                      const realisasiNum = toNum(item.Realisasi);
                      const achievementPct = Math.min(item.Achievement, 999999);
                      const itemPredikat = getPredikatByPct(achievementPct);

                      return (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-3 py-2 text-gray-400 font-mono">{item.No}</td>
                          <td className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-100 max-w-[200px] truncate" title={item.Kriteria}>{item.Kriteria}</td>
                          <td className="px-3 py-2 text-gray-500 text-[10px]">{item.Group}</td>
                          <td className="px-3 py-2 text-center">
                            <Badge color={isCost ? "failure" : "success"} className="text-[9px] font-bold px-2 py-0.5">
                              {isCost ? "Cost" : "Benefit"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums">
                            {satuan.toLowerCase() === "rp" || satuan.toLowerCase() === "idr" ? formatCurrency(targetNum) : `${Number(targetNum).toLocaleString("id-ID")} ${satuan}`}
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums">
                            {satuan.toLowerCase() === "rp" || satuan.toLowerCase() === "idr" ? formatCurrency(realisasiNum) : `${Number(realisasiNum).toLocaleString("id-ID")} ${satuan}`}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${itemPredikat.dotColor}`} style={{ width: `${Math.min(achievementPct, 100)}%` }} />
                              </div>
                              <span className="font-bold tabular-nums">{item.PersentaseKeberhasilan || achievementPct.toFixed(1) + "%"}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`text-[10px] font-bold ${itemPredikat.textClass}`}>{item.Predikat || itemPredikat.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
