"use client";
import React, { useState } from "react";
import { Table, Select, Button, Badge } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";

const NilaiPerbandingan = () => {
  const [selectedPeriodeId, setSelectedPeriodeId] = useState("1");

  // Mock data periode yang sudah memiliki mapping divisi (Sync dengan Data KPI & Master Periode)
  const periodes = [
    { id: "1", name: "S1-2024", divisi: "IT" },
    { id: "2", name: "S2-2024", divisi: "IT" },
    { id: "3", name: "S1-2024", divisi: "HRD" },
    { id: "4", name: "S1-2024", divisi: "All" },
  ];

  const kriteriaByPeriode: any = {
    "1": ["Coding Quality", "System Security", "Bug Fixing Speed"], // IT S1
    "2": ["System Architecture", "Performance Opt", "Testing Quality"], // IT S2
    "3": ["Recruitment Speed", "Employee Engagement", "Training Success"], // HRD S1
    "4": ["Kedisiplinan", "Loyalitas", "Kerjasama Team"], // All S1
  };

  const currentKriteria = kriteriaByPeriode[selectedPeriodeId] || [];
  const selectedPeriode = periodes.find(p => p.id === selectedPeriodeId);

  // Generate pairs for comparison (diagonal matrix simplified)
  const generatePairs = (list: string[]) => {
    const pairs = [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        pairs.push({ k1: list[i], k2: list[j] });
      }
    }
    return pairs;
  };

  const pairs = generatePairs(currentKriteria);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold">Perbandingan Kriteria (AHP)</h1>
          <p className="text-sm text-gray-500">Tentukan bobot prioritas kriteria untuk {selectedPeriode?.name} - {selectedPeriode?.divisi === "All" ? "Semua Divisi" : `Divisi ${selectedPeriode?.divisi}`}</p>
        </div>
        <div className="flex gap-4">
          <div className="w-64">
            <Select
              value={selectedPeriodeId}
              onChange={(e) => setSelectedPeriodeId(e.target.value)}
              sizing="sm"
            >
              {periodes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.divisi === "All" ? "Semua Divisi" : `Divisi ${p.divisi}`}
                </option>
              ))}
            </Select>
          </div>
          <Button color="primary">
            <Icon icon="solar:calculator-linear" className="mr-2 h-5 w-5" />
            Hitung Bobot
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CardBox>
            <div className="mb-4 flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg dark:bg-blue-900/20 dark:text-blue-400">
               <Icon icon="solar:info-circle-linear" className="h-5 w-5 flex-shrink-0" />
               <p className="text-xs font-medium italic">Petunjuk: Bandingkan tingkat kepentingan Kriteria A terhadap Kriteria B (Skala 1-9 Saaty).</p>
            </div>
            <div className="overflow-x-auto">
              <Table hoverable>
                <Table.Head>
                  <Table.HeadCell className="w-1/3 text-center">Kriteria A</Table.HeadCell>
                  <Table.HeadCell className="w-1/3 text-center">Nilai Perbandingan</Table.HeadCell>
                  <Table.HeadCell className="w-1/3 text-center">Kriteria B</Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y">
                  {pairs.map((pair, index) => (
                    <Table.Row key={index} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                      <Table.Cell className="font-bold text-gray-900 dark:text-white text-center">
                        {pair.k1}
                      </Table.Cell>
                      <Table.Cell>
                        <Select sizing="sm" defaultValue="1">
                          <option value="1">1 - Sama Penting</option>
                          <option value="3">3 - Sedikit Lebih Penting</option>
                          <option value="5">5 - Lebih Penting</option>
                          <option value="7">7 - Sangat Lebih Penting</option>
                          <option value="9">9 - Mutlak Lebih Penting</option>
                          <option value="0.33">1/3 - Sedikit Kurang Penting</option>
                          <option value="0.2">1/5 - Kurang Penting</option>
                          <option value="0.14">1/7 - Sangat Kurang Penting</option>
                          <option value="0.11">1/9 - Mutlak Kurang Penting</option>
                        </Select>
                      </Table.Cell>
                      <Table.Cell className="font-bold text-gray-900 dark:text-white text-center">
                        {pair.k2}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                  {pairs.length === 0 && (
                    <Table.Row>
                      <Table.Cell colSpan={3} className="text-center py-10 text-gray-500 italic">
                        Belum ada kriteria untuk dibandingkan pada periode ini.
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table>
            </div>
          </CardBox>
        </div>

        <div className="space-y-6">
          <CardBox>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Icon icon="solar:chart-2-linear" className="text-primary" />
              Hasil Bobot (Prioritas)
            </h3>
            <div className="space-y-4">
              {currentKriteria.length > 0 ? (
                currentKriteria.map((k: string, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{k}</span>
                      <span className="font-bold text-primary">{(40 - i * 10)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${(40 - i * 10)}%` }}></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic text-center py-4">Pilih periode yang valid</p>
              )}
              {currentKriteria.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Consistency Ratio (CR)</span>
                      <Badge color="success">0.024 (Konsisten)</Badge>
                   </div>
                </div>
              )}
            </div>
          </CardBox>

          <CardBox>
            <h3 className="text-md font-bold mb-2">Informasi Metodologi</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Metode AHP digunakan untuk mencari bobot prioritas dari setiap kriteria melalui perbandingan berpasangan. 
              Hasil bobot ini nantinya akan digunakan dalam perhitungan MOORA untuk menentukan peringkat karyawan terbaik.
            </p>
          </CardBox>
        </div>
      </div>
    </div>
  );
};

export default NilaiPerbandingan;
