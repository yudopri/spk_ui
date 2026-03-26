"use client";
import React, { useState, useEffect } from "react";
import { Table, Button, Badge, Modal, Label, TextInput, Select, Alert } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import karyawanService, { Karyawan } from "@/services/karyawanService";
import divisiService, { Divisi } from "@/services/divisiService";

const DataKaryawan = () => {
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "detail">("create");
  const [employees, setEmployees] = useState<Karyawan[]>([]);
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    nik: "",
    nama: "",
    jabatan: "",
    divisiId: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, divRes] = await Promise.all([
        karyawanService.getAll({ page: 1, pageSize: 100 }),
        divisiService.getAll({ page: 1, pageSize: 100 })
      ]);
      
      if (empRes.success) setEmployees(empRes.data);
      if (divRes.success) setDivisiList(divRes.data);
    } catch (err: any) {
      setError(err?.message || "Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (mode: "create" | "edit" | "detail", data?: Karyawan) => {
    setModalMode(mode);
    setError(null);
    
    if (mode === "create") {
      setFormData({ id: 0, nik: "", nama: "", jabatan: "", divisiId: divisiList[0]?.id || 0 });
    } else if (data) {
      try {
        setLoading(true);
        const response = await karyawanService.getById(data.id);
        if (response.success) {
          const d = response.data;
          setFormData({
            id: d.id,
            nik: d.nik,
            nama: d.nama,
            jabatan: d.jabatan,
            divisiId: d.divisiId
          });
        }
      } catch (err: any) {
        setError("Gagal mengambil detail karyawan");
      } finally {
        setLoading(false);
      }
    }
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (modalMode === "create") {
        response = await karyawanService.create(formData);
      } else {
        response = await karyawanService.update(formData);
      }

      if (response.success) {
        setOpenModal(false);
        fetchData();
      }
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus karyawan ini?")) {
      try {
        const response = await karyawanService.delete(id);
        if (response.success) {
          fetchData();
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Data Karyawan</h1>
          <p className="text-sm text-gray-500">Kelola informasi karyawan per departemen</p>
        </div>
        <Button color="primary" onClick={() => handleAction("create")}>
          <Icon icon="solar:user-plus-linear" className="mr-2 h-5 w-5" />
          Tambah Karyawan
        </Button>
      </div>

      {error && <Alert color="failure">{error}</Alert>}

      <CardBox>
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>NIK</Table.HeadCell>
              <Table.HeadCell>Nama</Table.HeadCell>
              <Table.HeadCell>Jabatan</Table.HeadCell>
              <Table.HeadCell>Divisi / Departemen</Table.HeadCell>
              <Table.HeadCell className="text-center">Aksi</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {loading && !openModal ? (
                <Table.Row>
                  <Table.Cell colSpan={5} className="text-center py-4">Loading data...</Table.Cell>
                </Table.Row>
              ) : employees.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5} className="text-center py-4">Tidak ada data karyawan</Table.Cell>
                </Table.Row>
              ) : (
                employees.map((emp) => (
                  <Table.Row key={emp.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="whitespace-nowrap font-bold text-primary">
                      {emp.nik}
                    </Table.Cell>
                    <Table.Cell className="font-medium text-gray-900 dark:text-white">
                      {emp.nama}
                    </Table.Cell>
                    <Table.Cell>{emp.jabatan}</Table.Cell>
                    <Table.Cell>
                      <Badge color="lightprimary">{emp.divisi?.namaDivisi || "N/A"}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex justify-center gap-2">
                         <Button color="light" size="xs" onClick={() => handleAction("detail", emp)}>
                           <Icon icon="solar:eye-linear" className="h-4 w-4" />
                         </Button>
                         <Button color="light" size="xs" onClick={() => handleAction("edit", emp)}>
                           <Icon icon="solar:pen-new-square-linear" className="h-4 w-4 text-primary" />
                         </Button>
                         <Button color="light" size="xs" onClick={() => handleDelete(emp.id)}>
                           <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4 text-red-500" />
                         </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </div>
      </CardBox>

      {/* Modal Create/Edit/Detail */}
      <Modal show={openModal} onClose={() => setOpenModal(false)} size="lg">
        <Modal.Header>
          <div className="flex items-center gap-2">
            <Icon 
              icon={modalMode === "create" ? "solar:user-plus-linear" : modalMode === "edit" ? "solar:pen-new-square-linear" : "solar:eye-linear"} 
              className="h-6 w-6 text-primary" 
            />
            <span>{modalMode === "create" ? "Tambah Karyawan" : modalMode === "edit" ? "Edit Karyawan" : "Detail Karyawan"}</span>
          </div>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert color="failure" className="mb-4">{error}</Alert>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1">
              <Label htmlFor="nik" value="NIK" />
              <TextInput 
                id="nik" 
                placeholder="Contoh: 1001" 
                value={formData.nik} 
                onChange={(e) => setFormData({...formData, nik: e.target.value})}
                disabled={modalMode === "detail"} 
              />
            </div>
            <div className="col-span-1">
              <Label htmlFor="nama" value="Nama Lengkap" />
              <TextInput 
                id="nama" 
                placeholder="Nama Karyawan" 
                value={formData.nama} 
                onChange={(e) => setFormData({...formData, nama: e.target.value})}
                disabled={modalMode === "detail"} 
              />
            </div>
            <div className="col-span-1">
              <Label htmlFor="jabatan" value="Jabatan" />
              <TextInput 
                id="jabatan" 
                placeholder="Jabatan" 
                value={formData.jabatan} 
                onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
                disabled={modalMode === "detail"} 
              />
            </div>
            <div className="col-span-1">
              <Label htmlFor="divisi" value="Divisi / Departemen" />
              <Select 
                id="divisi" 
                value={formData.divisiId} 
                onChange={(e) => setFormData({...formData, divisiId: parseInt(e.target.value)})}
                disabled={modalMode === "detail"}
              >
                <option value={0} disabled>Pilih Divisi</option>
                {divisiList.map((div) => (
                  <option key={div.id} value={div.id}>{div.namaDivisi}</option>
                ))}
              </Select>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          {modalMode !== "detail" && (
            <Button color="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Data"}
            </Button>
          )}
          <Button color="gray" onClick={() => setOpenModal(false)}>{modalMode === "detail" ? "Tutup" : "Batal"}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DataKaryawan;
