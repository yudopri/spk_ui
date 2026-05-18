"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Badge, Select, Spinner, Alert, Modal, Label, Textarea } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import dynamic from "next/dynamic";
import spkService, { SpkReport } from "@/services/spkService";
import periodeService, { Periode } from "@/services/periodeService";
import karyawanService from "@/services/karyawanService";
import { usePermission } from "@/hooks/usePermission";
import IndividualReportModal from "@/app/components/shared/IndividualReportModal";
import { isManagerRole } from "@/utils/accessControl";
import { useEffect as useClientEffect } from "react";
import PerformanceEvaluationForm from "@/app/components/shared/PerformanceEvaluationForm";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const ReportHasil = () => {
  const { user, isKaryawan, isAdminLike, isManager } = usePermission();
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number>(0);
  const [selectedLokasi, setSelectedLokasi] = useState<string>("");
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [lokasiOptions, setLokasiOptions] = useState<{id: any, name: string}[]>([]);
  const [reports, setReports] = useState<SpkReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPeriode, setSelectedPeriode] = useState<Periode | null>(null);

  const isFinal = selectedPeriode?.Status === 'Final';

  // Individual Report State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [individualData, setIndividualData] = useState<any>(null);
  const [printingId, setPrintingId] = useState<number | null>(null);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewReportId, setReviewReportId] = useState<number | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    status: 'Reviewed' as 'Reviewed' | 'Draft' | 'Pending',
    catatan_prestasi: '',
    catatan_indisipliner: '',
    catatan_saran: ''
  });

  const allReviewed = useMemo(() => {
    if (reports.length === 0) return false;
    return reports.every(r => r.Status === 'Reviewed');
  }, [reports]);

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
        
        // Refresh detail periode dari DB untuk sinkronisasi status terbaru
        const resP_Single = await periodeService.getAll(1, 100);
        const latestP = resP_Single.data.find((p: any) => (p.id || p.Id) === selectedPeriodeId);
        if (latestP) setSelectedPeriode(latestP);

        const res = await spkService.getReport(selectedPeriodeId, 1, 100, selectedLokasi || undefined);
        const rawReports = res.data || [];
        const isManagerUI_Local = isManagerRole(localStorage.getItem('userRole'));
        const scoped = rawReports.filter((item) => {
          if (isKaryawan) {
            const employeeId = Number(item.Karyawan?.Id ?? 0);
            return employeeId === Number(user?.employee_id ?? 0);
          }

          if (isAdminLike && user?.dept_id && !isManagerUI_Local) {
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
  }, [selectedPeriodeId, selectedLokasi, isKaryawan, isAdminLike, isManager, user?.employee_id, user?.dept_id]);

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
      const url = `/spk/report/summary/${selectedPeriodeId}?format=excel`;
      await spkService.downloadReport(url, `Rekapitulasi_Hasil_Periode_${selectedPeriodeId}.xlsx`);
    } catch (err) {
      setError("Gagal melakukan ekspor rekapitulasi");
    } finally {
      setExporting(false);
    }
  };

  const handlePrintPdf = async (karyawanId: number) => {
    if (!selectedPeriodeId) return;
    try {
      setPrintingId(karyawanId);
      const url = `/spk/report/individual/${selectedPeriodeId}/${karyawanId}?format=pdf`;
      await spkService.downloadReport(url, `Laporan_KPI_${karyawanId}.pdf`);
    } catch (err) {
      setError("Gagal mengunduh laporan PDF");
    } finally {
      setPrintingId(null);
    }
  };

  const handleReview = async () => {
    if (!reviewReportId) return;
    try {
      setReviewLoading(true);
      
      // Gabungkan catatan menjadi string format JSON atau terstruktur jika backend belum support 3 field
      // Mengikuti pola existing reviewMooraResult(id, catatan, status)
      const combinedNote = JSON.stringify({
        p: reviewForm.catatan_prestasi,
        i: reviewForm.catatan_indisipliner,
        s: reviewForm.catatan_saran
      });

      const res = await spkService.reviewMooraResult(reviewReportId, combinedNote, reviewForm.status);
      if (res.success) {
        setShowReviewModal(false);
        setReviewForm({
            status: 'Reviewed',
            catatan_prestasi: '',
            catatan_indisipliner: '',
            catatan_saran: ''
        });
        setReviewReportId(null);
        // Refresh data
        window.location.reload(); 
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal menyimpan review");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleUpdateStatus = async (status: 'Final' | 'Draft') => {
    if (!selectedPeriodeId) return;
    if (!confirm(`Apakah Anda yakin ingin mengubah status periode ini menjadi ${status}?` + 
      (status === 'Final' ? '\n\nStatus Final akan membubuhkan tanda tangan digital Anda pada semua laporan.' : ''))) return;

    try {
      setUpdating(true);
      const res = await spkService.updateStatus(selectedPeriodeId, status);
      if (res.success) {
        // Refresh data secara menyeluruh untuk sinkronisasi realtime
        const resP = await periodeService.getAll(1, 100);
        setPeriodes(resP.data);
        
        // Update selectedPeriode secara manual untuk segera mengubah state UI
        const updatedP = resP.data.find((p: any) => (p.id || p.Id) === selectedPeriodeId);
        if (updatedP) setSelectedPeriode(updatedP);
        
        // Refresh laporan untuk memperbarui status per baris
        const resR = await spkService.getReport(selectedPeriodeId, 1, 100, selectedLokasi || undefined);
        setReports(resR.data || []);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || `Gagal mengubah status menjadi ${status}`);
    } finally {
      setUpdating(false);
    }
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

  const [isManagerUI, setIsManagerUI] = useState(false);
  
  useClientEffect(() => {
    const role = localStorage.getItem('userRole');
    setIsManagerUI(isManagerRole(role));
  }, []);

  const canExport = exporting || !selectedPeriodeId || (!isFinal && !isManagerUI);

  const getStatusBadge = (status?: string) => {
    const s = (status || 'Draft').toLowerCase();
    if (s === 'reviewed') return <Badge color="success" icon={() => <Icon icon="solar:check-circle-bold" className="mr-1 h-3 w-3" />}>Reviewed</Badge>;
    if (s === 'pending') return <Badge color="warning" icon={() => <Icon icon="solar:clock-circle-bold" className="mr-1 h-3 w-3" />}>Pending</Badge>;
    return <Badge color="gray" icon={() => <Icon icon="solar:file-text-bold" className="mr-1 h-3 w-3" />}>Draft</Badge>;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Stepper for Laporan */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto overflow-x-auto gap-4">
          {[
            { step: 1, label: "Master KPI", icon: "solar:settings-bold" },
            { step: 2, label: "Bandingkan Grup", icon: "solar:folder-2-bold" },
            { step: 3, label: "Bandingkan KPI", icon: "solar:documents-bold" },
            { step: 4, label: "Input Nilai", icon: "solar:pen-new-square-bold" },
            { step: 5, label: "Hasil & Review", icon: "solar:chart-square-bold" }
          ].map((s, idx) => {
            const isCurrent = s.step === 5;
            const isDone = s.step < 5;
            return (
              <React.Fragment key={s.step}>
                <div className="flex flex-col items-center min-w-[100px] text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    isCurrent ? "bg-primary text-white ring-4 ring-primary/20" : 
                    isDone ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                  }`}>
                    <Icon icon={isDone ? "solar:check-read-bold" : s.icon} className="h-5 w-5" />
                  </div>
                  <span className={`text-xs font-bold whitespace-nowrap ${isCurrent ? "text-primary" : "text-gray-500"}`}>{s.label}</span>
                </div>
                {idx < 4 && <div className={`flex-1 h-[2px] min-w-[20px] mb-6 ${isDone ? "bg-green-500" : "bg-gray-100"}`} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

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
             
             <div className="flex gap-2">
                {!isFinal && (
                  <Button 
                    color="success" 
                    size="sm" 
                    onClick={() => handleUpdateStatus('Final')} 
                    disabled={updating || !isManagerUI || !allReviewed}
                    title={!isManagerUI ? "Hanya Manager yang dapat melakukan finalisasi" : !allReviewed ? "Semua karyawan harus direview secara individual terlebih dahulu" : ""}
                  >
                    {updating ? <Spinner size="sm" /> : <Icon icon="solar:check-read-linear" className="mr-2 h-4 w-4" />}
                    Finalkan Laporan
                  </Button>
                )}
                {isFinal && isManagerUI && (
                  <Button 
                    color="warning" 
                    size="sm" 
                    onClick={() => handleUpdateStatus('Draft')} 
                    disabled={updating}
                  >
                    {updating ? <Spinner size="sm" /> : <Icon icon="solar:undo-left-round-linear" className="mr-2 h-4 w-4" />}
                    Kembalikan ke Draft
                  </Button>
                )}
                <Button color="dark" size="sm" className="flex items-center" onClick={handleExportSummary} disabled={Boolean(canExport)}>
                    {exporting ? <Spinner size="sm" className="mr-2" /> : <Icon icon="solar:file-send-bold" className="mr-2 h-4 w-4" />}
                    Ekspor Rekapitulasi
                </Button>
             </div>
        </div>
      </div>

      {!isFinal && !loading && (
        <Alert color="warning" className="mb-4" icon={() => <Icon icon="solar:info-circle-bold" className="h-5 w-5" />}>
          Laporan ini masih berstatus <b>DRAFT</b>. 
          {isManagerUI ? " Silakan klik 'Finalkan Laporan' untuk memberikan persetujuan." : " Menunggu persetujuan dari Manager untuk status Final."}
        </Alert>
      )}

      {error && <Alert color="failure" className="mb-4" onDismiss={() => setError(null)}>{error}</Alert>}

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
                    <Table.HeadCell className="text-center">Catatan</Table.HeadCell>
                    <Table.HeadCell className="text-center">Aksi</Table.HeadCell>
                  </Table.Head>
                  <Table.Body className="divide-y text-center">
                    {loading ? (
                      <Table.Row><Table.Cell colSpan={7} className="py-10"><Spinner /></Table.Cell></Table.Row>
                    ) : reports.length > 0 ? reports.map((report) => (
                      <Table.Row key={report.Id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                        <Table.Cell className="font-bold text-lg text-primary">{report.Ranking}</Table.Cell>
                        <Table.Cell className="text-left font-bold text-gray-900 dark:text-white">
                          {report.Karyawan?.Nama}
                        </Table.Cell>
                        <Table.Cell>{report.Karyawan?.Nik}</Table.Cell>
                        <Table.Cell className="font-bold text-secondary text-base">{report.NilaiSkala}</Table.Cell>
                        <Table.Cell>
                          {getStatusBadge(isFinal ? "Final" : report.Status)}
                        </Table.Cell>
                        <Table.Cell className="max-w-xs truncate text-xs italic text-gray-500">
                          {report.Catatan || "-"}
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex justify-center gap-2">
                            {isManagerUI && !isFinal && (
                              <Button 
                                color="info" 
                                size="xs" 
                                pill 
                                onClick={() => {
                                  setReviewReportId(report.Id);
                                  
                                  // Inisialisasi form review
                                  let p = "", i = "", s = "";
                                  try {
                                    if (report.Catatan?.startsWith('{')) {
                                      const parsed = JSON.parse(report.Catatan);
                                      p = parsed.p || "";
                                      i = parsed.i || "";
                                      s = parsed.s || "";
                                    } else {
                                      p = report.Catatan || "";
                                    }
                                  } catch (e) {
                                    p = report.Catatan || "";
                                  }

                                  setReviewForm({
                                    status: (report.Status as any) || 'Reviewed',
                                    catatan_prestasi: p,
                                    catatan_indisipliner: i,
                                    catatan_saran: s
                                  });
                                  setShowReviewModal(true);
                                }}
                              >
                                <Icon icon="solar:notes-minimalistic-bold" className="h-4 w-4" />
                                <span className="ml-1">Review</span>
                              </Button>
                            )}
                            <Button color="light" size="xs" pill onClick={() => handleFetchIndividual(report.Karyawan?.Id ?? 0)}>
                              {printingId === (report.Karyawan?.Id ?? 0) ? <Spinner size="xs" /> : <Icon icon="solar:eye-bold" className="h-4 w-4" />}
                              <span className="ml-1">Preview</span>
                            </Button>
                            <Button 
                              color="dark" 
                              size="xs" 
                              pill 
                              disabled={!isFinal || (printingId === (report.Karyawan?.Id ?? 0))}
                              onClick={() => handlePrintPdf(report.Karyawan?.Id ?? 0)}
                            >
                              <Icon icon="solar:printer-bold" className="h-4 w-4" />
                              <span className="ml-1">PDF</span>
                            </Button>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    )) : (
                      <Table.Row>
                        <Table.Cell colSpan={7} className="py-10 text-gray-500 italic">Belum ada data penilaian pada periode ini.</Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
              </Table>
            </div>
          </CardBox>
        </div>
      </div>

      {/* Review & Notes Modal */}
      <Modal show={showReviewModal} onClose={() => setShowReviewModal(false)} size="lg">
        <Modal.Header>Review Laporan & Catatan Evaluasi</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label value="Status Persetujuan" />
              <Select 
                value={reviewForm.status} 
                onChange={(e) => setReviewForm({...reviewForm, status: e.target.value as any})}
              >
                <option value="Reviewed">SETUJUI (Reviewed)</option>
                <option value="Pending">TUNDA (Pending)</option>
                <option value="Draft">KEMBALIKAN KE DRAFT</option>
              </Select>
            </div>
            
            <div className="border-t pt-4 space-y-3">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-widest">Catatan Kualitatif</h4>
              
              <div>
                <Label value="1. Prestasi yang perlu dicatat" className="text-[10px] uppercase" />
                <Textarea 
                  placeholder="Contoh: Sangat proaktif dalam tim..."
                  rows={2}
                  value={reviewForm.catatan_prestasi}
                  onChange={(e) => setReviewForm({...reviewForm, catatan_prestasi: e.target.value})}
                />
              </div>

              <div>
                <Label value="2. Indisipliner / Pelanggaran" className="text-[10px] uppercase" />
                <Textarea 
                  placeholder="Contoh: Terlambat tanpa izin 2x..."
                  rows={2}
                  value={reviewForm.catatan_indisipliner}
                  onChange={(e) => setReviewForm({...reviewForm, catatan_indisipliner: e.target.value})}
                />
              </div>

              <div>
                <Label value="3. Saran Perbaikan" className="text-[10px] uppercase" />
                <Textarea 
                  placeholder="Contoh: Tingkatkan ketelitian data..."
                  rows={2}
                  value={reviewForm.catatan_saran}
                  onChange={(e) => setReviewForm({...reviewForm, catatan_saran: e.target.value})}
                />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" onClick={handleReview} disabled={reviewLoading}>
            {reviewLoading ? <Spinner size="sm" /> : "Simpan Review"}
          </Button>
          <Button color="gray" onClick={() => setShowReviewModal(false)}>Batal</Button>
        </Modal.Footer>
      </Modal>

      {/* Individual Report - WBA Official Style */}
      <Modal show={showPrintModal} onClose={() => setShowPrintModal(false)} size="5xl">
        <Modal.Header className="print:hidden">Pratinjau Laporan Resmi</Modal.Header>
        <Modal.Body className="p-0 bg-gray-100">
           {individualData && (
             <PerformanceEvaluationForm 
                data={{
                  employeeName: individualData.metadata.Nama,
                  jabatan: individualData.metadata.Jabatan || "Karyawan",
                  periode: individualData.metadata.Periode,
                  lokasi: individualData.metadata.Lokasi || "JAKARTA",
                  totalScore: individualData.kesimpulan.Skor,
                  evaluator: individualData.metadata.DibuatOleh || user?.name || "SUPERVISOR",
                  approver: individualData.metadata.DisetujuiOleh || "HR MANAGER",
                  scores: individualData.rincian.reduce((acc: any, item: any) => {
                    // Mapping kriteria ke ID yang dikenal form
                    acc[item.Kriteria.toLowerCase().replace(/\s/g, '_')] = item.Nilai;
                    return acc;
                  }, {}),
                  notes: {
                    prestasi: individualData.metadata.CatatanPrestasi || "-",
                    indisipliner: individualData.metadata.CatatanIndisipliner || "-",
                    saran: individualData.metadata.CatatanSaran || "-"
                  }
                }}
             />
           )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ReportHasil;
