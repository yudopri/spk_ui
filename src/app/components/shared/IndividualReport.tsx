"use client";
import React, { useState } from "react";
import { Modal, Button } from "flowbite-react";
import { Icon } from "@iconify/react";

interface RincianItem {
  Kriteria: string;
  Nilai: string | number;
  Satuan: string;
}

interface KesimpulanData {
  Ranking: number;
  Skor: string | number;
  Status?: string;
}

interface MetadataData {
  Nama: string;
  NIK: string;
  Periode: string;
  Tahun: number;
  DibuatOleh?: string;
  DisetujuiOleh?: string;
  Status?: string;
}

interface ReportResponse {
  success?: boolean;
  metadata?: MetadataData;
  rincian?: RincianItem[];
  kesimpulan?: KesimpulanData;
}

interface IndividualReportModalProps {
  show: boolean;
  onClose: () => void;
  data: ReportResponse | null;
  loading?: boolean;
  error?: string | null;
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

const IndividualReportModal = ({
  show,
  onClose,
  data,
  loading = false,
  error = null,
}: IndividualReportModalProps) => {
  const [activeTab, setActiveTab] = useState<string>("preview");

  if (loading) {
    return (
      <Modal show={show} onClose={onClose} size="5xl" className="print-modal">
        <Modal.Header>Laporan Hasil Penilaian Individual</Modal.Header>
        <Modal.Body>
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-gray-500 font-medium">Memuat data laporan...</p>
          </div>
        </Modal.Body>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal show={show} onClose={onClose} size="5xl" className="print-modal">
        <Modal.Header>Laporan Hasil Penilaian Individual</Modal.Header>
        <Modal.Body>
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="rounded-full bg-red-100 p-4">
              <Icon icon="solar:danger-triangle-bold" className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Gagal Memuat Laporan</h3>
            <p className="text-sm text-gray-500 text-center max-w-md">{error}</p>
            <Button color="failure" onClick={onClose} className="mt-4">
              Tutup
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    );
  }

  if (!data || !data.metadata || !data.rincian || !data.kesimpulan) {
    return (
      <Modal show={show} onClose={onClose} size="5xl" className="print-modal">
        <Modal.Header>Laporan Hasil Penilaian Individual</Modal.Header>
        <Modal.Body>
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="rounded-full bg-gray-100 p-4">
              <Icon icon="solar:document-text-linear" className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Tidak Ada Data</h3>
            <p className="text-sm text-gray-500 text-center">Laporan belum tersedia untuk karyawan ini.</p>
            <Button color="gray" onClick={onClose} className="mt-4">
              Tutup
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    );
  }

  const metadata = data.metadata;
  const rincian = data.rincian;
  const kesimpulan = data.kesimpulan;

  const finalScore =
    typeof kesimpulan.Skor === "number"
      ? kesimpulan.Skor <= 1
        ? kesimpulan.Skor * 100
        : kesimpulan.Skor
      : parseFloat(String(kesimpulan.Skor)) <= 1
        ? parseFloat(String(kesimpulan.Skor)) * 100
        : parseFloat(String(kesimpulan.Skor));

  const score = Number(finalScore.toFixed(2));

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal show={show} onClose={onClose} size="5xl" className="print-modal">
      <Modal.Header className="print:hidden">
        <div className="flex items-center gap-2">
          <Icon icon="solar:document-text-bold" className="h-5 w-5 text-primary" />
          <span>Laporan Hasil Penilaian Individual</span>
        </div>
      </Modal.Header>
      <Modal.Body className="p-0">
        <div className="print:block">
          {/* Mobile-friendly tab buttons */}
          <div className="print:hidden border-b border-gray-200 dark:border-gray-700 px-4 pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                activeTab === "preview"
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon icon="solar:eye-bold" className="h-4 w-4" />
              Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("json")}
              className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                activeTab === "json"
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon icon="solar:code-bold" className="h-4 w-4" />
              JSON Response
            </button>
          </div>

