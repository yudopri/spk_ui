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
    }>;
    kesimpulan: {
      Ranking: number;
      Skor: string | number;
    };
  } | null;
}

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
  return (
    <Modal show={show} onClose={onClose} size="4xl" className="print-modal">
      <Modal.Header className="print:hidden">Laporan Hasil Penilaian Individual</Modal.Header>
      <Modal.Body>
        <div id="printable-report" className="p-8 bg-white text-black font-sans leading-relaxed">
          {/* Header - Industrial Formal Style */}
          <div className="flex justify-between items-center mb-6 border-b-4 border-double border-gray-900 pb-6">
            <div className="text-left">
              <h1 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">
                Laporan Hasil Penilaian Kinerja
              </h1>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-widest leading-none">
                Performance Evaluation Report
              </p>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="bg-gray-900 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-2">
                Confidential Document
              </div>
              <p className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase font-bold">
                Doc Ref: {data.metadata.Tahun}/{data.metadata.Periode.replace(/\s+/g, '')}/{data.metadata.NIK}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6 mb-8 items-start">
            {/* Metadata Left */}
            <div className="col-span-12 md:col-span-7 bg-gray-50/50 border-l-4 border-gray-900 p-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-1">Employee Information</h3>
              <div className="grid grid-cols-12 gap-y-2 text-sm">
                <div className="col-span-4 font-bold text-gray-500 uppercase text-[10px]">Nama Lengkap</div>
                <div className="col-span-8 font-black text-gray-900 uppercase">: {data.metadata.Nama}</div>
                
                <div className="col-span-4 font-bold text-gray-500 uppercase text-[10px]">Nomor Induk (NIK)</div>
                <div className="col-span-8 font-mono font-bold text-gray-800 tracking-wider">: {data.metadata.NIK}</div>
              </div>
            </div>

            {/* Metadata Right */}
            <div className="col-span-12 md:col-span-5 bg-gray-50 p-4 border border-gray-200">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-1">Period Details</h3>
              <div className="grid grid-cols-12 gap-y-2 text-sm">
                <div className="col-span-5 font-bold text-gray-500 uppercase text-[10px]">Periode Kerja</div>
                <div className="col-span-7 font-black text-gray-900 uppercase">: {data.metadata.Periode}</div>
                
                <div className="col-span-5 font-bold text-gray-500 uppercase text-[10px]">Tahun Buku</div>
                <div className="col-span-7 font-black text-gray-900">: {data.metadata.Tahun}</div>

                {data.metadata.Status && (
                  <>
                    <div className="col-span-5 font-bold text-gray-500 uppercase text-[10px]">Status Laporan</div>
                    <div className="col-span-7 font-black uppercase text-xs flex items-center">
                      : <span className={`ml-1 ${data.metadata.Status === 'Final' ? 'text-green-600' : 'text-orange-500'}`}>
                        {data.metadata.Status}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Table - Professional Industrial Style */}
          <div className="mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Performance breakdown</h3>
            <table className="w-full border-2 border-gray-900 text-sm">
              <thead>
                <tr className="bg-gray-900 text-white uppercase text-[10px] tracking-widest">
                  <th className="p-3 text-center w-12 border-r border-white/20">#</th>
                  <th className="p-3 text-left border-r border-white/20">Kriteria Penilaian / Key Performance Indicator</th>
                  <th className="p-3 text-center w-32 font-black">Score (0-100)</th>
                </tr>
              </thead>
              <tbody>
                {data.rincian.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border-r border-b border-gray-300 p-2 text-center text-gray-500 font-mono text-[10px]">{String(index + 1).padStart(2, '0')}</td>
                    <td className="border-r border-b border-gray-300 p-2 font-bold text-gray-800 uppercase text-xs tracking-tight">{item.Kriteria}</td>
                    <td className="border-b border-gray-300 p-2 text-center font-black text-gray-900">{item.Nilai} <span className="text-[9px] font-normal text-gray-400 italic">{item.Satuan}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Conclusion - Industrial Scoreboard */}
          <div className="flex justify-between items-center mb-12 gap-8 border-t-2 border-dashed border-gray-300 pt-8 mt-8">
             <div className="flex-1 space-y-2">
                <div className="border border-gray-300 p-4 relative overflow-hidden">
                   <div className="absolute top-0 right-0 bg-gray-200 text-gray-600 px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter">System Methodology</div>
                   <h4 className="text-[10px] font-black uppercase mb-1">Methodology Statement</h4>
                   <p className="text-[9px] leading-relaxed text-gray-500 text-justify">
                      Skor numerik yang ditampilkan merupakan hasil ekstraksi data kinerja yang diproses menggunakan algoritma Multi-Objective Optimization on the basis of Ratio Analysis (MOORA) dengan pembobotan Analytical Hierarchy Process (AHP). Hasil ini bersifat objektif berdasarkan variabel kriteria yang telah ditetapkan oleh manajemen.
                   </p>
                </div>
             </div>

             <div className="w-48 text-center border-4 border-gray-900 p-4 bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="block text-[8px] font-black uppercase text-gray-500 tracking-[0.2em] mb-1">Final Score Index</span>
                <span className="block text-4xl font-black text-gray-900 leading-none mb-1 tracking-tighter">{score}</span>
             </div>

             <div className="w-48 text-center border-4 border-gray-900 p-4 bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="block text-[8px] font-black uppercase text-gray-900 tracking-[0.2em] mb-1">Merit Ranking</span>
                <div className="flex items-center justify-center gap-1 leading-none">
                   <span className="text-[10px] font-black text-gray-900 opacity-50 uppercase">RANK</span>
                   <span className="text-4xl font-black text-gray-900 tracking-tighter">{data.kesimpulan.Ranking}</span>
                </div>
             </div>
          </div>

          {/* Signatures - Formal Industrial Style */}
          <div className="grid grid-cols-2 gap-12 mt-16 px-4">
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Evaluated by:</span>
              <p className="text-[11px] text-gray-800 font-bold mb-16 uppercase italic">Head of Department / Atasan Langsung</p>
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
              <p className="text-[11px] text-gray-800 font-bold mb-16 uppercase italic">General Manager / Pimpinan Unit</p>
              <div className="space-y-0 text-left border-l-2 border-gray-900 pl-3">
                <p className="text-xs font-black text-gray-900 uppercase tracking-tight">
                  {data.metadata.DisetujuiOleh?.split("(")[0].trim() || (data.metadata.Status === 'Final' ? 'VERIFIED SYSTEM' : "AWAITING APPROVAL")}
                </p>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                  {data.metadata.DisetujuiOleh?.includes("(") 
                    ? data.metadata.DisetujuiOleh.split("(")[1].replace(")", "").trim() 
                    : (data.metadata.Status === 'Final' ? 'DIGITAL SIGNATURE' : "Manager")}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-6 border-t border-gray-200 flex justify-between items-center text-[8px] text-gray-400 font-mono tracking-tighter uppercase font-bold">
            <div className="flex gap-4">
               <span>Generated: {new Date().toLocaleString('id-ID')}</span>
               <span className="text-gray-300">|</span>
               <span>Doc Type: HR/PERF/EVAL-V2</span>
            </div>
            <div className="print:hidden italic font-sans text-primary">
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
            .print-modal, .print-modal * {
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
            /* Ensure table borders and backgrounds are printed */
            table { border-collapse: collapse !important; }
            th, td { border: 1px solid black !important; }
            .bg-gray-100 { background-color: #f3f4f6 !important; }
          }
        `}</style>
      </Modal.Body>
      <Modal.Footer className="print:hidden">
        <Button color="dark" onClick={handlePrint}>
            <Icon icon="solar:printer-bold" className="mr-2 h-5 w-5" />
            Cetak Sekarang
        </Button>
        <Button color="gray" onClick={onClose}>Tutup</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default IndividualReportModal;
