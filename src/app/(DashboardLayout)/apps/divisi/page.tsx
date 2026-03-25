"use client";
import React, { useState } from "react";
import { Table, Button, Modal, Label, TextInput, Textarea } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";

const DataDivisi = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "view">("add");
  const [selectedDivisi, setSelectedDivisi] = useState<any>(null);

  const [divisiData, setDivisiData] = useState([
    { id: 1, kode: "DIV001", nama: "IT Department", deskripsi: "Mengelola infrastruktur IT dan pengembangan aplikasi" },
    { id: 2, kode: "DIV002", nama: "Human Resource", deskripsi: "Mengelola SDM dan administrasi karyawan" },
    { id: 3, kode: "DIV003", nama: "Marketing", deskripsi: "Mengelola promosi dan branding perusahaan" },
    { id: 4, kode: "DIV004", nama: "Finance", deskripsi: "Mengelola keuangan dan akuntansi" },
  ]);

  const handleOpenModal = (type: "add" | "edit" | "view", data: any = null) => {
    setModalType(type);
    setSelectedDivisi(data);
    setShowModal(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Master Data Divisi</h1>
          <p className="text-sm text-gray-500">Kelola struktur organisasi perusahaan</p>
        </div>
        <Button color="primary" onClick={() => handleOpenModal("add")}>
          <Icon icon="solar:add-circle-linear" className="mr-2 h-5 w-5" />
          Tambah Divisi
        </Button>
      </div>

      <CardBox>
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>Kode</Table.HeadCell>
              <Table.HeadCell>Nama Divisi</Table.HeadCell>
              <Table.HeadCell>Deskripsi</Table.HeadCell>
              <Table.HeadCell className="text-center">Aksi</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {divisiData.map((d) => (
                <Table.Row key={d.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell className="whitespace-nowrap font-bold text-primary">
                    {d.kode}
                  </Table.Cell>
                  <Table.Cell className="font-medium text-gray-900 dark:text-white">
                    {d.nama}
                  </Table.Cell>
                  <Table.Cell className="text-gray-500">
                    {d.deskripsi}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-center gap-2">
                       <Button color="light" size="xs" onClick={() => handleOpenModal("view", d)}>
                         <Icon icon="solar:eye-linear" className="h-4 w-4" />
                       </Button>
                       <Button color="light" size="xs" onClick={() => handleOpenModal("edit", d)}>
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

      {/* Modal CRUD */}
      <Modal show={showModal} onClose={() => setShowModal(false)} size="md">
        <Modal.Header>
          {modalType === "add" ? "Tambah Divisi Baru" : modalType === "edit" ? "Edit Divisi" : "Detail Divisi"}
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="kode" value="Kode Divisi" />
              <TextInput
                id="kode"
                placeholder="DIV00x"
                required
                defaultValue={selectedDivisi?.kode}
                disabled={modalType === "view"}
              />
            </div>
            <div>
              <Label htmlFor="nama" value="Nama Divisi" />
              <TextInput
                id="nama"
                placeholder="Contoh: IT Department"
                required
                defaultValue={selectedDivisi?.nama}
                disabled={modalType === "view"}
              />
            </div>
            <div>
              <Label htmlFor="deskripsi" value="Deskripsi" />
              <Textarea
                id="deskripsi"
                placeholder="Jelaskan mengenai divisi ini..."
                rows={4}
                defaultValue={selectedDivisi?.deskripsi}
                disabled={modalType === "view"}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          {modalType !== "view" && (
            <Button color="primary" onClick={() => setShowModal(false)}>
              Simpan
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
