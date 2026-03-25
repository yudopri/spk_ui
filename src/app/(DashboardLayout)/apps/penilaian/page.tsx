"use client";
import React, { useState } from "react";
import { Table, Button, Select, TextInput, Badge } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";

const PenilaianKaryawan = () => {
  const [selectedPeriodeId, setSelectedPeriodeId] = useState("0");

  // Mock data periode yang sudah memiliki mapping divisi (Sync dengan Data KPI & Master Periode)
  const periodes = [
    { id: "1", name: "S1-2024", divisi: "IT" },
    { id: "2", name: "S2-2024", divisi: "IT" },
    { id: "3", name: "S1-2024", divisi: "HRD" },
    { id: "4", name: "S1-2024", divisi: "All" },
  ];

  const selectedPeriode = periodes.find(p => p.id === selectedPeriodeId);

  const kpiLabelsByPeriode: any = {
    "1": ["Coding Quality", "System Stability", "Security Compliance"], // IT S1
    "2": ["System Architecture", "Performance Opt", "Testing Quality"], // IT S2
    "3": ["Recruitment Speed", "Employee Satisfaction", "Training Success"], // HRD S1
    "4": ["Kedisiplinan", "Loyalitas", "Kerjasama Team"], // All S1
    "0": ["C1", "C2", "C3"]
  };

  const currentKPIs = kpiLabelsByPeriode[selectedPeriodeId] || kpiLabelsByPeriode["0"];

  const employees = [
    { id: 1, name: "Budi Santoso", nik: "1001", divisi: "IT" },
    { id: 2, name: "Siti Aminah", nik: "1002", divisi: "HRD" },
    { id: 3, name: "Andi Wijaya", nik: "1003", divisi: "IT" },
  ].filter(e => {
    if (selectedPeriodeId === "0") return false;
    if (selectedPeriode?.divisi === "All") return true; 
    return e.divisi === selectedPeriode?.divisi;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold">Penilaian Karyawan</h1>
          <p className="text-sm text-gray-500">Input nilai KPI karyawan berdasarkan Periode & Divisi</p>
        </div>
        <div className="flex gap-4">
            <Select 
              value={selectedPeriodeId} 
              onChange={(e) => setSelectedPeriodeId(e.target.value)}
              sizing="sm"
              className="w-64"
            >
                <option value="0">Pilih Periode - Divisi</option>
                {periodes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {p.divisi === "All" ? "Semua Divisi" : `Divisi ${p.divisi}`}
                  </option>
                ))}
            </Select>
            <Button color="primary" size="sm">
               <Icon icon="solar:diskette-bold-duotone" className="mr-2 h-5 w-5" />
               Simpan Semua
            </Button>
        </div>
      </div>

      <CardBox>
        <div className="mb-4 flex items-center justify-between">
           <h5 className="font-semibold text-primary underline decoration-dotted">
             {selectedPeriodeId === "0" 
              ? "Silakan pilih periode untuk melihat kriteria" 
              : `Kriteria Aktif: ${currentKPIs.join(", ")}`}
           </h5>
           {selectedPeriodeId !== "0" && (
             <Badge color="info">Target: {selectedPeriode?.divisi === "All" ? "Seluruh Karyawan" : `Karyawan ${selectedPeriode?.divisi}`}</Badge>
           )}
        </div>
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>NIK</Table.HeadCell>
              <Table.HeadCell>Nama Karyawan</Table.HeadCell>
              <Table.HeadCell>Divisi/Unit</Table.HeadCell>
              {currentKPIs.map((kpi: string, idx: number) => (
                <Table.HeadCell key={idx} className="text-center">{kpi}</Table.HeadCell>
              ))}
            </Table.Head>
            <Table.Body className="divide-y">
              {employees.length > 0 ? employees.map((emp) => (
                <Table.Row key={emp.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell className="font-medium text-gray-900 dark:text-white">{emp.nik}</Table.Cell>
                  <Table.Cell>{emp.name}</Table.Cell>
                  <Table.Cell>
                    <Badge color="gray" size="sm">{emp.divisi}</Badge>
                  </Table.Cell>
                  {currentKPIs.map((_: string, idx: number) => (
                    <Table.Cell key={idx} className="text-center">
                       <TextInput type="number" sizing="sm" placeholder="0-100" className="w-20 mx-auto" />
                    </Table.Cell>
                  ))}
                </Table.Row>
              )) : (
                <Table.Row>
                   <Table.Cell colSpan={3 + currentKPIs.length} className="text-center py-20 text-gray-400">
                      {selectedPeriodeId === "0" 
                        ? "Pilih Periode - Divisi di atas untuk menampilkan daftar karyawan" 
                        : "Tidak ada karyawan ditemukan untuk unit kerja ini."}
                   </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </div>
      </CardBox>
    </div>
  );
};

export default PenilaianKaryawan;
