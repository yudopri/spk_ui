"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Badge, Alert, Button } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import divisiService, { Divisi } from "@/services/divisiService";
import { usePermission } from "@/hooks/usePermission";

// Shared Components
import DataTable, { Column } from "@/app/components/shared/DataTable";
import DataSearch from "@/app/components/shared/DataSearch";
import DataPagination from "@/app/components/shared/DataPagination";

const DataDivisi = () => {
  const { hasPermission } = usePermission();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [divisiData, setDivisiData] = useState<Divisi[]>([]);

  // Pagination & Search States
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchDivisi = async () => {
    setLoading(true);
    try {
      const response = await divisiService.getAll(page, pageSize, searchTerm);
      if (response.success) {
        setDivisiData(response.data);
        setTotalItems(response.meta?.total || 0);
      }
    } catch (err: any) {
      setError(err?.message || "Gagal mengambil data departemen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDivisi();
  }, [page, pageSize, searchTerm]);

  const columns: Column<Divisi>[] = [
    {
      header: "ID",
      accessor: "id",
      cell: (item) => <span className="font-bold text-primary">#{item.id}</span>,
      className: "w-24",
    },
    {
      header: "Nama Departemen",
      accessor: "namaDivisi",
      className: "font-medium text-gray-900 dark:text-white",
    },
    {
      header: "Status Akses",
      className: "text-center",
      cell: () => (
        <Badge color={hasPermission("department_view") ? "success" : "gray"} className="w-fit mx-auto">
          {hasPermission("department_view") ? "Tersedia" : "Terbatas"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Data Departemen</h1>
          <p className="text-sm text-gray-500">Daftar departemen yang terdaftar dalam sistem</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <DataSearch 
            onSearch={(val) => {
              setSearchTerm(val);
              setPage(1);
            }} 
          />
          <Button color="primary" onClick={fetchDivisi} outline>
            <Icon icon="solar:refresh-linear" className="mr-2 h-5 w-5" />
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert color="failure">{error}</Alert>}

      <CardBox>
        <DataTable
          columns={columns}
          data={divisiData}
          loading={loading}
        />
        <DataPagination
          currentPage={page}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </CardBox>
    </div>
  );
};

export default DataDivisi;
