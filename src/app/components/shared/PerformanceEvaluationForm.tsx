"use client";
import React, { useState } from "react";
import { Table, Radio, Label, Textarea, Button } from "flowbite-react";
import { Icon } from "@iconify/react";

interface EvaluationRow {
  id: string;
  label: string;
  category: string;
}

const EVALUATION_STRUCTURE = [
  {
    title: "I. KEDISIPLINAN",
    items: [
      { id: "k1", label: "Kehadiran" },
      { id: "k2", label: "Ketepatan Waktu" },
      { id: "k3", label: "Melaksanakan Peraturan Perusahaan" },
    ],
  },
  {
    title: "II. PERFORMA",
    items: [
      { id: "p1", label: "Penampilan" },
      { id: "p2", label: "Efektifitas dan Efisiensi Kerja" },
      { id: "p3", label: "Kemampuan Mencapai Target" },
    ],
  },
  {
    title: "III. KOMPETENSI UMUM",
    items: [
      { id: "c1", label: "Kerjasama dan Komunikasi" },
      { id: "c2", label: "Inisiatif dan Kreatif" },
      { id: "c3", label: "Kemampuan Interpersonal" },
    ],
  },
];

interface PerformanceEvaluationFormProps {
  data?: {
    employeeName: string;
    jabatan: string;
    periode: string;
    lokasi: string;
    scores: { [key: string]: number | { Nilai: number, Kriteria: string } };
    rincian?: Array<{ Kriteria: string, Nilai: number }>;
    totalScore: number;
    notes: {
      prestasi: string;
      indisipliner: string;
      saran: string;
    };
    evaluator: string;
    approver: string;
  };
}

