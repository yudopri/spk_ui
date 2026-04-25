"use client";
import React, { useEffect, useState } from "react";
import { Table, Badge, Spinner, Alert, Button } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import divisiService, { Divisi } from "@/services/divisiService";
import { usePermission } from "@/hooks/usePermission";

const DataDivisi = () => {
  const { hasPermission } = usePermission();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [divisiData, setDivisiData] = useState<Divisi[]>([]);

  const fetchDivisi = async () => {
    setLoading(true);
    try {
      const response = await divisiService.getAll();
      if (response.success) {
        setDivisiData(response.data);
      }
    } catch (err: any) {
      setError(err?.message || "Gagal mengambil data departemen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDivisi();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Departemen Mitra</h1>
          <p className="text-sm text-gray-500">Daftar departemen yang tersedia dari API legacy Mitra</p>
        </div>
        <Button color="primary" onClick={fetchDivisi} outline>
          <Icon icon="solar:refresh-linear" className="mr-2 h-5 w-5" />
          Refresh
        </Button>
      </div>

      {error && <Alert color="failure">{error}</Alert>}

      <CardBox>
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>ID</Table.HeadCell>
              <Table.HeadCell>Nama Departemen</Table.HeadCell>
              <Table.HeadCell className="text-center">Status Akses</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan={3} className="text-center py-10">
                    <Spinner size="xl" />
                  </Table.Cell>
                </Table.Row>
              ) : divisiData.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={3} className="text-center py-10">
                    Tidak ada data departemen
                  </Table.Cell>
                </Table.Row>
              ) : (
                divisiData.map((d) => (
                  <Table.Row key={d.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="whitespace-nowrap font-bold text-primary">#{d.id}</Table.Cell>
                    <Table.Cell className="font-medium text-gray-900 dark:text-white">
                      {d.namaDivisi}
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <Badge color={hasPermission("department_view") ? "success" : "gray"} className="w-fit mx-auto">
                        {hasPermission("department_view") ? "Tersedia" : "Terbatas"}
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </div>
      </CardBox>
    </div>
  );
};

export default DataDivisi;
