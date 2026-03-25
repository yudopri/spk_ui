"use client";
import React, { useState } from "react";
import { Table, Button, Badge, Modal, Label, TextInput, Select, Textarea } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";

const DataKPI = () => {
  const [selectedPeriodeId, setSelectedPeriodeId] = useState("1");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "view">("add");
  const [selectedKpi, setSelectedKpi] = useState<any>(null);

  // Mock data periode yang sudah memiliki mapping divisi
  const periodes = [
    { id: "1", name: "S1-2024", divisi: "IT" },
    { id: "2", name: "S2-2024", divisi: "IT" },
    { id: "3", name: "S1-2024", divisi: "HRD" },
    { id: "4", name: "S1-2024", divisi: "All" },
  ];

  const selectedPeriode = periodes.find(p => p.id === selectedPeriodeId);

  const kpisByPeriode: any = {
    "1": [ // IT S1-2024
      { id: 1, kode: "C1", nama: "Coding Quality", bobot: "30%", tipe: "Benefit", deskripsi: "Kualitas penulisan kode sesuai standar" },
      { id: 2, kode: "C2", nama: "System Security", bobot: "25%", tipe: "Benefit", deskripsi: "Keamanan sistem yang dibangun" },
    ],
    "2": [ // IT S2-2024
      { id: 3, kode: "C1", nama: "System Architecture", bobot: "40%", tipe: "Benefit", deskripsi: "Desain arsitektur sistem" },
      { id: 4, kode: "C2", nama: "Performance Opt", bobot: "30%", tipe: "Benefit", deskripsi: "Optimasi performa aplikasi" },
    ],
    "3": [ // HRD S1-2024
      { id: 6, kode: "C1", nama: "Recruitment Speed", bobot: "30%", tipe: "Benefit", deskripsi: "Kecepatan pemenuhan manpower" },
      { id: 7, kode: "C2", nama: "Employee Engagement", bobot: "25%", tipe: "Benefit", deskripsi: "Tingkat kepuasan karyawan" },
    ],
    "4": [ // All S1-2024
      { id: 101, kode: "G1", nama: "Kedisiplinan", bobot: "20%", tipe: "Benefit", deskripsi: "Tingkat kehadiran umum" },
      { id: 102, kode: "G2", nama: "Loyalitas", bobot: "10%", tipe: "Benefit", deskripsi: "Dedikasi terhadap perusahaan" },
    ],
  };

  const currentKpis = kpisByPeriode[selectedPeriodeId] || [
    { id: 99, kode: "N/A", nama: "Belum ada kriteria untuk periode ini", bobot: "0%", tipe: "Benefit", deskripsi: "-" }
  ];

  const handleOpenModal = (type: "add" | "edit" | "view", kpi: any = null) => {
    setModalType(type);
    setSelectedKpi(kpi);
    setShowModal(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Master Kriteria KPI</h1>
          <p className="text-sm text-gray-500">Kelola kriteria penilaian berdasarkan Periode & Divisi</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="w-64">
            <Select
              value={selectedPeriodeId}
              onChange={(e) => setSelectedPeriodeId(e.target.value)}
              sizing="sm"
            >
              {periodes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.divisi === "All" ? "Semua Divisi" : `Divisi ${p.divisi}`}
                </option>
              ))}
            </Select>
          </div>
          <Button color="primary" size="sm" onClick={() => handleOpenModal("add")}>
            <Icon icon="solar:add-circle-linear" className="mr-2 h-5 w-5" />
            Tambah Kriteria
          </Button>
        </div>
      </div>

      <CardBox>
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>Kode</Table.HeadCell>
              <Table.HeadCell>Nama Kriteria</Table.HeadCell>
              <Table.HeadCell>Bobot</Table.HeadCell>
              <Table.HeadCell>Tipe</Table.HeadCell>
              <Table.HeadCell className="text-center">Aksi</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {currentKpis.map((kpi: any) => (
                <Table.Row key={kpi.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell className="whitespace-nowrap font-bold text-primary">
                    {kpi.kode}
                  </Table.Cell>
                  <Table.Cell className="font-medium text-gray-900 dark:text-white">
                    {kpi.nama}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="info" size="sm" className="w-fit">
                      {kpi.bobot}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={kpi.tipe === "Benefit" ? "success" : "warning"} size="sm" className="w-fit">
                      {kpi.tipe}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-center gap-2">
                       <Button color="light" size="xs" onClick={() => handleOpenModal("view", kpi)}>
                         <Icon icon="solar:eye-linear" className="h-4 w-4" />
                       </Button>
                       <Button color="light" size="xs" onClick={() => handleOpenModal("edit", kpi)}>
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
          {modalType === "add" ? "Tambah Kriteria Baru" : modalType === "edit" ? "Edit Kriteria" : "Detail Kriteria"}
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="kode" value="Kode Kriteria" />
              <TextInput
                id="kode"
                placeholder="Contoh: C1"
                required
                defaultValue={selectedKpi?.kode}
                disabled={modalType === "view"}
              />
            </div>
            <div>
              <Label htmlFor="nama" value="Nama Kriteria" />
              <TextInput
                id="nama"
                placeholder="Contoh: Kualitas Kerja"
                required
                defaultValue={selectedKpi?.nama}
                disabled={modalType === "view"}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bobot" value="Bobot (%)" />
                <TextInput
                  id="bobot"
                  type="number"
                  placeholder="30"
                  defaultValue={selectedKpi?.bobot?.replace("%", "")}
                  disabled={modalType === "view"}
                />
              </div>
              <div>
                <Label htmlFor="tipe" value="Tipe" />
                <Select id="tipe" defaultValue={selectedKpi?.tipe} disabled={modalType === "view"}>
                  <option value="Benefit">Benefit</option>
                  <option value="Cost">Cost</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="deskripsi" value="Deskripsi" />
              <Textarea
                id="deskripsi"
                placeholder="Jelaskan mengenai kriteria ini..."
                rows={4}
                defaultValue={selectedKpi?.deskripsi}
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

export default DataKPI;
