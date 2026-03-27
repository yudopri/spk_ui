"use client";
import React, { useState, useEffect } from "react";
import { Table, Button, Badge, Select, Spinner, Alert, Tabs, Pagination, TextInput } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import developerService, { AhpDebugData, MooraDebugData, AuditLog } from "@/services/developerService";
import periodeService, { Periode } from "@/services/periodeService";

const DeveloperPage = () => {
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number>(0);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [ahpData, setAhpData] = useState<AhpDebugData | null>(null);
  const [mooraData, setMooraData] = useState<MooraDebugData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audit Log Pagination & Search
  const [logPage, setLogPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalLogs, setTotalLogs] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPeriodes();
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [logPage, search]);

  const fetchPeriodes = async () => {
    try {
      const res = await periodeService.getAll(1, 100);
      setPeriodes(res.data);
      if (res.data.length > 0) setSelectedPeriodeId(res.data[0].id);
    } catch (err) {
      setError("Gagal mengambil periode");
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await developerService.getAuditLogs(logPage, pageSize, search);
      setAuditLogs(res.data);
      setTotalLogs(res.totalCount);
    } catch (err) {
      console.error("Gagal ambil audit logs");
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Icon icon="solar:code-bold-duotone" className="text-primary" />
            Developer Tools (Debug AHP/MOORA)
          </h1>
          <p className="text-sm text-gray-500">Audit logs dan pengecekan perhitungan SPK secara transparan</p>
        </div>
        <div className="flex gap-2">
           <Select sizing="sm" value={selectedPeriodeId} onChange={(e) => setSelectedPeriodeId(Number(e.target.value))}>
              {periodes.map(p => <option key={p.id} value={p.id}>{p.namaPeriode} - {p.divisi?.namaDivisi}</option>)}
           </Select>
           <Button color="primary" size="sm" onClick={handleFetchDebug} disabled={loading}>
              {loading ? <Spinner size="sm" /> : <Icon icon="solar:refresh-linear" className="mr-2" />}
              Fetch Debug Data
           </Button>
        </div>
      </div>

      {error && <Alert color="failure">{error}</Alert>}

      <Tabs variant="underline">
        <Tabs.Item active title="AHP Matrix" icon={() => <Icon icon="solar:chart-linear" className="mr-2" />}>
          {ahpData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <CardBox>
                    <h5 className="font-bold text-gray-400 uppercase text-xs">Inconsistency Index (CI)</h5>
                    <p className="text-2xl font-bold">{ahpData.ci.toFixed(6)}</p>
                 </CardBox>
                 <CardBox>
                    <h5 className="font-bold text-gray-400 uppercase text-xs">Consistency Ratio (CR)</h5>
                    <p className={`text-2xl font-bold ${ahpData.isConsistent ? 'text-success' : 'text-failure'}`}>
                      {ahpData.cr.toFixed(6)}
                    </p>
                 </CardBox>
                 <CardBox>
                    <h5 className="font-bold text-gray-400 uppercase text-xs">Status</h5>
                    <Badge color={ahpData.isConsistent ? 'success' : 'failure'} className="text-lg">
                      {ahpData.isConsistent ? 'KONSISTEN' : 'TIDAK KONSISTEN'}
                    </Badge>
                 </CardBox>
              </div>

              <CardBox>
                <h3 className="font-bold mb-4">Pairwise Comparison Matrix</h3>
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-center border-collapse">
                      <thead>
                        <tr>
                           <th className="p-2 border bg-gray-50">KPI \ KPI</th>
                           {ahpData.kpis.map(k => <th key={k.id} className="p-2 border bg-gray-50">{k.namaKpi}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {ahpData.matrix.map((row, i) => (
                          <tr key={i}>
                            <td className="p-2 border font-bold bg-gray-50">{ahpData.kpis[i].namaKpi}</td>
                            {row.map((val, j) => (
                              <td key={j} className={`p-2 border ${i===j ? 'bg-blue-50' : ''}`}>{val.toFixed(3)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </CardBox>

              <CardBox>
                <h3 className="font-bold mb-4">Final Weights (Eigenvector)</h3>
                <div className="flex flex-wrap gap-4">
                   {ahpData.weights.map((w, i) => (
                     <div key={i} className="flex-1 min-w-[150px] p-3 border rounded-lg bg-gray-50 dark:bg-gray-700">
                        <span className="text-xs text-gray-500 block">{ahpData.kpis[i].namaKpi}</span>
                        <span className="font-black text-lg">{(w * 100).toFixed(2)}%</span>
                     </div>
                   ))}
                </div>
              </CardBox>
            </div>
          ) : <div className="text-center py-20 text-gray-400 italic">Klik Fetch Debug Data untuk memuat analisis AHP.</div>}
        </Tabs.Item>

        <Tabs.Item title="MOORA Detail" icon={() => <Icon icon="solar:user-speak-rounded-linear" className="mr-2" />}>
           {mooraData ? (
             <CardBox>
                <h3 className="font-bold mb-4">Matrix Keputusan & Normalisasi</h3>
                <div className="overflow-x-auto">
                  <Table striped>
                    <Table.Head>
                      <Table.HeadCell>Karyawan</Table.HeadCell>
                      {mooraData.kpis.map(k => (
                        <Table.HeadCell key={k.id} className="text-center">
                          {k.namaKpi} <br/>
                          <Badge color="info" size="xs">w={k.bobot.toFixed(3)}</Badge>
                        </Table.HeadCell>
                      ))}
                    </Table.Head>
                    <Table.Body>
                      {/* Note: This is a simplified view of evaluations joined by employee */}
                      {Array.from(new Set(mooraData.evaluations.map(e => e.karyawanId))).map(empId => {
                        const emp = mooraData.evaluations.find(e => e.karyawanId === empId)?.karyawan;
                        return (
                          <Table.Row key={empId}>
                             <Table.Cell className="font-bold">{emp?.nama} ({emp?.nik})</Table.Cell>
                             {mooraData.kpis.map(k => {
                               const score = mooraData.evaluations.find(e => e.karyawanId === empId && e.kpiId === k.id)?.nilai;
                               return <td key={k.id} className="text-center p-3 border-b">{score ?? '-'}</td>
                             })}
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table>
                </div>
             </CardBox>
           ) : <div className="text-center py-20 text-gray-400 italic">Data debug MOORA akan tampil di sini.</div>}
        </Tabs.Item>

        <Tabs.Item title="Audit Logs" icon={() => <Icon icon="solar:history-bold-duotone" className="mr-2" />}>
           <CardBox>
             <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <div className="w-full md:w-64">
                   <TextInput 
                     placeholder="Cari logs..." 
                     icon={() => <Icon icon="solar:magnifer-linear" />} 
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                   />
                </div>
                <div className="text-sm text-gray-500">
                   Total: <b>{totalLogs}</b> entries
                </div>
             </div>
             <div className="overflow-x-auto mb-4">
               <Table hoverable>
                 <Table.Head>
                   <Table.HeadCell>Time</Table.HeadCell>
                   <Table.HeadCell>User</Table.HeadCell>
                   <Table.HeadCell>Action</Table.HeadCell>
                   <Table.HeadCell>Entity</Table.HeadCell>
                   <Table.HeadCell>Details</Table.HeadCell>
                   <Table.HeadCell>IP Address</Table.HeadCell>
                 </Table.Head>
                 <Table.Body>
                   {auditLogs.map(log => (
                     <Table.Row key={log.id}>
                       <Table.Cell className="whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</Table.Cell>
                       <Table.Cell className="font-bold">{log.username}</Table.Cell>
                       <Table.Cell>
                          <Badge color={
                             log.action === 'DELETE' ? 'failure' : 
                             log.action === 'CREATE' ? 'success' : 
                             log.action === 'LOGIN' ? 'warning' : 'info'
                          }>
                             {log.action}
                          </Badge>
                       </Table.Cell>
                       <Table.Cell>{log.entityName}</Table.Cell>
                       <Table.Cell className="text-xs text-gray-500 max-w-[300px] truncate" title={log.details}>
                          {log.details}
                       </Table.Cell>
                       <Table.Cell className="text-xs font-mono">{log.ipAddress}</Table.Cell>
                     </Table.Row>
                   ))}
                 </Table.Body>
               </Table>
             </div>
             <div className="flex justify-center">
                <Pagination
                   currentPage={logPage}
                   totalPages={Math.ceil(totalLogs / pageSize)}
                   onPageChange={(page) => setLogPage(page)}
                   showIcons
                />
             </div>
           </CardBox>
        </Tabs.Item>
      </Tabs>
    </div>
  );
};

export default DeveloperPage;