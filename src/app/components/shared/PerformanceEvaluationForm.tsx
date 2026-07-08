"use client";

import React from "react";
import { Label, Button } from "flowbite-react";
import { Icon } from "@iconify/react";

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
      { id: "p2", label: "Efektivitas dan Efisiensi Kerja" },
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
    scores?: any;
    rincian?: Array<any>;
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

const PerformanceEvaluationForm = ({
  data,
}: PerformanceEvaluationFormProps) => {
  const normalizeKey = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]/g, "");

  const dynamicSections = React.useMemo(() => {
    if (data?.rincian && data.rincian.length > 0) {
      // Cek apakah rincian berupa grouped data (memiliki kpi_group_title atau nama_grup/GroupKriteria)
      const first = data.rincian[0];
      if (first.kpi_group_title || first.nama_grup || first.GroupKriteria || first.kpis || first.items) {
        // Ini adalah grouped data dari API
        return data.rincian.map((group: any, gIdx: number) => {
          const kpis = group.kpis || group.items || group.Kpis || [];
          return {
            title: group.kpi_group_title || group.nama_grup || group.GroupKriteria || `Grup ${gIdx + 1}`,
            items: kpis.map((kpi: any, kIdx: number) => ({
              id: `group-${gIdx}-kpi-${kIdx}`,
              label: kpi.kpi_name || kpi.kriteria || kpi.NamaKpi || kpi.Kriteria || kpi.nama_kpi || `KPI #${kIdx + 1}`,
              score: kpi.nilai || kpi.Nilai || kpi.score || kpi.Score || 0,
            })),
          };
        });
      }

      // Flat array {Kriteria, Nilai}
      return [
        {
          title: "ASPEK PENILAIAN KINERJA BERDASARKAN KPI",
          items: data.rincian.map((r, idx) => ({
            id: `dyn-${idx}`,
            label: r.Kriteria,
            score: r.Nilai,
          })),
        },
      ];
    }

    return EVALUATION_STRUCTURE;
  }, [data?.rincian]);

  const getScoreByItem = (item: any) => {
    if (item.score !== undefined && item.score !== null) return item.score;

    if (!data?.scores) return 0;

    if (data.scores[item.id] !== undefined) {
      const val = data.scores[item.id];
      return typeof val === "object" ? val.Nilai : val;
    }

    const normLabel = normalizeKey(item.label);

    for (const key in data.scores) {
      const val = data.scores[key];
      const scoreVal = typeof val === "object" ? val.Nilai : val;

      if (normalizeKey(key) === normLabel) return scoreVal;

      if (
        normLabel.includes(normalizeKey(key)) ||
        normalizeKey(key).includes(normLabel)
      ) {
        return scoreVal;
      }
    }

    return 0;
  };

  const formatScore = (value: number) => {
    if (!value) return 0;
    return value <= 1 ? value * 100 : value;
  };

  const finalScore = formatScore(data?.totalScore || 0);

  const getCategory = (score: number) => {
    if (score >= 90) return "Outstanding";
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    return "Poor";
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="max-w-5xl mx-auto my-8 bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200 print-section">

      <div className="p-10 print:p-0">

        {/* HEADER */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-black uppercase">
            Formulir Evaluasi Kinerja Karyawan
          </h1>

          <h2 className="text-xl font-bold text-gray-700">
            PT. Wira Buana Arum
          </h2>

          <div className="w-32 h-1 bg-black mx-auto mt-4"></div>
        </div>

        {/* INFORMASI */}
        <div className="grid md:grid-cols-2 gap-8 mb-8 border-b pb-8">

          <div className="space-y-4">

            <div className="flex gap-3">
              <Label className="w-24 text-xs font-bold uppercase">
                Nama
              </Label>

              <div className="flex-1 border-b font-bold uppercase">
                {data?.employeeName || "-"}
              </div>
            </div>

            <div className="flex gap-3">
              <Label className="w-24 text-xs font-bold uppercase">
                Jabatan
              </Label>

              <div className="flex-1 border-b font-bold uppercase">
                {data?.jabatan || "-"}
              </div>
            </div>
          </div>

          <div className="space-y-4">

            <div className="flex gap-3">
              <Label className="w-32 text-xs font-bold uppercase">
                Periode
              </Label>

              <div className="flex-1 border-b font-bold uppercase">
                {data?.periode || "-"}
              </div>
            </div>

            <div className="flex gap-3">
              <Label className="w-32 text-xs font-bold uppercase">
                Lokasi
              </Label>

              <div className="flex-1 border-b font-bold uppercase">
                {data?.lokasi || "-"}
              </div>
            </div>
          </div>
        </div>

        {/* TABEL KPI */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full border-2 border-black text-sm">

            <thead>
              <tr className="bg-black text-white uppercase text-xs">
                <th className="border p-3 w-16">No</th>
                <th className="border p-3 text-left">
                  Indikator KPI
                </th>
                <th className="border p-3 w-32">
                  Nilai
                </th>
                <th className="border p-3 w-40">
                  Kategori
                </th>
              </tr>
            </thead>

            <tbody>
              {dynamicSections.map((section) => (
                <React.Fragment key={section.title}>

                  <tr className="bg-gray-100">
                    <td
                      colSpan={4}
                      className="p-3 font-black uppercase"
                    >
                      {section.title}
                    </td>
                  </tr>

                  {section.items.map((item: any, idx: number) => {
                    const raw = getScoreByItem(item);

                    const score =
                      raw <= 1 ? raw * 100 : raw;

                    return (
                      <tr key={item.id}>
                        <td className="border p-3 text-center">
                          {idx + 1}
                        </td>

                        <td className="border p-3 font-semibold uppercase text-xs">
                          {item.label}
                        </td>

                        <td className="border p-3 text-center font-black">
                          {score.toFixed(2)}
                        </td>

                        <td className="border p-3 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold
                            ${
                              score >= 90
                                ? "bg-green-100 text-green-700"
                                : score >= 80
                                ? "bg-blue-100 text-blue-700"
                                : score >= 70
                                ? "bg-yellow-100 text-yellow-700"
                                : score >= 60
                                ? "bg-orange-100 text-orange-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {getCategory(score)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}

              <tr className="bg-black text-white">
                <td
                  colSpan={2}
                  className="p-4 text-right font-black uppercase"
                >
                  Nilai Akhir
                </td>

                <td
                  colSpan={2}
                  className="text-center text-2xl font-black"
                >
                  {finalScore.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* RINGKASAN */}
        <div className="border-2 border-black p-6 mb-8">

          <h3 className="font-black text-lg uppercase mb-4">
            Ringkasan Hasil Penilaian
          </h3>

          <div className="grid md:grid-cols-3 gap-6">

            <div className="text-center">
              <p className="text-xs uppercase text-gray-500">
                Nilai Akhir
              </p>

              <div className="text-4xl font-black">
                {finalScore.toFixed(2)}
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs uppercase text-gray-500">
                Kategori
              </p>

              <div className="text-2xl font-black">
                {getCategory(finalScore)}
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs uppercase text-gray-500">
                Metode
              </p>

              <div className="text-2xl font-black">
                Sistem Penilaian
              </div>
            </div>

          </div>

          <div className="mt-5 h-3 rounded bg-gray-200">
            <div
              className="h-3 rounded bg-black"
              style={{
                width: `${Math.min(finalScore, 100)}%`,
              }}
            />
          </div>

          <p className="mt-4 text-sm text-gray-600 text-justify">
            Berdasarkan hasil evaluasi kinerja menggunakan
            sistem penilaian terintegrasi, karyawan memperoleh
            kategori <b>{getCategory(finalScore)}</b>
            dengan nilai akhir <b>{finalScore.toFixed(2)}</b>.
          </p>
        </div>

        {/* CATATAN */}
        <div className="space-y-4 mb-10">

          <h3 className="font-black uppercase">
            Catatan Evaluasi
          </h3>

          <div>
            <Label className="text-xs font-bold">
              Prestasi
            </Label>
            <p>{data?.notes.prestasi || "-"}</p>
          </div>

          <div>
            <Label className="text-xs font-bold">
              Indisipliner
            </Label>
            <p>{data?.notes.indisipliner || "-"}</p>
          </div>

          <div>
            <Label className="text-xs font-bold">
              Saran
            </Label>
            <p>{data?.notes.saran || "-"}</p>
          </div>
        </div>

        {/* TTD */}
        <div className="grid grid-cols-2 gap-12 text-center mt-20">

          <div>
            <p className="text-xs uppercase mb-16">
              Dicatat Oleh
            </p>

            <div className="border-t border-black w-48 mx-auto pt-2">
              <p className="font-bold uppercase">
                {data?.evaluator || "-"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase mb-16">
              Disetujui Oleh
            </p>

            <div className="border-t border-black w-48 mx-auto pt-2">
              <p className="font-bold uppercase">
                {data?.approver || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-10 pt-4 border-t flex justify-between items-center text-xs text-gray-500">

          <div>
            WBA/HRD/EVALUASI/{new Date().getFullYear()}
          </div>

          <div className="print:hidden">
            <Button
              size="sm"
              color="gray"
              onClick={handlePrint}
            >
              <Icon
                icon="solar:printer-bold"
                className="mr-2"
              />
              Cetak Dokumen
            </Button>
          </div>

          <div>
            {new Date().toLocaleDateString("id-ID")}
          </div>

        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }

          .print-section,
          .print-section * {
            visibility: visible;
          }

          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none;
            border: none;
          }

          .print\\:hidden {
            display: none !important;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            border: 1px solid black !important;
          }

          thead {
            display: table-header-group;
          }

          tr {
            page-break-inside: avoid;
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