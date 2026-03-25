"use client";
import React, { useState } from "react";
import { Table, Button, Badge, Modal, Label, TextInput, Select } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";

const DataKaryawan = () => {
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "detail">("create");
  const [selectedKaryawan, setSelectedKaryawan] = useState<any>(null);

  const [employees, setEmployees] = useState([
    { id: 1, nik: "1001", nama: "Budi Santoso", jabatan: "Software Engineer", departemen: "IT Department", status: "Aktif", email: "budi@company.com", tgl_masuk: "2022-01-15" },
    { id: 2, nik: "1002", nama: "Siti Aminah", jabatan: "HR Specialist", departemen: "Human Resource", status: "Aktif", email: "siti@company.com", tgl_masuk: "2021-05-20" },
    { id: 3, nik: "1003", nama: "Andi Wijaya", jabatan: "Marketing Lead", departemen: "Marketing", status: "Aktif", email: "andi@company.com", tgl_masuk: "2023-02-10" },
  ]);

  const handleAction = (mode: "create" | "edit" | "detail", data?: any) => {
    setModalMode(mode);
    setSelectedKaryawan(data || null);
    setOpenModal(true);
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

      <CardBox>
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>NIK</Table.HeadCell>
              <Table.HeadCell>Nama</Table.HeadCell>
              <Table.HeadCell>Jabatan</Table.HeadCell>
              <Table.HeadCell>Divisi / Departemen</Table.HeadCell>
              <Table.HeadCell className="text-center">Status</Table.HeadCell>
              <Table.HeadCell className="text-center">Aksi</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {employees.map((emp) => (
                <Table.Row key={emp.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell className="whitespace-nowrap font-bold text-primary">
                    {emp.nik}
                  </Table.Cell>
                  <Table.Cell className="font-medium text-gray-900 dark:text-white">
                    {emp.nama}
                  </Table.Cell>
                  <Table.Cell>{emp.jabatan}</Table.Cell>
                  <Table.Cell>
                    <Badge color="light">{emp.departemen}</Badge>
                  </Table.Cell>
                  <Table.Cell className="text-center">
                    <Badge color="success" className="w-fit mx-auto">{emp.status}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-center gap-2">
                       <Button color="light" size="xs" onClick={() => handleAction("detail", emp)}>
                         <Icon icon="solar:eye-linear" className="h-4 w-4" />
                       </Button>
                       <Button color="light" size="xs" onClick={() => handleAction("edit", emp)}>
                         <Icon icon="solar:pen-new-square-linear" className="h-4 w-4 text-primary" />
                       </Button>
                       <Button color="light" size="xs">
                         <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4 text-red-500" />
                       </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1">
              <Label htmlFor="nik" value="NIK" />
              <TextInput id="nik" placeholder="Contoh: 1001" defaultValue={selectedKaryawan?.nik} disabled={modalMode === "detail"} />
            </div>
            <div className="col-span-1">
              <Label htmlFor="nama" value="Nama Lengkap" />
              <TextInput id="nama" placeholder="Nama Karyawan" defaultValue={selectedKaryawan?.nama} disabled={modalMode === "detail"} />
            </div>
            <div className="col-span-1">
              <Label htmlFor="jabatan" value="Jabatan" />
              <TextInput id="jabatan" placeholder="Jabatan" defaultValue={selectedKaryawan?.jabatan} disabled={modalMode === "detail"} />
            </div>
            <div className="col-span-1">
              <Label htmlFor="departemen" value="Divisi / Departemen" />
              <Select id="departemen" defaultValue={selectedKaryawan?.departemen} disabled={modalMode === "detail"}>
                <option value="IT Department">IT Department</option>
                <option value="Human Resource">Human Resource</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
              </Select>
            </div>
            <div className="col-span-1">
              <Label htmlFor="email" value="Email" />
              <TextInput id="email" type="email" placeholder="email@company.com" defaultValue={selectedKaryawan?.email} disabled={modalMode === "detail"} />
            </div>
            <div className="col-span-1">
              <Label htmlFor="tmasuk" value="Tanggal Masuk" />
              <TextInput id="tmasuk" type="date" defaultValue={selectedKaryawan?.tgl_masuk} disabled={modalMode === "detail"} />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          {modalMode !== "detail" && (
            <Button color="primary" onClick={() => setOpenModal(false)}>Simpan Data</Button>
          )}
          <Button color="gray" onClick={() => setOpenModal(false)}>{modalMode === "detail" ? "Tutup" : "Batal"}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DataKaryawan;
