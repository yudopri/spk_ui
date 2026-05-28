"use client";
import React, { useState, useEffect } from "react";
import { Table, Badge, Spinner, Alert, Pagination, TextInput } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import developerService, { AuditLog } from "@/services/developerService";
import RoleGuard from "@/app/components/shared/RoleGuard";

const AuditLogsPage = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Audit Log Pagination & Search
  const [logPage, setLogPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalLogs, setTotalLogs] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setLogPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchAuditLogs();
  }, [logPage, debouncedSearch]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setAuditError(null);
      const res = await developerService.getAuditLogs(logPage, pageSize, debouncedSearch);
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
      setLoading(false);
    }
  };

  return (
    <RoleGuard permissions={["user_manage"]}>
      <div className="flex flex-col gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Icon icon="solar:history-bold-duotone" className="text-primary" />
            Audit Logs System
          </h1>
          <p className="text-sm text-gray-500">Rekam jejak aktivitas pengguna di dalam sistem</p>
        </div>

        {auditError && <Alert color="warning">{auditError}</Alert>}

        <CardBox>
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="w-full md:w-64">
              <TextInput 
                placeholder="Cari logs (User/Action/Entity)..." 
                icon={() => <Icon icon="solar:magnifer-linear" />} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="text-sm text-gray-500">
              Total Entri: <b>{totalLogs}</b>
            </div>
          </div>

          <div className="overflow-x-auto mb-4">
            <Table hoverable striped>
              <Table.Head>
                <Table.HeadCell>Waktu</Table.HeadCell>
                <Table.HeadCell>Pengguna</Table.HeadCell>
                <Table.HeadCell>Aksi</Table.HeadCell>
                <Table.HeadCell>Entitas</Table.HeadCell>
                <Table.HeadCell>Detail Perubahan</Table.HeadCell>
                <Table.HeadCell>IP Address</Table.HeadCell>
              </Table.Head>
              <Table.Body>
                {loading ? (
                  <Table.Row>
                    <Table.Cell colSpan={6} className="text-center py-20">
                      <Spinner size="lg" />
                    </Table.Cell>
                  </Table.Row>
                ) : auditLogs.length > 0 ? auditLogs.map(log => (
                  <Table.Row key={log.id}>
                    <Table.Cell className="whitespace-nowrap">{new Date(log.timestamp).toLocaleString("id-ID")}</Table.Cell>
                    <Table.Cell className="font-bold text-gray-900 dark:text-white">{log.username}</Table.Cell>
                    <Table.Cell>
                      <Badge color={
                        log.action === 'DELETE' ? 'failure' : 
                        log.action === 'CREATE' ? 'success' : 
                        log.action === 'LOGIN' ? 'warning' : 'info'
                      }>
                        {log.action}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="font-medium">{log.entityName}</Table.Cell>
                    <Table.Cell className="text-xs text-gray-500 max-w-[400px] break-words" title={log.details}>
                      {log.details}
                    </Table.Cell>
                    <Table.Cell className="text-xs font-mono">{log.ipAddress}</Table.Cell>
                  </Table.Row>
                )) : (
                  <Table.Row>
                    <Table.Cell colSpan={6} className="text-center py-12 text-gray-500 italic">
                      {auditError ? "Data tidak dapat dimuat." : "Tidak ada catatan aktivitas yang ditemukan."}
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          </div>

          <div className="flex justify-center">
            <Pagination
              currentPage={logPage}
              totalPages={Math.max(1, Math.ceil(totalLogs / pageSize))}
              onPageChange={(page) => setLogPage(page)}
              showIcons
            />
          </div>
        </CardBox>
      </div>
    </RoleGuard>
  );
};

export default AuditLogsPage;
