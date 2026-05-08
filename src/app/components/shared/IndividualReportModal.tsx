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
      Nilai: number;
      Satuan: string;
    }>;
    kesimpulan: {
      Ranking: number;
      Skor: number;
    };
  } | null;
}

const IndividualReportModal = ({ show, onClose, data }: IndividualReportProps) => {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal show={show} onClose={onClose} size="4xl" className="print-modal">
      <Modal.Header className="print:hidden">Laporan Hasil Penilaian Individual</Modal.Header>
      <Modal.Body>
        <div id="printable-report" className="p-8 bg-white text-black font-sans leading-relaxed">
          {/* Header */}
          <div className="text-center mb-10 border-b-2 border-gray-800 pb-4">
            <h1 className="text-2xl font-bold uppercase tracking-widest">Laporan Hasil Penilaian Kinerja</h1>
            <p className="text-sm mt-1">Sistem Pendukung Keputusan Penilaian Karyawan</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="space-y-1">
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Nama</span>
                <span className="col-span-2">: {data.metadata.Nama}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">NIK</span>
                <span className="col-span-2">: {data.metadata.NIK}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Periode</span>
                <span className="col-span-2">: {data.metadata.Periode}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-gray-700">Tahun</span>
                <span className="col-span-2">: {data.metadata.Tahun}</span>
              </div>
              {data.metadata.Status && (
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-gray-700">Status</span>
                  <span className="col-span-2">
                    : <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      data.metadata.Status === 'Final' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {data.metadata.Status}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="mb-10">
            <table className="w-full border-collapse border border-gray-800">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-800 p-3 text-center w-16">No</th>
                  <th className="border border-gray-800 p-3 text-left">Kriteria Penilaian</th>
                  <th className="border border-gray-800 p-3 text-center w-32">Nilai</th>
                </tr>
              </thead>
              <tbody>
                {data.rincian.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-800 p-2 text-center">{index + 1}</td>
                    <td className="border border-gray-800 p-2">{item.Kriteria}</td>
                    <td className="border border-gray-800 p-2 text-center font-semibold">{item.Nilai} {item.Satuan || ""} </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Conclusion */}
          <div className="flex justify-end mb-16">
            <div className="w-1/2 space-y-1">
              <div className="flex justify-between items-center py-2 border-b border-gray-300">
                <span className="font-bold text-gray-800">Total Nilai Akhir</span>
                <span className="font-black text-xl text-primary">{data.kesimpulan.Skor.toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b-2 border-gray-800">
                <span className="font-bold text-gray-800">Peringkat Akhir</span>
                <span className="font-black text-xl uppercase text-secondary">Ke - {data.kesimpulan.Ranking}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-20 text-center mt-20 px-10">
            <div className="flex flex-col">
              <p className="mb-20 text-gray-800 font-semibold">Dibuat Oleh,</p>
              <div className="border-b border-gray-800 w-56 mx-auto"></div>
              <p className="mt-2 text-sm font-bold text-gray-900 uppercase">
                {data.metadata.DibuatOleh || "( Nama Kepala Divisi )"}
              </p>
              <p className="text-xs text-gray-500 italic">Atasan Langsung</p>
            </div>
            <div className="flex flex-col">
              <p className="mb-20 text-gray-800 font-semibold">Disetujui Oleh,</p>
              <div className="border-b border-gray-800 w-56 mx-auto"></div>
              <p className="mt-2 text-sm font-bold text-gray-900 uppercase">
                {data.metadata.DisetujuiOleh || (data.metadata.Status === 'Final' ? '-' : "( Menunggu Approval )")}
              </p>
              <p className="text-xs text-gray-500 italic">Pimpinan / Manager</p>
            </div>
          </div>

          <div className="mt-12 text-center text-xs text-gray-400 print:hidden italic">
            Dicetak otomatis melalui Sistem SPK - {new Date().toLocaleDateString('id-ID')}
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
