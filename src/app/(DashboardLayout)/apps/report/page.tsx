"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Badge, Select, Spinner, Alert } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import dynamic from "next/dynamic";
import spkService, { SpkReport } from "@/services/spkService";
import periodeService, { Periode } from "@/services/periodeService";
import karyawanService from "@/services/karyawanService";
import { usePermission } from "@/hooks/usePermission";
import IndividualReportModal from "@/app/components/shared/IndividualReportModal";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const ReportHasil = () => {
  const { user, isKaryawan, isAdminLike } = usePermission();
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number>(0);
  const [selectedLokasi, setSelectedLokasi] = useState<string>("");
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [lokasiOptions, setLokasiOptions] = useState<{id: any, name: string}[]>([]);
  const [reports, setReports] = useState<SpkReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Individual Report State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [individualData, setIndividualData] = useState<any>(null);
  const [printingId, setPrintingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resP, resL] = await Promise.all([
          periodeService.getAll(1, 100),
          karyawanService.getWorkLocations()
        ]);
        setPeriodes(resP.data);
        setLokasiOptions(resL.data);
        if (resP.data.length > 0) {
          setSelectedPeriodeId(resP.data[0].id || resP.data[0].Id);
        }
      } catch (err: any) {
        setError("Gagal mengambil data filter");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      if (!selectedPeriodeId) return;
      try {
        setLoading(true);
        const res = await spkService.getReport(selectedPeriodeId, 1, 100, selectedLokasi || undefined);
        const rawReports = res.data || [];
        const scoped = rawReports.filter((item) => {
          if (isKaryawan) {
            const employeeId = Number(item.Karyawan?.Id ?? 0);
            return employeeId === Number(user?.employee_id ?? 0);
          }

          if (isAdminLike && user?.dept_id) {
            const currentDivisiId = (item as any)?.Periode?.DivisiId ?? (item as any)?.Periode?.departemen_id;
            // Jika DivisiId null/undefined (Semua Divisi), maka semua Kadiv bisa melihat
            if (currentDivisiId === null || currentDivisiId === undefined || currentDivisiId === 0) {
              return true;
            }
            return Number(currentDivisiId) === Number(user.dept_id);
          }

          return true;
        });

        setReports(scoped);
        setError(null);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Gagal mengambil laporan hasil");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [selectedPeriodeId, selectedLokasi, isKaryawan, isAdminLike, user?.employee_id, user?.dept_id]);

  const handleFetchIndividual = async (karyawanId: number) => {
    try {
      setPrintingId(karyawanId);
      const res = await spkService.getIndividualReport(selectedPeriodeId, karyawanId);
      if (res.success) {
        setIndividualData(res);
        setShowPrintModal(true);
      }
    } catch (err: any) {
      setError("Gagal mengambil data laporan individual");
    } finally {
      setPrintingId(null);
    }
  };

  const handleExportSummary = async () => {
    if (!selectedPeriodeId) return;
    try {
      setExporting(true);
      // Direct Download for Excel using format=excel
      const downloadUrl = `/api/proxy/spk/report/summary/${selectedPeriodeId}?format=excel`;
      window.open(downloadUrl, '_blank');
    } catch (err) {
      setError("Gagal melakukan ekspor rekapitulasi");
    } finally {
      setExporting(false);
    }
  };

  const handlePrintPdf = (karyawanId: number) => {
    if (!selectedPeriodeId) return;
    // Direct Open/Download for individual PDF
    const downloadUrl = `/api/proxy/spk/report/individual/${selectedPeriodeId}/${karyawanId}?format=pdf`;
    window.open(downloadUrl, '_blank');
  };

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
        fontSize: '10px',
        fontWeight: 'bold',
        colors: ["#5A6A85"]
      }
    },
    legend: { show: false },
    xaxis: {
      categories: reports.map(r => r.Karyawan?.Nama || "Unknown"),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: '#5A6A85',
          fontSize: '11px'
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
          formatter: () => "Nilai Skala:"
        }
      }
    }
  };

  const chartSeries = [{
    name: 'Nilai Skala',
    data: reports.map(r => r.NilaiSkala)
  }];

  const bestEmployee = reports.length > 0 ? reports[0] : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Laporan Hasil Penilaian</h1>
          <p className="text-sm text-gray-500">Hasil Ranking Kinerja Karyawan</p>
        </div>
        <div className="flex flex-wrap gap-3">
             <div className="min-w-48">
                <Select
                  value={selectedLokasi}
                  onChange={(e) => setSelectedLokasi(e.target.value)}
                  sizing="sm"
                >
                    <option value="">Semua Lokasi</option>
                    {lokasiOptions.map((lokasi) => (
                      <option key={lokasi.id} value={lokasi.id}>{lokasi.name}</option>
                    ))}
                </Select>
             </div>
             <div className="min-w-48">
                <Select 
                  value={selectedPeriodeId} 
                  onChange={(e) => setSelectedPeriodeId(Number(e.target.value))} 
                  sizing="sm"
                >
                    <option value={0}>Pilih Periode</option>
                    {periodes.map((p) => (
                      <option key={p.id || p.Id} value={p.id || p.Id}>
                        {(p.NamaPeriode || p.namaPeriode) + " - " + (p.NamaDivisi || p.divisi?.namaDivisi || "")}
                      </option>
                    ))}
                </Select>
             </div>
             <Button color="dark" size="sm" className="flex items-center" onClick={handleExportSummary} disabled={exporting || !selectedPeriodeId}>
                {exporting ? <Spinner size="sm" className="mr-2" /> : <Icon icon="solar:file-send-bold" className="mr-2 h-4 w-4" />}
                Ekspor Rekapitulasi
             </Button>
        </div>
      </div>

      {error && <Alert color="failure">{error}</Alert>}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
           <CardBox>
              <div className="flex justify-between items-center mb-6">
                  <h4 className="text-lg font-bold text-gray-800 dark:text-white">Visualisasi Ranking Karyawan</h4>
                  <Badge color="info">Skor Skala</Badge>
              </div>
              {loading ? (
                <div className="flex justify-center p-20"><Spinner size="xl" /></div>
              ) : reports.length > 0 ? (
                <Chart
                  options={chartOptions}
                  series={chartSeries}
                  type="bar"
                  height="320px"
                  width="100%"
                />
              ) : (
                <div className="text-center py-20 text-gray-500 italic">Tidak ada data untuk periode ini</div>
              )}
           </CardBox>
        </div>

        <div className="col-span-12 lg:col-span-4">
            <CardBox className="h-full">
                <h4 className="text-lg font-bold mb-4 text-gray-800 dark:text-white text-center">🏆 Best Employee</h4>
                {bestEmployee ? (
                  <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center">
                      <div className="relative">
                          <img 
                              src={`https://ui-avatars.com/api/?name=${bestEmployee.Karyawan?.Nama}&background=random&size=128`}
                              alt="Best Employee" 
                              className="w-24 h-24 rounded-full border-4 border-yellow-400 p-1"
                          />
                          <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1.5 rounded-full shadow-lg">
                              <Icon icon="solar:crown-minimalistic-bold" className="h-5 w-5" />
                          </div>
                      </div>
                      <div>
                          <h2 className="text-xl font-black text-primary uppercase">{bestEmployee.Karyawan?.Nama}</h2>
                      </div>
                      <div className="bg-primary/10 px-6 py-2 rounded-full">
                          <span className="text-primary font-bold text-lg">Skor: {bestEmployee.NilaiSkala}</span>
                      </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400 italic">Belum ada pemenang</div>
                )}
            </CardBox>
        </div>
        
        <div className="col-span-12">
          <CardBox>
            <h4 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Detail Nilai</h4>
            <div className="overflow-x-auto">
              <Table hoverable striped>
                <Table.Head>
                  <Table.HeadCell className="text-center">Rank</Table.HeadCell>
                  <Table.HeadCell>Nama</Table.HeadCell>
                  <Table.HeadCell className="text-center">NIK</Table.HeadCell>
                  <Table.HeadCell className="text-center">Nilai Skala</Table.HeadCell>
                  <Table.HeadCell className="text-center">Status</Table.HeadCell>
                  <Table.HeadCell className="text-center">Aksi</Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y text-center">
                  {loading ? (
                    <Table.Row><Table.Cell colSpan={6} className="py-10"><Spinner /></Table.Cell></Table.Row>
                  ) : reports.length > 0 ? reports.map((report) => (
                    <Table.Row key={report.Id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                      <Table.Cell className="font-bold text-lg text-primary">{report.Ranking}</Table.Cell>
                      <Table.Cell className="text-left font-bold text-gray-900 dark:text-white">
                        {report.Karyawan?.Nama}
                      </Table.Cell>
                      <Table.Cell>{report.Karyawan?.Nik}</Table.Cell>
                      <Table.Cell className="font-bold text-secondary text-base">{report.NilaiSkala}</Table.Cell>
                      <Table.Cell>
                        <Badge color={report.Ranking <= 3 ? "success" : "info"} size="sm">
                          {report.Ranking <= 3 ? "Prioritas" : "Sesuai"}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex justify-center gap-2">
                          <Button color="light" size="xs" pill onClick={() => handleFetchIndividual(report.Karyawan?.Id ?? 0)}>
                            {printingId === (report.Karyawan?.Id ?? 0) ? <Spinner size="xs" /> : <Icon icon="solar:eye-bold" className="h-4 w-4" />}
                            <span className="ml-1">Preview</span>
                          </Button>
                          <Button color="info" size="xs" pill onClick={() => handlePrintPdf(report.Karyawan?.Id ?? 0)}>
                            <Icon icon="solar:file-download-bold" className="h-4 w-4" />
                            <span className="ml-1">PDF</span>
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )) : (
                    <Table.Row>
                      <Table.Cell colSpan={6} className="py-10 text-gray-500 italic">Belum ada data penilaian pada periode ini.</Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table>
            </div>
          </CardBox>
        </div>
      </div>

      <IndividualReportModal
        show={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        data={individualData}
      />
    </div>
  );
};

export default ReportHasil;