const PerformanceEvaluationForm = ({ data }: PerformanceEvaluationFormProps) => {
  const normalizeKey = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Use dynamic criteria if provided, fallback to legacy structure
  const dynamicSections = React.useMemo(() => {
    if (data?.rincian && data.rincian.length > 0) {
      return [{
        title: "ASPEK PENILAIAN KINERJA (BERDASARKAN KPI)",
        items: data.rincian.map((r, idx) => ({
          id: `dyn-${idx}`,
          label: r.Kriteria,
          score: r.Nilai
        }))
      }];
    }
    return EVALUATION_STRUCTURE;
  }, [data?.rincian]);

  const calculateTotal = () => {
    if (!data) return "0";
    const val = data.totalScore;
    // Formatting tampilan agar bukan angka desimal mentah SPK
    if (val < 1 && val > 0) return (val * 100).toFixed(0);
    return Math.round(val).toString();
  };

  const handlePrint = () => {
    window.print();
  };

  const getScoreByItem = (item: any) => {
    if (item.score !== undefined) return item.score;
    if (!data?.scores) return 0;
    
    // 1. Try direct ID match
    if (data.scores[item.id] !== undefined) {
      const val = data.scores[item.id];
      return typeof val === 'object' ? val.Nilai : val;
    }
    
    // 2. Try label match (normalized)
    const normLabel = normalizeKey(item.label);
    for (const key in data.scores) {
      const val = data.scores[key];
      const scoreVal = typeof val === 'object' ? val.Nilai : val;
      
      if (normalizeKey(key) === normLabel) return scoreVal;
      if (normLabel.includes(normalizeKey(key)) || normalizeKey(key).includes(normLabel)) {
          return scoreVal;
      }
    }
    
    return 0;
  };

  return (
    <div className="max-w-5xl mx-auto my-8 bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200 print:shadow-none print:border-none print:m-0 print:w-full print-section">
      {/* Container for Print-Ready UI */}
      <div className="p-10 print:p-0 print:text-black">
        
        {/* HEADER */}
        <div className="text-center mb-10 space-y-1">
          <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 leading-tight">
            Formulir Evaluasi dan Penilaian Kinerja Karyawan
          </h1>
          <h2 className="text-xl font-bold uppercase text-gray-800">
            PT. Wira Buana Arum
          </h2>
          <div className="w-32 h-1 bg-gray-900 mx-auto mt-4"></div>
        </div>

        {/* INFO KARYAWAN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-gray-200 pb-8 print:gap-4 print:pb-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Label htmlFor="nama" className="w-24 text-[10px] font-black uppercase text-gray-500">Nama</Label>
              <div className="flex-1 border-b border-gray-300 py-1 font-black uppercase text-sm">
                {data?.employeeName || "---"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="jabatan" className="w-24 text-[10px] font-black uppercase text-gray-500">Jabatan</Label>
              <div className="flex-1 border-b border-gray-300 py-1 font-black uppercase text-sm">
                {data?.jabatan || "---"}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Label htmlFor="periode" className="w-32 text-[10px] font-black uppercase text-gray-500">Periode Penilaian</Label>
              <div className="flex-1 border-b border-gray-300 py-1 font-black uppercase text-sm">
                {data?.periode || "---"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="lokasi" className="w-32 text-[10px] font-black uppercase text-gray-500">Lokasi</Label>
              <div className="flex-1 border-b border-gray-300 py-1 font-black uppercase text-sm">
                {data?.lokasi || "JAKARTA"}
              </div>
            </div>
          </div>
        </div>

        {/* TABEL PENILAIAN */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse border-2 border-gray-900 text-sm">
            <thead>
              <tr className="bg-gray-900 text-white uppercase text-[10px] tracking-widest">
                <th rowSpan={2} className="border border-white/20 p-3 w-12 text-center">No</th>
                <th rowSpan={2} className="border border-white/20 p-3 text-left">Aspek Penilaian Kinerja</th>
                <th colSpan={3} className="border border-white/20 p-2 text-center">Skor Penilaian</th>
              </tr>
              <tr className="bg-gray-800 text-white uppercase text-[9px] tracking-wider">
                <th className="border border-white/10 p-2 w-24 text-center">A (90-100)</th>
                <th className="border border-white/10 p-2 w-24 text-center">B (70-89)</th>
                <th className="border border-white/10 p-2 w-24 text-center">C (50-69)</th>
              </tr>
            </thead>
            <tbody>
              {dynamicSections.map((category) => (
                <React.Fragment key={category.title}>
                  <tr className="bg-gray-100 border-b-2 border-gray-900">
                    <td colSpan={5} className="p-3 font-black text-gray-900 uppercase tracking-tight italic">
                      {category.title}
                    </td>
                  </tr>
                  {category.items.map((item, idx) => {
                    const currentScore = getScoreByItem(item);
                    return (
                      <tr key={item.id} className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
                        <td className="p-3 text-center font-mono text-xs text-gray-500">{idx + 1}</td>
                        <td className="p-3 font-semibold text-gray-800 uppercase text-xs">{item.label}</td>
                        {/* Sub-Kolom Skor */}
                        <td className="p-3 text-center border-l border-gray-200">
                          {currentScore >= 90 || (currentScore >= 0.9 && currentScore < 1) ? (
                            <Icon icon="solar:check-circle-bold" className="mx-auto text-primary text-xl" />
                          ) : <div className="w-5 h-5 border border-gray-300 rounded-full mx-auto" />}
                        </td>
                        <td className="p-3 text-center border-l border-gray-200">
                          {(currentScore >= 70 && currentScore < 90) || (currentScore >= 0.7 && currentScore < 0.9) ? (
                            <Icon icon="solar:check-circle-bold" className="mx-auto text-primary text-xl" />
                          ) : <div className="w-5 h-5 border border-gray-300 rounded-full mx-auto" />}
                        </td>
                        <td className="p-3 text-center border-l border-gray-200">
                          {(currentScore > 0 && currentScore < 70) || (currentScore > 0 && currentScore < 0.7) ? (
                            <Icon icon="solar:check-circle-bold" className="mx-auto text-primary text-xl" />
                          ) : <div className="w-5 h-5 border border-gray-300 rounded-full mx-auto" />}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
              {/* REKAPITULASI */}
              <tr className="bg-gray-900 text-white border-t-2 border-gray-900">
                <td colSpan={2} className="p-3 text-right font-black uppercase tracking-widest text-[10px]">Total Akumulasi Skor</td>
                <td colSpan={3} className="p-3 text-center font-black text-lg bg-primary">
                  {calculateTotal()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* CATATAN & LEGENDA */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-12">
          {/* Legenda & Metadata */}
          <div className="md:col-span-4 space-y-6">
            <div className="border border-gray-200 p-4 bg-gray-50 rounded shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-1">Keterangan Nilai</h4>
              <ul className="text-xs space-y-2 font-bold text-gray-700">
                <li className="flex justify-between"><span>A : Sangat Baik</span> <span className="text-primary">(90 - 100)</span></li>
                <li className="flex justify-between"><span>B : Baik</span> <span className="text-primary">(70 - 89)</span></li>
                <li className="flex justify-between"><span>C : Cukup</span> <span className="text-primary">(50 - 69)</span></li>
              </ul>
            </div>
            <div className="text-[10px] text-gray-400 font-mono italic leading-relaxed">
              * Formulir ini merupakan dokumen resmi PT. Wira Buana Arum. Berdasarkan hasil perhitungan sistem pendukung keputusan (SPK).
            </div>
          </div>

          {/* Form Catatan */}
          <div className="md:col-span-8 space-y-6">
            <div className="space-y-4">
              <h3 className="font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                <div className="w-1.5 h-6 bg-primary"></div>
                IV. CATATAN EVALUASI
              </h3>
              
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-2">
                  <Label className="text-[9px] font-black uppercase text-gray-500 mb-1 block">1. Prestasi lain yang perlu dicatat</Label>
                  <p className="text-sm font-medium text-gray-800 italic min-h-[40px]">
                    {data?.notes.prestasi || "-"}
                  </p>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <Label className="text-[9px] font-black uppercase text-gray-500 mb-1 block">2. Indisipliner yang perlu dicatat</Label>
                  <p className="text-sm font-medium text-gray-800 italic min-h-[40px]">
                    {data?.notes.indisipliner || "-"}
                  </p>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <Label className="text-[9px] font-black uppercase text-gray-500 mb-1 block">3. Saran dan perbaikan</Label>
                  <p className="text-sm font-medium text-gray-800 italic min-h-[40px]">
                    {data?.notes.saran || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TANDA TANGAN */}
        <div className="grid grid-cols-2 gap-12 mt-16 text-center">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 mb-16 underline underline-offset-4">Dicatat Oleh (Supervisor),</p>
            <div className="w-48 h-px bg-gray-400 mx-auto"></div>
            <p className="text-[10px] font-bold text-gray-800 mt-2 uppercase tracking-widest">
              ( {data?.evaluator || "........................................"} )
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 mb-16 underline underline-offset-4">Disetujui Oleh (HR Manager),</p>
            <div className="w-48 h-px bg-gray-400 mx-auto"></div>
            <p className="text-[10px] font-bold text-gray-800 mt-2 uppercase tracking-widest">
              ( {data?.approver || "........................................"} )
            </p>
          </div>
        </div>

        {/* FOOTER INFO */}
        <div className="mt-12 pt-4 border-t border-gray-200 flex justify-between items-end text-[8px] font-mono text-gray-400 uppercase tracking-tighter">
          <div>Ref No: WBA/HRD/FORM-EVAL/{new Date().getFullYear()}</div>
          <div className="print:hidden">
            <Button size="xs" color="gray" onClick={handlePrint}>
              <Icon icon="solar:printer-bold" className="mr-1" /> Cetak Dokumen
            </Button>
          </div>
          <div>Generated on: {new Date().toLocaleDateString('id-ID')}</div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section, .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          body {
            background-color: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          input, textarea {
            border-color: #000 !important;
            color: #000 !important;
          }
          table {
            border-color: #000 !important;
            width: 100% !important;
          }
          .bg-primary {
            background-color: #000 !important;
            color: #fff !important;
            -webkit-print-color-adjust: exact;
          }
          .text-primary {
            color: #000 !important;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  );
};

export default PerformanceEvaluationForm;
