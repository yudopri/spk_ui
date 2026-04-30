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
            </div>
          </div>

          {/* Table */}
          <div className="mb-10">
            <table className="w-full border-collapse border border-gray-800">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-800 p-3 text-center w-16">No</th>
                  <th className="border border-gray-800 p-3 text-left">Kriteria Penilaian</th>
                  <th className="border border-gray-800 p-3 text-center w-32">Skor</th>
                  <th className="border border-gray-800 p-3 text-center w-24">Satuan</th>
                </tr>
              </thead>
              <tbody>
                {data.rincian.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-800 p-2 text-center">{index + 1}</td>
                    <td className="border border-gray-800 p-2">{item.Kriteria}</td>
                    <td className="border border-gray-800 p-2 text-center font-semibold">{item.Nilai}</td>
                    <td className="border border-gray-800 p-2 text-center">{item.Satuan || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Conclusion */}
          <div className="flex justify-end mb-16">
            <div className="w-1/2 space-y-2 border-2 border-gray-800 p-4 rounded-lg bg-gray-50">
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-gray-800">Total Skor Akhir:</span>
                <span className="font-black text-2xl text-primary">{data.kesimpulan.Skor.toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 border border-gray-200">
                <span className="font-semibold">Peringkat:</span>
                <span className="font-bold text-xl uppercase">Ke - {data.kesimpulan.Ranking}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-20 text-center mt-20 px-10">
            <div className="flex flex-col">
              <p className="mb-20 text-gray-800">Atasan Langsung,</p>
              <div className="border-b border-gray-800 w-48 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500 italic">( Nama Lengkap )</p>
            </div>
            <div className="flex flex-col">
              <p className="mb-20 text-gray-800">Pimpinan,</p>
              <div className="border-b border-gray-800 w-48 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500 italic">( HRD / Direksi )</p>
            </div>
          </div>

          <div className="mt-12 text-center text-xs text-gray-400 print:hidden italic">
            Dicetak otomatis melalui Sistem SPK - {new Date().toLocaleDateString('id-ID')}
          </div>
        </div>

        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-modal, .print-modal * {
              visibility: visible !important;
            }
            #printable-report {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0 !important;
            }
            .print\\:hidden {
              display: none !important;
            }
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
