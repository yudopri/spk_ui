"use client";
import React from "react";
import { Table, Modal, Button } from "flowbite-react";
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
      Kriteria: string;
      Nilai: string | number;
      Satuan: string;
      group_id?: number;
      nama_grup?: string;
      bobot_ahp?: number;
      bobot_grup?: number;
    }>;
    kesimpulan: {
      Ranking: number;
      Skor: string | number;
    };
  } | null;
}

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

  const skorValue = typeof data.kesimpulan.Skor === 'string'
    ? parseFloat(data.kesimpulan.Skor)
    : Number(data.kesimpulan.Skor);

  const finalScore = Number.isFinite(skorValue)
    ? (skorValue <= 1 ? skorValue * 100 : skorValue)
    : 0;

  const score = Number(finalScore.toFixed(2));

  // Group rincian by group_id
  const groupedRincian = data.rincian.reduce((acc, item) => {
    const groupKey = item.group_id ?? 0;
    const groupName = item.nama_grup || "Lainnya";
    if (!acc[groupKey]) {
      acc[groupKey] = { name: groupName, items: [] };
    }
    acc[groupKey].items.push(item);
    return acc;
  }, {} as Record<number, { name: string; items: typeof data.rincian }>);

  const groupEntries = Object.entries(groupedRincian).map(([id, val]) => ({
    id: Number(id),
    name: val.name,
    items: val.items,
  }));

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <Modal show={show} onClose={onClose} size="5xl" className="print-modal">
      <Modal.Header className="print:hidden border-b border-border">
        <div className="flex items-center gap-2">
          <Icon icon="solar:document-text-bold" className="h-5 w-5 text-primary" />
          <span className="font-bold">Laporan Penilaian Kinerja Individual</span>
        </div>
      </Modal.Header>
      <Modal.Body className="p-0">
        <div id="printable-report" className="p-6 sm:p-8 md:p-10 bg-white text-bodytext font-sans leading-relaxed">

          {/* ── HEADER RESMI ── */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Icon icon="solar:buildings-2-bold" className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-lg sm:text-xl font-black text-dark uppercase tracking-tight leading-none">
                  PT. Wira Buana Arum
                </h1>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                  Human Resource Information System
                </p>
              </div>
            </div>
            <div className="w-20 h-[3px] bg-primary mx-auto my-4 rounded-full" />
            <h2 className="text-sm sm:text-base font-black text-primary uppercase tracking-wide">
              Laporan Hasil Penilaian Kinerja Karyawan
            </h2>
            <p className="text-[10px] text-muted mt-1 font-medium">
              Dokumen Internal — Bagian Sumber Daya Manusia
            </p>
          </div>

          {/* ── INFO KARYAWAN & PERIODE ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-primary px-4 py-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white">
                  Data Karyawan
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted">Nama Lengkap</span>
                  <span className="text-xs font-black text-dark uppercase text-right ml-4">: {data.metadata.Nama}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted">Nomor Induk Karyawan</span>
                  <span className="text-xs font-bold text-dark font-mono tracking-wide text-right ml-4">: {data.metadata.NIK}</span>
                </div>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-primary px-4 py-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white">
                  Informasi Periode
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted">Periode Penilaian</span>
                  <span className="text-xs font-black text-dark uppercase text-right ml-4">: {data.metadata.Periode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted">Tahun Buku</span>
                  <span className="text-xs font-bold text-dark text-right ml-4">: {data.metadata.Tahun}</span>
                </div>
                {data.metadata.Status && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted">Status Dokumen</span>
                    <span className="text-xs font-bold text-right ml-4">:{" "}
                      <span className={`uppercase ${data.metadata.Status === "Final" ? "text-success" : "text-warning"}`}>
                        {data.metadata.Status}
                      </span>
                    </span>
                  </div>
                )}
                {data.metadata.DibuatOleh && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted">Dibuat Oleh</span>
                    <span className="text-xs font-bold text-dark text-right ml-4">: {data.metadata.DibuatOleh}</span>
                  </div>
                )}
                {data.metadata.DisetujuiOleh && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted">Disetujui Oleh</span>
                    <span className="text-xs font-bold text-dark text-right ml-4">: {data.metadata.DisetujuiOleh}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RINCIAN PENILAIAN PER GRUP ── */}
          <div className="mb-8 space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-widest text-dark">
                Rincian Penilaian per Grup KPI
              </h3>
            </div>

            {groupEntries.map((group, gIdx) => (
              <div key={group.id} className="border border-border rounded-lg overflow-hidden">
                <div className="bg-primary px-4 py-2 flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-white">
                    {group.name}
                  </h4>
                  <span className="text-[9px] font-bold text-white/70">
                    Grup {gIdx + 1}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-dark">
                        <th className="p-2.5 text-center border-b border-r border-border w-10 font-bold text-[10px] uppercase tracking-widest">#</th>
                        <th className="p-2.5 text-left border-b border-r border-border font-bold text-[10px] uppercase tracking-widest">Kriteria Penilaian</th>
                        <th className="p-2.5 text-center border-b border-r border-border w-28 font-bold text-[10px] uppercase tracking-widest">Nilai</th>
                        <th className="p-2.5 text-center border-b border-border w-16 font-bold text-[10px] uppercase tracking-widest">Satuan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item, idx) => {
                        const isCurrency =
                          typeof item.Nilai === "string" &&
                          (item.Satuan === "Rp" || parseFloat(item.Nilai) > 1000);
                        const displayValue = isCurrency
                          ? formatCurrency(item.Nilai)
                          : formatNumber(item.Nilai, item.Satuan === "%" ? 1 : 4);

                        return (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="p-2.5 text-center border-b border-r border-border text-muted font-mono">
                              {String(idx + 1).padStart(2, "0")}
                            </td>
                            <td className="p-2.5 border-b border-r border-border font-bold text-dark uppercase text-[11px] tracking-tight">
                              {item.Kriteria}
                            </td>
                            <td className="p-2.5 text-center border-b border-r border-border font-black text-dark">
                              {displayValue}
                            </td>
                            <td className="p-2.5 text-center border-b border-border text-muted font-medium">
                              {item.Satuan}
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

          {/* ── KESIMPULAN / HASIL AKHIR ── */}
          <div className="border-t-2 border-primary pt-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-widest text-dark">
                Kesimpulan Penilaian
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 border-2 border-primary rounded-lg p-4 bg-primary/5 text-center">
                <span className="block text-[9px] font-bold uppercase text-muted tracking-widest mb-1">
                  Indeks Skor Akhir (Yi)
                </span>
                <span className="block text-3xl font-black text-primary leading-none">
                  {score}
                </span>
              </div>
              <div className="flex-1 border-2 border-primary rounded-lg p-4 bg-yellow-400 text-center">
                <span className="block text-[9px] font-bold uppercase text-dark tracking-widest mb-1">
                  Peringkat Karyawan
                </span>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[10px] font-bold text-dark/50 uppercase">Rank</span>
                  <span className="text-3xl font-black text-dark leading-none">
                    {data.kesimpulan.Ranking}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── TANDA TANGAN ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10 pt-6 border-t border-border">
            <div>
              <p className="text-[10px] font-bold uppercase text-muted tracking-widest mb-1">
                Dinilai Oleh:
              </p>
              <p className="text-[11px] font-bold text-dark mb-12">
                Head of Department / Atasan Langsung
              </p>
              <div className="border-t border-dark pt-2">
                <p className="text-xs font-black text-dark uppercase">
                  {data.metadata.DibuatOleh?.split("(")[0].trim() || "________________"}
                </p>
                <p className="text-[9px] font-bold text-muted uppercase tracking-widest">
                  {data.metadata.DibuatOleh?.includes("(")
                    ? data.metadata.DibuatOleh.split("(")[1].replace(")", "").trim()
                    : "Jabatan"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase text-muted tracking-widest mb-1">
                Disetujui Oleh:
              </p>
              <p className="text-[11px] font-bold text-dark mb-12">
                General Manager / Pimpinan Unit
              </p>
              <div className="border-t border-dark pt-2">
                <p className="text-xs font-black text-dark uppercase">
                  {data.metadata.DisetujuiOleh?.split("(")[0].trim() || (data.metadata.Status === "Final" ? "VERIFIED SYSTEM" : "________________")}
                </p>
                <p className="text-[9px] font-bold text-muted uppercase tracking-widest">
                  {data.metadata.DisetujuiOleh?.includes("(")
                    ? data.metadata.DisetujuiOleh.split("(")[1].replace(")", "").trim()
                    : data.metadata.Status === "Final" ? "Sistem" : "Jabatan"}
                </p>
              </div>
            </div>
          </div>

          {/* ── FOOTER DOKUMEN ── */}
          <div className="mt-8 pt-4 border-t border-border flex flex-col sm:flex-row justify-between items-center text-[8px] text-muted font-mono uppercase gap-2">
            <div className="flex gap-3">
              <span>Dicetak: {today}</span>
              <span className="text-border">|</span>
              <span>Ref: HR/SPK/{data.metadata.Tahun}/{data.metadata.NIK}</span>
            </div>
            <div className="print:hidden italic font-sans text-primary text-[10px] font-medium">
              * Klik &quot;Cetak Sekarang&quot; untuk mencetak dokumen resmi
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
            .print\\:hidden {
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
              color: #fff !important;
            }
            .bg-yellow-400 {
              background-color: #facc15 !important;
            }
            .bg-gray-50 {
              background-color: #f2f6fa !important;
            }
          }
        `}</style>
      </Modal.Body>
      <Modal.Footer className="print:hidden flex flex-col sm:flex-row gap-2 border-t border-border">
        <Button color="primary" onClick={handlePrint} className="w-full sm:w-auto">
          <Icon icon="solar:printer-bold" className="mr-2 h-5 w-5" />
          Cetak Sekarang
        </Button>
        <Button color="gray" onClick={onClose} className="w-full sm:w-auto">
          Tutup
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default IndividualReportModal;