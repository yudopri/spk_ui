"use client";
import React, { useEffect, useState } from "react";
import { Alert, Button, Label, Modal, Spinner, Table, TextInput } from "flowbite-react";
import { Icon } from "@iconify/react";
import CardBox from "@/app/components/shared/CardBox";
import kpiService, { Attribute } from "@/services/kpiService";
import { usePermission } from "@/hooks/usePermission";

// Shared Components
import DataTable, { Column } from "@/app/components/shared/DataTable";
import DataPagination from "@/app/components/shared/DataPagination";

const AttributePage = () => {
  const { isReadOnly } = usePermission();
  const [items, setItems] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [mode, setMode] = useState<"create" | "edit" | "detail">("create");
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Attribute | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const columns: Column<Attribute>[] = [
    {
      header: "Nama Attribute",
      key: "nama",
      cellClasses: "font-semibold"
    },
    {
      header: "Simbol",
      key: "simbol",
      cellClasses: "font-mono"
    },
    {
      header: "Aksi",
      headerClasses: "text-center",
      cellClasses: "text-center",
      render: (item: Attribute) => (
        <div className="flex justify-center gap-2">
            <Button color="light" size="xs" onClick={() => openAction("detail", item)}>
              <Icon icon="solar:eye-linear" className="h-4 w-4" />
            </Button>
            {!isReadOnly && (
              <>
                <Button color="light" size="xs" onClick={() => openAction("edit", item)}>
                  <Icon icon="solar:pen-new-square-linear" className="h-4 w-4 text-primary" />
                </Button>
                <Button color="light" size="xs" onClick={() => handleDelete(item.id)}>
                  <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4 text-red-500" />
                </Button>
              </>
            )}
        </div>
      )
    }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await kpiService.getAttributes(currentPage, pageSize);
      const normalized = (res.data || []).map((item: any) => ({
        id: Number(item.id ?? item.Id ?? 0),
        nama: String(item.nama ?? item.Nama ?? ""),
        simbol: String(item.simbol ?? item.Simbol ?? ""),
      }));
      setItems(normalized.filter((item: Attribute) => item.id > 0));
      setTotalItems(res.meta?.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal mengambil data attribute");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize]);

  const openAction = (nextMode: "create" | "edit" | "detail", item?: Attribute) => {
    setMode(nextMode);
    if (nextMode === "create") {
      setSelected({ id: 0, nama: "", simbol: "" });
    } else {
      setSelected(item || null);
    }
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (!selected) return;

    const nama = String(selected.nama || "").trim();
    const simbol = String(selected.simbol || "").trim();

    if (!nama || !simbol) {
      alert("Nama dan simbol wajib diisi");
      return;
    }

    try {
      setSaving(true);
      if (mode === "create") {
        await kpiService.createAttribute({ nama, simbol });
      } else {
        await kpiService.updateAttribute(Number(selected.id), { nama, simbol });
      }
      setOpenModal(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Gagal menyimpan attribute");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus attribute ini?")) return;
    try {
      await kpiService.deleteAttribute(id);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Gagal menghapus attribute");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Attribute / Satuan KPI</h1>
          <p className="text-sm text-gray-500">Kelola satuan pengukuran untuk kriteria penilaian KPI</p>
        </div>
        {!isReadOnly && (
          <Button color="primary" onClick={() => openAction("create")}>
            <Icon icon="solar:add-circle-linear" className="mr-2 h-5 w-5" />
            Tambah Attribute
          </Button>
        )}
      </div>

      {error && <Alert color="failure">{error}</Alert>}

      <CardBox>
        <DataTable
            loading={loading}
            data={items}
            columns={columns}
            rowKey={(item) => item.id}
        />

        <DataPagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / pageSize)}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
            }}
            totalItems={totalItems}
        />
      </CardBox>

      <Modal show={openModal} onClose={() => setOpenModal(false)} size="md">
        <Modal.Header>
          {mode === "create" ? "Tambah Attribute" : mode === "edit" ? "Edit Attribute" : "Detail Attribute"}
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nama" value="Nama" />
              <TextInput
                id="nama"
                value={selected?.nama ?? ""}
                onChange={(e) => setSelected({ ...(selected as Attribute), nama: e.target.value })}
                disabled={mode === "detail"}
              />
            </div>
            <div>
              <Label htmlFor="simbol" value="Simbol" />
              <TextInput
                id="simbol"
                value={selected?.simbol ?? ""}
                onChange={(e) => setSelected({ ...(selected as Attribute), simbol: e.target.value })}
                disabled={mode === "detail"}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          {mode !== "detail" && !isReadOnly && (
            <Button color="primary" onClick={handleSave} disabled={saving}>
              {saving ? <Spinner size="sm" className="mr-2" /> : null}
              Simpan
            </Button>
          )}
          <Button color="gray" onClick={() => setOpenModal(false)}>
            {mode === "detail" ? "Tutup" : "Batal"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AttributePage;