          {/* Preview Tab */}
          {activeTab === "preview" && (
            <div id="printable-report" className="p-4 sm:p-6 md:p-8 bg-white text-black font-sans leading-relaxed max-h-[75vh] overflow-y-auto">
              {/* Header - Industrial Formal Style */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b-4 border-double border-gray-900 pb-6">
                <div className="text-left">
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter leading-none mb-1">
                    Laporan Hasil Penilaian Kinerja
                  </h1>
                  <p className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-widest leading-none">
                    Performance Evaluation Report
                  </p>
                </div>
                <div className="text-right flex flex-col items-start sm:items-end">
                  <div className="bg-gray-900 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-2">
                    Confidential Document
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase font-bold">
                    Doc Ref: {metadata.Tahun}/{metadata.Periode.replace(/\s+/g, "")}/{metadata.NIK}
                  </p>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Metadata Left */}
                <div className="bg-gray-50/50 border-l-4 border-gray-900 p-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-1">
                    Employee Information
                  </h3>
                  <div className="grid grid-cols-1 gap-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-500 uppercase text-[10px]">Nama Lengkap</span>
                      <span className="font-black text-gray-900 uppercase text-right ml-4">: {metadata.Nama}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-500 uppercase text-[10px]">Nomor Induk (NIK)</span>
                      <span className="font-mono font-bold text-gray-800 tracking-wider text-right ml-4">: {metadata.NIK}</span>
                    </div>
                  </div>
                </div>

                {/* Metadata Right */}
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-1">
                    Period Details
                  </h3>
                  <div className="grid grid-cols-1 gap-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-500 uppercase text-[10px]">Periode Kerja</span>
                      <span className="font-black text-gray-900 uppercase text-right ml-4">: {metadata.Periode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-500 uppercase text-[10px]">Tahun Buku</span>
                      <span className="font-black text-gray-900 text-right ml-4">: {metadata.Tahun}</span>
                    </div>
                    {metadata.Status && (
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-500 uppercase text-[10px]">Status Laporan</span>
                        <span className="font-black uppercase text-xs flex items-center ml-4">
                          :{" "}
                          <span
                            className={`ml-1 ${
                              metadata.Status === "Final" ? "text-green-600" : "text-orange-500"
                            }`}
                          >
                            {metadata.Status}
                          </span>
                        </span>
                      </div>
                    )}
                    {metadata.DibuatOleh && (
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-500 uppercase text-[10px]">Dibuat Oleh</span>
                        <span className="font-bold text-gray-800 text-right ml-4 text-[10px]">: {metadata.DibuatOleh}</span>
                      </div>
                    )}
                    {metadata.DisetujuiOleh && (
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-500 uppercase text-[10px]">Disetujui Oleh</span>
                        <span className="font-bold text-gray-800 text-right ml-4 text-[10px]">: {metadata.DisetujuiOleh}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="mb-8 overflow-x-auto">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  Performance breakdown
                </h3>
                <table className="w-full border-2 border-gray-900 text-sm min-w-[500px]">
                  <thead>
                    <tr className="bg-gray-900 text-white uppercase text-[10px] tracking-widest">
                      <th className="p-3 text-center w-12 border-r border-white/20">#</th>
                      <th className="p-3 text-left border-r border-white/20">Kriteria Penilaian / Key Performance Indicator</th>
                      <th className="p-3 text-center w-32 sm:w-40 font-black">Nilai</th>
                      <th className="p-3 text-center w-20 sm:w-24 font-black">Satuan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rincian.map((item, index) => {
                      const isCurrency =
                        typeof item.Nilai === "string" &&
                        (item.Satuan === "Rp" || parseFloat(item.Nilai) > 1000);
                      const displayValue = isCurrency
                        ? formatCurrency(item.Nilai)
                        : formatNumber(item.Nilai, item.Satuan === "%" ? 1 : 4);

                      return (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border-r border-b border-gray-300 p-2 text-center text-gray-500 font-mono text-[10px]">
                            {String(index + 1).padStart(2, "0")}
                          </td>
                          <td className="border-r border-b border-gray-300 p-2 font-bold text-gray-800 uppercase text-xs tracking-tight">
                            {item.Kriteria}
                          </td>
                          <td className="border-b border-gray-300 p-2 text-center font-black text-gray-900 text-xs sm:text-sm">
                            {displayValue}
                          </td>
                          <td className="border-b border-gray-300 p-2 text-center text-[10px] sm:text-xs text-gray-600 font-medium">
                            {item.Satuan}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Conclusion */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 border-t-2 border-dashed border-gray-300 pt-8 mt-8">
                <div className="flex-1 space-y-2 w-full sm:w-auto">
                  <div className="border border-gray-300 p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-gray-200 text-gray-600 px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter">
                      System Methodology
                    </div>
                    <h4 className="text-[10px] font-black uppercase mb-1">Methodology Statement</h4>
                    <p className="text-[9px] leading-relaxed text-gray-500 text-justify">
                      Skor numerik yang ditampilkan merupakan hasil ekstraksi data kinerja yang diproses menggunakan
                      algoritma Multi-Objective Optimization on the basis of Ratio Analysis (MOORA) dengan pembobotan
                      Analytical Hierarchy Process (AHP). Hasil ini bersifat objektif berdasarkan variabel kriteria yang
                      telah ditetapkan oleh manajemen.
                    </p>
                  </div>
                </div>

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
                        {kesimpulan.Ranking}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 mt-12 sm:mt-16 px-2 sm:px-4">
                <div className="text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                    Evaluated by:
                  </span>
                  <p className="text-[11px] text-gray-800 font-bold mb-12 uppercase italic">
                    Head of Department / Atasan Langsung
                  </p>
                  <div className="space-y-0 text-left border-l-2 border-gray-900 pl-3">
                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight">
                      {metadata.DibuatOleh?.split("(")[0].trim() || "N/A"}
                    </p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                      {metadata.DibuatOleh?.includes("(")
                        ? metadata.DibuatOleh.split("(")[1].replace(")", "").trim()
                        : "Position Not Specified"}
                    </p>
                  </div>
                </div>

                <div className="text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                    Approved by:
                  </span>
                  <p className="text-[11px] text-gray-800 font-bold mb-12 uppercase italic">
                    General Manager / Pimpinan Unit
                  </p>
                  <div className="space-y-0 text-left border-l-2 border-gray-900 pl-3">
                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight">
                      {metadata.DisetujuiOleh?.split("(")[0].trim() || (metadata.Status === "Final" ? "VERIFIED SYSTEM" : "AWAITING APPROVAL")}
                    </p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                      {metadata.DisetujuiOleh?.includes("(")
                        ? metadata.DisetujuiOleh.split("(")[1].replace(")", "").trim()
                        : metadata.Status === "Final"
                          ? "DIGITAL SIGNATURE"
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
          )}

          {/* JSON Tab */}
          {activeTab === "json" && (
            <div className="p-4 sm:p-6 bg-gray-900 overflow-x-auto">
              <pre className="text-xs sm:text-sm text-green-400 font-mono whitespace-pre-wrap break-words">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
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