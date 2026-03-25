"use client";
import React, { useState } from "react";
import { Table, Button, Badge, Select } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const ReportHasil = () => {
  const [selectedDivisi, setSelectedDivisi] = useState("Semua");

  const allReports = [
    { rank: 1, nik: "1001", name: "Budi Santoso", score: "0.245", moora: "8.45", status: "Direkomendasikan", divisi: "IT" },
    { rank: 2, nik: "1004", name: "Eko Prasetyo", score: "0.210", moora: "8.12", status: "Direkomendasikan", divisi: "IT" },
    { rank: 1, nik: "1003", name: "Andi Wijaya", score: "0.230", moora: "7.92", status: "Direkomendasikan", divisi: "Marketing" },
    { rank: 1, nik: "1002", name: "Siti Aminah", score: "0.215", moora: "6.15", status: "Cukup", divisi: "HRD" },
    { rank: 2, nik: "1005", name: "Dewi Lestari", score: "0.190", moora: "5.80", status: "Cukup", divisi: "HRD" },
  ];

  const filteredReports = selectedDivisi === "Semua" 
    ? allReports.sort((a, b) => parseFloat(b.moora) - parseFloat(a.moora))
    : allReports.filter(r => r.divisi === selectedDivisi).sort((a, b) => parseFloat(b.moora) - parseFloat(a.moora));

  const chartOptions: any = {
    chart: {
      type: 'bar',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      toolbar: { show: false },
      background: 'transparent',
    },
    colors: ['#5D87FF', '#49BEFF', '#FFAE1F', '#FA896B', '#39B69A'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '45%',
        distributed: true,
        dataLabels: {
          position: 'top',
        },
      }
    },
    dataLabels: { 
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(2);
      },
      offsetY: -20,
      style: {
        fontSize: '11px',
        fontWeight: 'bold',
        colors: ["#5A6A85"]
      }
    },
    legend: { show: false },
    xaxis: {
      categories: filteredReports.map(r => r.name),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: '#5A6A85',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#5A6A85',
        }
      }
    },
    grid: { 
      borderColor: 'rgba(0,0,0,0.05)',
      strokeDashArray: 3,
      padding: { top: 20 }
    },
    tooltip: { 
      theme: 'light',
      y: {
        title: {
          formatter: () => "Skor MOORA:"
        }
      }
    }
  };

  const chartSeries = [{
    name: 'Skor Akhir',
    data: filteredReports.map(r => parseFloat(r.moora))
  }];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Laporan Hasil Penilaian</h1>
          <p className="text-sm text-gray-500">Hasil integrasi AHP (Bobot) & MOORA (Ranking)</p>
        </div>
        <div className="flex flex-wrap gap-3">
             <div className="min-w-32">
                 <Select value={selectedDivisi} onChange={(e) => setSelectedDivisi(e.target.value)} sizing="sm">
                     <option value="Semua">Semua Divisi</option>
                     <option value="IT">IT Department</option>
                     <option value="HRD">HRD Department</option>
                     <option value="Marketing">Marketing</option>
                 </Select>
             </div>
             <div className="min-w-40">
                <Select defaultValue="1" sizing="sm">
                    <option value="1">Periode: Semester 1 2024</option>
                    <option value="2">Periode: Semester 2 2023</option>
                </Select>
             </div>
             <Button color="dark" size="sm" className="flex items-center">
                 <Icon icon="solar:printer-minimalistic-bold" className="mr-2 h-4 w-4" />
                 Export Report
             </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
           <CardBox>
              <div className="flex justify-between items-center mb-6">
                  <h4 className="text-lg font-bold text-gray-800 dark:text-white">Visualisasi Ranking Karyawan</h4>
                  <Badge color="info">Skala MOORA (0-10)</Badge>
              </div>
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="bar"
                height="320px"
                width="100%"
              />
           </CardBox>
        </div>

        <div className="col-span-12 lg:col-span-4">
            <CardBox className="h-full">
                <h4 className="text-lg font-bold mb-4 text-gray-800 dark:text-white text-center">🏆 Best Employee</h4>
                <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center">
                    <div className="relative">
                        <img 
                            src="/images/profile/user-1.jpg" 
                            alt="Best Employee" 
                            className="w-24 h-24 rounded-full border-4 border-yellow-400 p-1"
                            onError={(e: any) => e.target.src = "https://ui-avatars.com/api/?name=" + filteredReports[0]?.name}
                        />
                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1.5 rounded-full shadow-lg">
                            <Icon icon="solar:crown-minimalistic-bold" className="h-5 w-5" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-primary uppercase">{filteredReports[0]?.name}</h2>
                        <p className="text-gray-500 font-medium">Divisi {filteredReports[0]?.divisi}</p>
                    </div>
                    <div className="bg-primary/10 px-6 py-2 rounded-full">
                        <span className="text-primary font-bold text-lg">Skor: {filteredReports[0]?.moora}</span>
                    </div>
                </div>
            </CardBox>
        </div>
        
        <div className="col-span-12">
          <CardBox>
            <h4 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Detail Perhitungan AHP-MOORA</h4>
            <div className="overflow-x-auto">
              <Table hoverable striped>
                <Table.Head>
                  <Table.HeadCell className="text-center">Rank</Table.HeadCell>
                  <Table.HeadCell>Karyawan</Table.HeadCell>
                  <Table.HeadCell className="text-center">Divisi</Table.HeadCell>
                  <Table.HeadCell className="text-center">Vektor Bobot (AHP)</Table.HeadCell>
                  <Table.HeadCell className="text-center">Nilai Optimasi (MOORA)</Table.HeadCell>
                  <Table.HeadCell className="text-center">Keterangan</Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y text-center">
                  {filteredReports.map((report, idx) => (
                    <Table.Row key={report.nik} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                      <Table.Cell className="font-bold text-lg text-primary">{idx + 1}</Table.Cell>
                      <Table.Cell className="text-left">
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-white">{report.name}</span>
                            <span className="text-xs text-gray-500">NIK: {report.nik}</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                         <Badge color="light">{report.divisi}</Badge>
                      </Table.Cell>
                      <Table.Cell className="font-semibold text-gray-700">{report.score}</Table.Cell>
                      <Table.Cell className="font-bold text-secondary text-base">{report.moora}</Table.Cell>
                      <Table.Cell>
                        <Badge color={parseFloat(report.moora) >= 7.5 ? "success" : "warning"} size="sm">
                          {report.status}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
          </CardBox>
        </div>
      </div>
    </div>
  );
};

export default ReportHasil;
