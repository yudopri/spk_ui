"use client";
import React, { useState } from "react";
import { Table, Button, Badge, Modal, Label, TextInput, Select } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";

const PeriodeKPI = () => {
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "detail">("create");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [periods, setPeriods] = useState([
    { id: 1, name: "Semester 1 2024", startDate: "2024-01-01", endDate: "2024-06-30", status: "Open", divisi: "IT" },
    { id: 2, name: "Semester 2 2024", startDate: "2024-07-01", endDate: "2024-12-31", status: "Open", divisi: "Marketing" },
    { id: 3, name: "Tahun 2023", startDate: "2023-01-01", endDate: "2023-12-31", status: "Closed", divisi: "All" },
  ]);

  const handleAction = (mode: "create" | "edit" | "detail", data?: any) => {
    setModalMode(mode);
    setSelectedItem(data || null);
    setOpenModal(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Periode Penilaian</h1>
          <p className="text-sm text-gray-500">Tentukan rentang waktu penilaian untuk setiap divisi</p>
        </div>
        <Button color="primary" onClick={() => handleAction("create")}>
          <Icon icon="solar:calendar-add-line-duotone" className="mr-2 h-5 w-5" />
          Tambah Periode
        </Button>
      </div>

      <CardBox>
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>Nama Periode</Table.HeadCell>
              <Table.HeadCell>Target Divisi</Table.HeadCell>
              <Table.HeadCell>Mulai</Table.HeadCell>
              <Table.HeadCell>Selesai</Table.HeadCell>
              <Table.HeadCell className="text-center">Status</Table.HeadCell>
              <Table.HeadCell className="text-center">Aksi</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {periods.map((period) => (
                <Table.Row key={period.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell className="whitespace-nowrap font-bold text-gray-900 dark:text-white">
                    {period.name}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="info">
                      {period.divisi === "All" ? "Semua Divisi" : `Divisi ${period.divisi}`}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-sm">{period.startDate}</Table.Cell>
                  <Table.Cell className="text-sm">{period.endDate}</Table.Cell>
                  <Table.Cell className="text-center">
                    <Badge color={period.status === "Open" ? "success" : "failure"} className="w-fit mx-auto">
                      {period.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-center gap-2">
                       <Button color="light" size="xs" onClick={() => handleAction("detail", period)}>
                         <Icon icon="solar:eye-linear" className="h-4 w-4" />
                       </Button>
                       <Button color="light" size="xs" onClick={() => handleAction("edit", period)}>
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
      <Modal show={openModal} onClose={() => setOpenModal(false)} size="md">
        <Modal.Header>
          {modalMode === "create" ? "Tambah Periode" : modalMode === "edit" ? "Edit Periode" : "Detail Periode"}
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" value="Nama Periode" />
              <TextInput id="name" defaultValue={selectedItem?.name} disabled={modalMode === "detail"} />
            </div>
            <div>
              <Label htmlFor="divisi" value="Target Divisi" />
              <Select id="divisi" defaultValue={selectedItem?.divisi} disabled={modalMode === "detail"}>
                <option value="All">Semua Divisi</option>
                <option value="IT">IT</option>
                <option value="HRD">HRD</option>
                <option value="Marketing">Marketing</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <Label value="Tanggal Mulai" />
                  <TextInput type="date" defaultValue={selectedItem?.startDate} disabled={modalMode === "detail"} />
               </div>
               <div>
                  <Label value="Tanggal Selesai" />
                  <TextInput type="date" defaultValue={selectedItem?.endDate} disabled={modalMode === "detail"} />
               </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          {modalMode !== "detail" && (
            <Button color="primary" onClick={() => setOpenModal(false)}>Simpan</Button>
          )}
          <Button color="gray" onClick={() => setOpenModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PeriodeKPI;
