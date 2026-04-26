"use client";
import React, { useState, useEffect } from "react";
import { Table, Button, Badge, Modal, Label, TextInput, Select, Spinner, Alert } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import periodeService, { Periode } from "@/services/periodeService";
import divisiService from "@/services/divisiService";
import { usePermission } from "@/hooks/usePermission";

const PeriodeKPI = () => {
  const { isReadOnly } = usePermission();
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "detail">("create");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [divisis, setDivisis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [btnLoading, setBtnLoading] = useState(false);

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [periodRes, divisiRes] = await Promise.all([
        periodeService.getAll(currentPage, pageSize),
        divisiService.getAll()
      ]);
      setPeriods(periodRes.data);
      setTotalItems((periodRes as any).totalCount ?? periodRes.data.length ?? 0);
      setDivisis(divisiRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (mode: "create" | "edit" | "detail", data?: Periode) => {
    setModalMode(mode);
    if (mode === "create") {
      const now = new Date().toISOString().split('T')[0];
      setSelectedItem({
        Id: 0,
        NamaPeriode: "",
        Status: "Aktif",
        TanggalMulai: now,
        TanggalSelesai: now,
        namaPeriode: "",
        tahun: new Date().getFullYear(),
        tanggalMulai: now,
        tanggalSelesai: now,
        divisiId: 0
      });
    } else {
      setSelectedItem(data || null);
    }
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedItem) return;
    try {
      setBtnLoading(true);

      // Cleanup data before sending to backend
      const { divisi, kpis, isAktif, ...payload } = selectedItem as any;

      // Ensure numeric types
      if (payload.tahun) payload.tahun = Number(payload.tahun);
      if (payload.divisiId) payload.divisiId = Number(payload.divisiId);
      if (payload.id) payload.id = Number(payload.id);

      // Add time to date strings if backend expects full DateTime
      const namaPeriode = payload.namaPeriode || payload.NamaPeriode || "";
      const tanggalMulaiRaw = payload.tanggalMulai || payload.TanggalMulai || "";
      const tanggalSelesaiRaw = payload.tanggalSelesai || payload.TanggalSelesai || "";
      const status = payload.Status || (payload.isAktif ? "Aktif" : "Nonaktif");

      const body = {
        ...payload,
        NamaPeriode: namaPeriode,
        Status: status,
        TanggalMulai: tanggalMulaiRaw
          ? (tanggalMulaiRaw.includes("T") ? tanggalMulaiRaw : `${tanggalMulaiRaw}T00:00:00.000Z`)
          : "",
        TanggalSelesai: tanggalSelesaiRaw
          ? (tanggalSelesaiRaw.includes("T") ? tanggalSelesaiRaw : `${tanggalSelesaiRaw}T23:59:59.000Z`)
          : "",
      };

      if (modalMode === "create") {
        await periodeService.create(body);
      } else {
        await periodeService.update(body);
      }
      setOpenModal(false);
      fetchData();
    } catch (err: any) {
      console.error("Submit Error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Gagal menyimpan data. Periksa konsol untuk detail.");
    } finally {
      setBtnLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus periode ini?")) {
      try {
        await periodeService.delete(id);
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.message || "Gagal menghapus data");
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">

      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Periode Penilaian</h1>
          <p className="text-sm text-gray-500">Tentukan rentang waktu penilaian untuk setiap divisi</p>
        </div>
        {!isReadOnly && (
        <Button color="primary" onClick={() => handleAction("create")}>
          <Icon icon="solar:calendar-add-line-duotone" className="mr-2 h-5 w-5" />
          Tambah Periode
        </Button>
        )}
      </div>

      {error && <Alert color="failure">{error}</Alert>}

      <CardBox>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-10">
              <Spinner size="xl" />
            </div>
          ) : (
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell>Nama Periode</Table.HeadCell>
                <Table.HeadCell>Tahun</Table.HeadCell>
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
                      {period.namaPeriode}
                    </Table.Cell>
                    <Table.Cell>{period.tahun}</Table.Cell>
                    <Table.Cell>
                      <Badge color="info">
                        {period.divisi?.namaDivisi || "N/A"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="text-sm">{new Date(period.tanggalMulai).toLocaleDateString("id-ID")}</Table.Cell>
                    <Table.Cell className="text-sm">{new Date(period.tanggalSelesai).toLocaleDateString("id-ID")}</Table.Cell>
                    <Table.Cell className="text-center">
                      <Badge color={period.isAktif ? "success" : "failure"} className="w-fit mx-auto">
                        {period.isAktif ? "Aktif" : "Tidak Aktif"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex justify-center gap-2">
                        <Button color="light" size="xs" onClick={() => handleAction("detail", period)}>
                          <Icon icon="solar:eye-linear" className="h-4 w-4" />
                        </Button>
                        {!isReadOnly && (
                          <>
                            <Button color="light" size="xs" onClick={() => handleAction("edit", period)}>
                              <Icon icon="solar:pen-new-square-linear" className="h-4 w-4 text-primary" />
                            </Button>
                            <Button color="light" size="xs" onClick={() => handleDelete(period.id)}>
                              <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </div>
      </CardBox>

      {/* Modal Create/Edit/Detail */}
      <Modal show={openModal} onClose={() => setOpenModal(false)} size="lg">
        <Modal.Header>
          {modalMode === "create" ? "Tambah Periode" : modalMode === "edit" ? "Edit Periode" : "Detail Periode"}
        </Modal.Header>
        <Modal.Body className="max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="namaPeriode" value="Nama Periode" />
                <TextInput
                  id="namaPeriode"
                  value={selectedItem?.namaPeriode ?? selectedItem?.NamaPeriode ?? ""}
                  onChange={(e) => setSelectedItem({ ...selectedItem!, namaPeriode: e.target.value, NamaPeriode: e.target.value })}
                  disabled={modalMode === "detail"}
                />
              </div>
              <div>
                <Label htmlFor="tahun" value="Tahun" />
                <TextInput
                  id="tahun"
                  type="number"
                  value={
                    selectedItem?.tahun === null ||
                      selectedItem?.tahun === undefined ||
                      isNaN(selectedItem?.tahun)
                      ? ""
                      : selectedItem.tahun
                  }
                  onChange={(e) => setSelectedItem({ ...selectedItem!, tahun: parseInt(e.target.value) })}
                  disabled={modalMode === "detail"}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="divisi" value="Target Divisi" />
              <Select
                id="divisi"
                value={selectedItem?.divisiId ?? 0}
                onChange={(e) => setSelectedItem({ ...selectedItem!, divisiId: parseInt(e.target.value) })}
                disabled={modalMode === "detail"}
              >
                <option value={0}>Pilih Divisi</option>
                {divisis.map((d) => (
                  <option key={d.id} value={d.id}>{d.namaDivisi}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label value="Tanggal Mulai" />
                <TextInput
                  type="date"
                  value={selectedItem?.tanggalMulai
                    ? selectedItem.tanggalMulai.split('T')[0]
                    : selectedItem?.TanggalMulai
                      ? selectedItem.TanggalMulai.split('T')[0]
                      : ""}
                  onChange={(e) => setSelectedItem({ ...selectedItem!, tanggalMulai: e.target.value, TanggalMulai: e.target.value })}
                  disabled={modalMode === "detail"}
                />
              </div>
              <div>
                <Label value="Tanggal Selesai" />
                <TextInput
                  type="date"
                  value={selectedItem?.tanggalSelesai
                    ? selectedItem.tanggalSelesai.split('T')[0]
                    : selectedItem?.TanggalSelesai
                      ? selectedItem.TanggalSelesai.split('T')[0]
                      : ""}
                  onChange={(e) => setSelectedItem({ ...selectedItem!, tanggalSelesai: e.target.value, TanggalSelesai: e.target.value })}
                  disabled={modalMode === "detail"}
                />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          {modalMode !== "detail" && !isReadOnly && (
            <Button color="primary" onClick={handleSubmit} disabled={btnLoading}>
              {btnLoading ? <Spinner size="sm" className="mr-2" /> : null}
              Simpan
            </Button>
          )}
          <Button color="gray" onClick={() => setOpenModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PeriodeKPI;
