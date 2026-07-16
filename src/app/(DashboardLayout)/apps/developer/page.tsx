"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Badge, Select, Spinner, Alert, Tabs, Tooltip } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import developerService, { AhpDebugData, MooraDebugData, AuditLog } from "@/services/developerService";
import periodeService, { Periode } from "@/services/periodeService";
import RoleGuard from "@/app/components/shared/RoleGuard";
import DataTable, { Column } from "@/app/components/shared/DataTable";
import DataPagination from "@/app/components/shared/DataPagination";
import DataSearch from "@/app/components/shared/DataSearch";

const DeveloperPage = () => {
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number>(0);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [periodeLoading, setPeriodeLoading] = useState(true);
  const [ahpData, setAhpData] = useState<AhpDebugData | null>(null);
  const [mooraData, setMooraData] = useState<MooraDebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [logPage, setLogPage] = useState(1);
  const [logPageSize, setLogPageSize] = useState(10);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logSearch, setLogSearch] = useState("");
  const [debouncedLogSearch, setDebouncedLogSearch] = useState("");

  useEffect(() => {
    fetchPeriodes();
  }, []);

  const fetchPeriodes = async () => {
    try {
      setPeriodeLoading(true);
      const res = await periodeService.getAll(1, 100);
      setPeriodes(res.data);
      if (res.data.length > 0) setSelectedPeriodeId(res.data[0].id);
    } catch (err) {
      setError("Gagal mengambil periode");
    } finally {
      setPeriodeLoading(false);
    }
  };

  const handleFetchDebug = async () => {
    if (!selectedPeriodeId) return;
    setLoading(true);
    setError(null);
    try {
      const [ahpRes, mooraRes] = await Promise.all([
        developerService.getAhpDebug(selectedPeriodeId),
        developerService.getMooraDebug(selectedPeriodeId)
      ]);
      setAhpData(ahpRes.data);
      setMooraData(mooraRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal mengambil data debug");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      setAuditError(null);
      const res = await developerService.getAuditLogs(logPage, logPageSize, debouncedLogSearch);
      setAuditLogs(res.data || []);
      setTotalLogs(res.meta?.total || 0);
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      if (status === 404) {
        setAuditError("Endpoint audit logs belum tersedia di backend saat ini.");
      } else if (status === 401) {
        setAuditError("Sesi login berakhir saat mengambil audit logs.");
      } else if (status === 403) {
        setAuditError("Anda tidak memiliki izin untuk melihat audit logs.");
      } else {
        setAuditError(err?.message || "Gagal mengambil audit logs.");
      }
      setAuditLogs([]);
      setTotalLogs(0);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [logPage, logPageSize, debouncedLogSearch]);

  // Debounce audit log search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLogSearch(logSearch);
      setLogPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [logSearch]);

  // --- MOORA client-side computation (fallback / verification) ---
  const mooraResult = useMemo(() => {
    if (!mooraData || mooraData.evaluations.length === 0 || mooraData.kpis.length === 0) return null;

    const empIds = Array.from(new Set(mooraData.evaluations.map(e => e.karyawanId)));
    const kpis = mooraData.kpis;

    // Build raw matrix: raw[empIdx][kpiIdx]
    const raw: number[][] = empIds.map(empId =>
      kpis.map(k => {
        const ev = mooraData.evaluations.find(e => e.karyawanId === empId && e.kpiId === k.id);
        return ev?.nilai ?? 0;
      })
    );

    // Column max & min
    const colMax = kpis.map((_, ki) => Math.max(...raw.map(r => r[ki])));
    const colMin = kpis.map((_, ki) => Math.min(...raw.map(r => r[ki])));

    // Normalized matrix: benefit → x/max, cost → min/x
    const normalized: number[][] = raw.map((row, ri) =>
      row.map((val, ki) => {
        const kpi = kpis[ki];
        if (kpi.tipe?.toLowerCase() === 'cost') {
          return colMin[ki] !== 0 ? colMin[ki] / val : 0;
        }
        return colMax[ki] !== 0 ? val / colMax[ki] : 0;
      })
    );

    // Weighted normalized & final scores
    const weighted: number[][] = normalized.map(row =>
      row.map((val, ki) => val * kpis[ki].bobot)
    );
    const scores = weighted.map(row => row.reduce((s, v) => s + v, 0));

    // Rank (descending)
    const ranked = scores
      .map((score, idx) => ({ empId: empIds[idx], score }))
      .sort((a, b) => b.score - a.score)
      .map((item, rank) => ({ ...item, rank: rank + 1 }));

    return { empIds, raw, normalized, weighted, scores, ranked, kpis };
  }, [mooraData]);

  // --- AHP pairwise comparisons list ---
  const ahpComparisons = useMemo(() => {
    if (!ahpData?.comparisons) return [];
    return ahpData.comparisons;
  }, [ahpData]);

  const auditColumns: Column<AuditLog>[] = [
    {
      header: "Waktu",
      render: (item) => (
        <span className="whitespace-nowrap text-sm">{new Date(item.createdAt).toLocaleString("id-ID")}</span>
      ),
    },
    {
      header: "Pengguna",
      render: (item) => <span className="font-bold text-gray-900 dark:text-white">{item.name}</span>,
    },
    {
      header: "Aksi",
      render: (item) => (
        <Badge color={
          item.action === 'DELETE' ? 'failure' :
          item.action === 'CREATE' ? 'success' :
          item.action === 'LOGIN' ? 'warning' : 'info'
        }>
          {item.action}
        </Badge>
      ),
    },
    {
      header: "Entitas",
      render: (item) => <span className="font-medium">{item.entityName}</span>,
    },
    {
      header: "Detail",
      render: (item) => (
        <span className="text-xs text-gray-500 max-w-[300px] truncate block" title={item.details}>
          {item.details}
        </span>
      ),
    },
    {
      header: "IP Address",
      render: (item) => <span className="text-xs font-mono">{item.ipAddress}</span>,
    },
  ];

  return (
    <RoleGuard allow={["Dev", "Manager"]}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Icon icon="solar:code-bold-duotone" className="text-primary" />
              Alat Pengembang (Debug Perhitungan)
            </h1>
            <p className="text-sm text-gray-500">Pengecekan dan validasi perhitungan penilaian kinerja secara transparan</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Select
              sizing="sm"
              value={selectedPeriodeId}
              onChange={(e) => setSelectedPeriodeId(Number(e.target.value))}
              disabled={periodeLoading}
              className="w-full md:w-64"
            >
              {periodeLoading && <option>Memuat periode...</option>}
              {!periodeLoading && periodes.length === 0 && <option value={0}>Tidak ada periode</option>}
              {periodes.map(p => (
                <option key={p.id} value={p.id}>
                  {p.namaPeriode} - {p.divisi?.namaDivisi || "Semua Divisi"}
                </option>
              ))}
            </Select>
            <Button
              color="primary"
              size="sm"
              onClick={handleFetchDebug}
              disabled={loading || !selectedPeriodeId}
            >
              {loading ? <Spinner size="sm" className="mr-2" /> : <Icon icon="solar:refresh-linear" className="mr-2 h-4 w-4" />}
              Ambil Data Debug
            </Button>
          </div>
        </div>

        {error && <Alert color="failure">{error}</Alert>}

        {/* Tabs */}
        <Tabs variant="underline">
          {/* ========== AHP TAB ========== */}
          <Tabs.Item active title="Matriks Perbandingan" icon={() => <Icon icon="solar:chart-linear" className="mr-2" />}>
            {ahpData ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CardBox>
                    <h5 className="font-bold text-gray-400 uppercase text-xs">Indeks Ketidak Konsistenan (CI)</h5>
                    <p className="text-2xl font-bold font-mono">{ahpData.ci.toFixed(6)}</p>
                  </CardBox>
                  <CardBox>
                    <h5 className="font-bold text-gray-400 uppercase text-xs">Consistency Ratio (CR)</h5>
                    <p className={`text-2xl font-bold font-mono ${ahpData.isConsistent ? 'text-success' : 'text-failure'}`}>
                      {ahpData.cr.toFixed(6)}
                    </p>
                  </CardBox>
                  <CardBox>
                    <h5 className="font-bold text-gray-400 uppercase text-xs">Status Konsistensi</h5>
                    <Badge color={ahpData.isConsistent ? 'success' : 'failure'} className="text-lg w-fit mt-1">
                      {ahpData.isConsistent ? '✓ KONSISTEN' : '✗ TIDAK KONSISTEN'}
                    </Badge>
                  </CardBox>
                </div>

                {/* Pairwise Matrix */}
                <CardBox>
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Icon icon="solar:matrix-bold" className="text-primary" />
                    Matriks Perbandingan Kriteria
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 border bg-gray-50 dark:bg-gray-700 text-left">KPI \ KPI</th>
                          {ahpData.kpis.map(k => (
                            <th key={k.id} className="p-2 border bg-gray-50 dark:bg-gray-700">{k.namaKpi}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ahpData.matrix.map((row, i) => (
                          <tr key={i}>
                            <td className="p-2 border font-bold bg-gray-50 dark:bg-gray-700 text-left whitespace-nowrap">
                              {ahpData.kpis[i].namaKpi}
                            </td>
                            {row.map((val, j) => (
                              <td key={j} className={`p-2 border font-mono ${i === j ? 'bg-blue-50 dark:bg-blue-900/30 font-bold' : ''}`}>
                                {val.toFixed(3)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBox>

                {/* Weights Bar */}
                <CardBox>
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Icon icon="solar:weight-bold" className="text-primary" />
                    Final Weights (Eigenvector)
                  </h3>
                  <div className="space-y-3">
                    {ahpData.weights.map((w, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-sm font-medium w-40 truncate" title={ahpData.kpis[i].namaKpi}>
                          {ahpData.kpis[i].namaKpi}
                        </span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full flex items-center justify-end pr-2 transition-all"
                            style={{ width: `${Math.max(w * 100, 5)}%` }}
                          >
                            <span className="text-[10px] font-bold text-white">{(w * 100).toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBox>

                {/* Pairwise Comparisons List */}
                {ahpComparisons.length > 0 && (
                  <CardBox>
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <Icon icon="solar:scale-bold" className="text-primary" />
                      Daftar Perbandingan Kriteria
                    </h3>
                    <div className="overflow-x-auto">
                      <Table striped hoverable>
                        <Table.Head>
                          <Table.HeadCell>KPI A</Table.HeadCell>
                          <Table.HeadCell className="text-center">vs</Table.HeadCell>
                          <Table.HeadCell>KPI B</Table.HeadCell>
                          <Table.HeadCell className="text-center">Nilai</Table.HeadCell>
                          <Table.HeadCell>Keterangan</Table.HeadCell>
                        </Table.Head>
                        <Table.Body>
                          {ahpComparisons.map((c) => (
                            <Table.Row key={c.id}>
                              <Table.Cell className="font-bold">{c.kpiAName}</Table.Cell>
                              <Table.Cell className="text-center text-gray-400">⟷</Table.Cell>
                              <Table.Cell className="font-bold">{c.kpiBName}</Table.Cell>
                              <Table.Cell className="text-center font-mono font-bold">{c.nilai.toFixed(3)}</Table.Cell>
                              <Table.Cell className="text-xs text-gray-500">
                                {c.nilai === 1 ? 'Sama penting' :
                                 c.nilai > 1 ? `${c.nilai.toFixed(1)}× lebih penting dari ${c.kpiBName}` :
                                 `${(1/c.nilai).toFixed(1)}× lebih penting ${c.kpiAName}`}
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table>
                    </div>
                  </CardBox>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400 italic">
                <Icon icon="solar:chart-square-bold" className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>Klik <b>Ambil Data Debug</b> untuk memuat analisis perbandingan kriteria.</p>
              </div>
            )}
          </Tabs.Item>

          {/* ========== MOORA TAB ========== */}
          <Tabs.Item title="Detail Penilaian" icon={() => <Icon icon="solar:user-speak-rounded-linear" className="mr-2" />}>
            {mooraData && mooraResult ? (
              <div className="space-y-6">
                {/* Raw Score Matrix */}
                <CardBox>
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Icon icon="solar:table-bold" className="text-primary" />
                    Matrix Keputusan (Nilai Asli)
                  </h3>
                  <div className="overflow-x-auto">
                    <Table striped>
                      <Table.Head>
                        <Table.HeadCell>Karyawan</Table.HeadCell>
                        {mooraResult.kpis.map(k => (
                          <Table.HeadCell key={k.id} className="text-center">
                            {k.namaKpi}
                            <br />
                            <Badge color={k.tipe?.toLowerCase() === 'cost' ? 'failure' : 'success'} size="xs">
                              {k.tipe?.toLowerCase() === 'cost' ? 'Cost' : 'Benefit'} · w={k.bobot.toFixed(3)}
                            </Badge>
                          </Table.HeadCell>
                        ))}
                      </Table.Head>
                      <Table.Body>
                        {mooraResult.empIds.map((empId, ei) => {
                          const emp = mooraData.evaluations.find(e => e.karyawanId === empId)?.karyawan;
                          return (
                            <Table.Row key={empId}>
                              <Table.Cell className="font-bold whitespace-nowrap">
                                {emp?.nama} <span className="text-xs text-gray-400">({emp?.nik})</span>
                              </Table.Cell>
                              {mooraResult.raw[ei].map((val, ki) => (
                                <td key={ki} className="text-center p-3 border-b font-mono">{val}</td>
                              ))}
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table>
                  </div>
                </CardBox>

                {/* Normalized Matrix */}
                <CardBox>
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Icon icon="solar:normalize-bold" className="text-primary" />
                    Matrix Normalisasi
                    <Badge color="gray" size="xs" className="ml-2">Benefit: x/max · Cost: min/x</Badge>
                  </h3>
                  <div className="overflow-x-auto">
                    <Table striped>
                      <Table.Head>
                        <Table.HeadCell>Karyawan</Table.HeadCell>
                        {mooraResult.kpis.map(k => (
                          <Table.HeadCell key={k.id} className="text-center text-xs">
                            {k.namaKpi}
                          </Table.HeadCell>
                        ))}
                      </Table.Head>
                      <Table.Body>
                        {mooraResult.empIds.map((empId, ei) => {
                          const emp = mooraData.evaluations.find(e => e.karyawanId === empId)?.karyawan;
                          return (
                            <Table.Row key={empId}>
                              <Table.Cell className="font-bold whitespace-nowrap">
                                {emp?.nama}
                              </Table.Cell>
                              {mooraResult.normalized[ei].map((val, ki) => (
                                <td key={ki} className="text-center p-3 border-b font-mono text-sm">
                                  {val.toFixed(4)}
                                </td>
                              ))}
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table>
                  </div>
                </CardBox>

                {/* Final Ranking */}
                <CardBox>
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Icon icon="solar:trophy-bold" className="text-primary" />
                    Hasil Akhir & Ranking
                  </h3>
                  <div className="overflow-x-auto">
                    <Table striped>
                      <Table.Head>
                        <Table.HeadCell className="text-center w-16">Rank</Table.HeadCell>
                        <Table.HeadCell>Karyawan</Table.HeadCell>
                        <Table.HeadCell className="text-center">Skor Akhir (Yi)</Table.HeadCell>
                        <Table.HeadCell className="text-center">Status</Table.HeadCell>
                      </Table.Head>
                      <Table.Body>
                        {mooraResult.ranked.map((item) => {
                          const emp = mooraData.evaluations.find(e => e.karyawanId === item.empId)?.karyawan;
                          return (
                            <Table.Row key={item.empId}>
                              <Table.Cell className="text-center">
                                <Badge color={item.rank === 1 ? 'success' : item.rank === 2 ? 'warning' : 'gray'} className="w-fit mx-auto">
                                  #{item.rank}
                                </Badge>
                              </Table.Cell>
                              <Table.Cell className="font-bold">{emp?.nama} ({emp?.nik})</Table.Cell>
                              <Table.Cell className="text-center font-mono font-bold text-lg">
                                {item.score.toFixed(6)}
                              </Table.Cell>
                              <Table.Cell className="text-center">
                                {item.rank === 1 && <Badge color="success">Terbaik</Badge>}
                                {item.rank === 2 && <Badge color="warning">Runner Up</Badge>}
                                {item.rank > 2 && <Badge color="gray">#{item.rank}</Badge>}
                              </Table.Cell>
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table>
                  </div>
                </CardBox>
              </div>
            ) : mooraData ? (
              <div className="text-center py-20 text-gray-400 italic">
                <Icon icon="solar:database-bold" className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>Data evaluasi kosong untuk periode ini. Pastikan sudah ada input nilai karyawan.</p>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400 italic">
                <Icon icon="solar:user-speak-rounded-bold" className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>Klik <b>Ambil Data Debug</b> untuk memuat detail perhitungan penilaian.</p>
              </div>
            )}
          </Tabs.Item>

          {/* ========== AUDIT LOGS TAB ========== */}
          <Tabs.Item title="Audit Logs" icon={() => <Icon icon="solar:history-bold" className="mr-2" />}>
            <div className="space-y-4">
              {auditError && <Alert color="warning">{auditError}</Alert>}

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <DataSearch
                  placeholder="Cari logs (User/Action/Entity)..."
                  onSearch={(val) => {
                    setLogSearch(val);
                    setLogPage(1);
                  }}
                />
                <div className="text-sm text-gray-500">
                  Total: <b>{totalLogs}</b> entri
                </div>
              </div>

              <DataTable
                data={auditLogs}
                columns={auditColumns}
                loading={auditLoading}
                rowKey={(item) => item.id}
                emptyMessage="Tidak ada audit log ditemukan."
              />

              <DataPagination
                currentPage={logPage}
                totalItems={totalLogs}
                pageSize={logPageSize}
                onPageChange={setLogPage}
                onPageSizeChange={(size) => {
                  setLogPageSize(size);
                  setLogPage(1);
                }}
              />
            </div>
          </Tabs.Item>
        </Tabs>
      </div>
    </RoleGuard>
  );
};

export default DeveloperPage;