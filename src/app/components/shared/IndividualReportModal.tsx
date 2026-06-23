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
    window.print();
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

  return (
    <Modal show={show} onClose={onClose} size="5xl" className="print-modal">
      <Modal.Header className="print:hidden">
        <div className="flex items-center gap-2">
          <Icon icon="solar:document-text-bold" className="h-5 w-5 text-primary" />
          <span>Laporan Hasil Penilaian Individual</span>
        </div>
      </Modal.Header>
      <Modal.Body className="p-0">
        <div id="printable-report" className="p-6 sm:p-8 md:p-10 bg-white text-black font-sans leading-relaxed">
          {/* Header - Industrial Formal Style */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b-4 border-double border-gray-900 pb-6">
            <div className="text-left">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter leading-none mb-1">
                Laporan Hasil Penilaian Kinerja
              </h1>
              <p className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-widest leading-none">
                Performance Evaluation Report
              </p>
            </div>
            <div className="text-right flex flex-col items-start md:items-end">
              <div className="bg-gray-900 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-2">
                Confidential Document
              </div>
              <p className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase font-bold">
                Doc Ref: {data.metadata.Tahun}/{data.metadata.Periode.replace(/\s+/g, "")}/{data.metadata.NIK}
              </p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50/50 border-l-4 border-gray-900 p-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-1">
                Informasi Karyawan
              </h3>
              <div className="grid grid-cols-1 gap-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500 uppercase text-[10px]">Nama Lengkap</span>
                  <span className="font-black text-gray-900 uppercase text-right ml-4">: {data.metadata.Nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500 uppercase text-[10px]">Nomor Induk (NIK)</span>
                  <span className="font-mono font-bold text-gray-800 tracking-wider text-right ml-4">: {data.metadata.NIK}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 border border-gray-200">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-1">
                Detail Periode
              </h3>
              <div className="grid grid-cols-1 gap-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500 uppercase text-[10px]">Periode Kerja</span>
                  <span className="font-black text-gray-900 uppercase text-right ml-4">: {data.metadata.Periode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500 uppercase text-[10px]">Tahun Buku</span>
                  <span className="font-black text-gray-900 text-right ml-4">: {data.metadata.Tahun}</span>
                </div>
                {data.metadata.Status && (
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500 uppercase text-[10px]">Status Laporan</span>
                    <span className="font-black uppercase text-xs flex items-center ml-4">
                      :{" "}
                      <span className={`ml-1 ${data.metadata.Status === "Final" ? "text-green-600" : "text-orange-500"}`}>
                        {data.metadata.Status}
                      </span>
                    </span>
                  </div>
                )}
                {data.metadata.DibuatOleh && (
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500 uppercase text-[10px]">Dibuat Oleh</span>
                    <span className="font-bold text-gray-800 text-right ml-4 text-[10px]">: {data.metadata.DibuatOleh}</span>
                  </div>
                )}
                {data.metadata.DisetujuiOleh && (
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500 uppercase text-[10px]">Disetujui Oleh</span>
                    <span className="font-bold text-gray-800 text-right ml-4 text-[10px]">: {data.metadata.DisetujuiOleh}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table by Group */}
          <div className="mb-8 space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Performance Breakdown by Group</h3>
            {groupEntries.map((group) => (
              <div key={group.id} className="border-2 border-gray-900">
                <div className="bg-gray-900 text-white px-4 py-2">
                  <h4 className="text-xs font-black uppercase tracking-widest">
                    {group.name}
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 uppercase text-[10px] tracking-widest">
                        <th className="p-3 text-center border-r border-gray-300 w-16">#</th>
                        <th className="p-3 text-left border-r border-gray-300">Kriteria Penilaian / Key Performance Indicator</th>
                        <th className="p-3 text-center border-r border-gray-300 w-32">Nilai</th>
                        <th className="p-3 text-center border-r border-gray-300 w-20">Satuan</th>
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
                            <td className="border-r border-b border-gray-300 p-2 text-center text-gray-500 font-mono text-[10px]">
                              {String(idx + 1).padStart(2, "0")}
                            </td>
                            <td className="border-r border-b border-gray-300 p-2 font-bold text-gray-800 uppercase text-xs tracking-tight">
                              {item.Kriteria}
                            </td>
                            <td className="border-r border-b border-gray-300 p-2 text-center font-black text-gray-900 text-xs sm:text-sm">
                              {displayValue}
                            </td>
                            <td className="border-r border-b border-gray-300 p-2 text-center text-[10px] sm:text-xs text-gray-600 font-medium">
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

          {/* Conclusion - Industrial Scoreboard */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 border-t-2 border-dashed border-gray-300 pt-8 mt-8">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none sm:w-40 text-center border-4 border-gray-900 p-4 bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="block text-[8px] font-black uppercase text-gray-500 tracking-[0.2em] mb-1">
                  Final Score Index
                </span>
                <span className="block text-3xl sm:text-4xl font-black text-gray-900 leading-none mb-1 tracking-tighter">
                  {score}
                </span>
              </div>

              <div className="flex-1 sm:flex-none sm:w-40 text-center border-4 border-gray-900 p-4 bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="block text-[8px] font-black uppercase text-gray-900 tracking-[0.2em] mb-1">
                  Merit Ranking
                </span>
                <div className="flex items-center justify-center gap-1 leading-none">
                  <span className="text-[10px] font-black text-gray-900 opacity-50 uppercase">RANK</span>
                  <span className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">
                    {data.kesimpulan.Ranking}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 mt-12 sm:mt-16 px-2 sm:px-4">
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Evaluated by:</span>
              <p className="text-[11px] text-gray-800 font-bold mb-12 uppercase italic">
                Head of Department / Atasan Langsung
              </p>
              <div className="space-y-0 text-left border-l-2 border-gray-900 pl-3">
                <p className="text-xs font-black text-gray-900 uppercase tracking-tight">
                  {data.metadata.DibuatOleh?.split("(")[0].trim() || "N/A"}
                </p>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                  {data.metadata.DibuatOleh?.includes("(")
                    ? data.metadata.DibuatOleh.split("(")[1].replace(")", "").trim()
                    : "Position Not Specified"}
                </p>
              </div>
            </div>

            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Approved by:</span>
              <p className="text-[11px] text-gray-800 font-bold mb-12 uppercase italic">
                General Manager / Pimpinan Unit
              </p>
              <div className="space-y-0 text-left border-l-2 border-gray-900 pl-3">
                <p className="text-xs font-black text-gray-900 uppercase tracking-tight">
                  {data.metadata.DisetujuiOleh?.split("(")[0].trim() || (data.metadata.Status === "Final" ? "VERIFIED SYSTEM" : "AWAITING APPROVAL")}
                </p>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                  {data.metadata.DisetujuiOleh?.includes("(")
                    ? data.metadata.DisetujuiOleh.split("(")[1].replace(")", "").trim()
                    : data.metadata.Status === "Final"
                      ? ""
                      : "Manager"}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 sm:mt-16 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center text-[8px] text-gray-400 font-mono tracking-tighter uppercase font-bold gap-2">
            <div className="flex gap-4">
              <span>Generated: {new Date().toLocaleString("id-ID")}</span>
              <span className="text-gray-300">|</span>
              <span>Doc Type: HR/PERF/EVAL-V2</span>
            </div>
            <div className="print:hidden italic font-sans text-primary text-[10px]">
              * Preview Mode - Click Print to Generate Formal Document
            </div>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: white !important;
            }
            body * {
              visibility: hidden;
            }
            .print-modal,
            .print-modal * {
              visibility: visible !important;
            }
            .print-modal {
              position: fixed;
              left: 0;
              top: 0;
              width: 100%;
              height: auto;
              margin: 0;
              padding: 0 !important;
              box-shadow: none !important;
            }
            #printable-report {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0 !important;
              margin: 0 !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            table {
              border-collapse: collapse !important;
            }
            th,
            td {
              border: 1px solid black !important;
            }
            .bg-gray-100 {
              background-color: #f3f4f6 !important;
            }
          }
        `}</style>
      </Modal.Body>
      <Modal.Footer className="print:hidden flex flex-col sm:flex-row gap-2">
        <Button color="dark" onClick={handlePrint} className="w-full sm:w-auto">
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