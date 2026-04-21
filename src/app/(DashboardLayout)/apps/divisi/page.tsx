"use client";
import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Label, TextInput, Textarea, Badge, Alert } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import divisiService, { Divisi } from "@/services/divisiService";
import { usePermission } from "@/hooks/usePermission";

const DataDivisi = () => {
  const { hasPermission } = usePermission();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "view">("add");
  const [selectedDivisi, setSelectedDivisi] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [divisiData, setDivisiData] = useState<Divisi[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    namaDivisi: ""
  });

  const fetchDivisi = async () => {
    setLoading(true);
    try {
      const response = await divisiService.getAll({ page: 1, pageSize: 50 });
      if (response.success) {
        setDivisiData(response.data);
      }
    } catch (err: any) {
      setError(err?.message || "Gagal mengambil data divisi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDivisi();
  }, []);

  const handleOpenModal = async (type: "add" | "edit" | "view", data: any = null) => {
    setModalType(type);
    setError(null);
    
    if (type === "add") {
      setFormData({ id: 0, namaDivisi: "" });
    } else if (data) {
      try {
        setLoading(true);
        const response = await divisiService.getById(data.id);
        if (response.success) {
          setSelectedDivisi(response.data);
          setFormData({ id: response.data.id, namaDivisi: response.data.namaDivisi });
        }
      } catch (err: any) {
        setError("Gagal mengambil detail divisi");
      } finally {
        setLoading(false);
      }
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (modalType === "add") {
        response = await divisiService.create({ ...formData, karyawans: [], periodes: [] });
      } else {
        response = await divisiService.update({ ...formData, karyawans: [], periodes: [] });
      }

      if (response.success) {
        setShowModal(false);
        fetchDivisi();
      }
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus divisi ini?")) {
      try {
        const response = await divisiService.delete(id);
        if (response.success) {
          fetchDivisi();
        }
      } catch (err: any) {
        alert(err?.message || "Gagal menghapus data");
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Master Data Divisi</h1>
          <p className="text-sm text-gray-500">Kelola struktur organisasi perusahaan</p>
        </div>
        {hasPermission("divisi_create") && (
          <Button color="primary" onClick={() => handleOpenModal("add")}>
            <Icon icon="solar:add-circle-linear" className="mr-2 h-5 w-5" />
            Tambah Divisi
          </Button>
        )}
      </div>

      {error && <Alert color="failure">{error}</Alert>}

      <CardBox>
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>ID</Table.HeadCell>
              <Table.HeadCell>Nama Divisi</Table.HeadCell>
              <Table.HeadCell>Karyawan</Table.HeadCell>
              <Table.HeadCell>Periode</Table.HeadCell>
              <Table.HeadCell className="text-center">Aksi</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {loading && !showModal ? (
                <Table.Row>
                  <Table.Cell colSpan={5} className="text-center py-4">Loading data...</Table.Cell>
                </Table.Row>
              ) : divisiData.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5} className="text-center py-4">Tidak ada data divisi</Table.Cell>
                </Table.Row>
              ) : (
                divisiData.map((d) => (
                  <Table.Row key={d.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="whitespace-nowrap font-bold text-primary">
                      #{d.id}
                    </Table.Cell>
                    <Table.Cell className="font-medium text-gray-900 dark:text-white">
                      {d.namaDivisi}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color="info">{d.karyawanCount || 0} Orang</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color="success">{d.periodeCount || 0} Periode</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex justify-center gap-2">
                        {hasPermission("divisi_view") && (
                          <Button color="light" size="xs" onClick={() => handleOpenModal("view", d)}>
                            <Icon icon="solar:eye-linear" className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission("divisi_update") && (
                          <Button color="light" size="xs" onClick={() => handleOpenModal("edit", d)}>
                            <Icon icon="solar:pen-new-square-linear" className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        {hasPermission("divisi_delete") && (
                          <Button color="light" size="xs" onClick={() => handleDelete(d.id)}>
                            <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </div>
      </CardBox>

      {/* Modal CRUD */}
      <Modal show={showModal} onClose={() => setShowModal(false)} size="md">
        <Modal.Header>
          {modalType === "add" ? "Tambah Divisi Baru" : modalType === "edit" ? "Edit Divisi" : "Detail Divisi"}
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            {error && <Alert color="failure">{error}</Alert>}
            <div>
              <Label htmlFor="nama" value="Nama Divisi" />
              <TextInput
                id="nama"
                placeholder="Contoh: IT Department"
                required
                value={formData.namaDivisi}
                onChange={(e) => setFormData({ ...formData, namaDivisi: e.target.value })}
                disabled={modalType === "view"}
              />
            </div>
            
            {modalType === "view" && selectedDivisi && (
              <div className="mt-4 border-t pt-4">
                <h6 className="font-bold mb-2">Statistik:</h6>
                <div className="flex gap-4">
                  <div className="p-3 bg-lightinfo rounded-lg flex-1 text-center">
                    <p className="text-xs text-gray-500">Karyawan</p>
                    <p className="text-xl font-bold">{selectedDivisi.karyawans?.length || 0}</p>
                  </div>
                  <div className="p-3 bg-lightsuccess rounded-lg flex-1 text-center">
                    <p className="text-xs text-gray-500">Periode</p>
                    <p className="text-xl font-bold">{selectedDivisi.periodes?.length || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          {modalType !== "view" && (
            <Button color="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          )}
          <Button color="gray" onClick={() => setShowModal(false)}>
            {modalType === "view" ? "Tutup" : "Batal"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DataDivisi;
