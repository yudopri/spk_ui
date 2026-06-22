"use client";
import React, { useState, useEffect } from "react";
import { Table, Button, Badge, Modal, Label, TextInput, Select, Spinner, Alert, Tooltip } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import periodeService, { Periode } from "@/services/periodeService";
import divisiService from "@/services/divisiService";
import { usePermission } from "@/hooks/usePermission";

import DataTable, { Column } from "@/app/components/shared/DataTable";
import DataPagination from "@/app/components/shared/DataPagination";

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
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const columns: Column<Periode>[] = [
    {
      header: "Nama Periode",
      cellClasses: "whitespace-nowrap font-bold text-gray-900 dark:text-white",
      render: (item: Periode) => item.NamaPeriode || item.namaPeriode
    },
    {
      header: "Tahun",
      key: "Tahun"
    },
    {
      header: "Target Divisi",
      render: (item: Periode) => (
        <Badge color="info">
          {item.NamaDivisi || item.divisi?.namaDivisi || "N/A"}
        </Badge>
      )
    },
    {
      header: "Mulai",
      render: (item: Periode) => (
        <span className="text-sm">{new Date(item.TanggalMulai || item.tanggalMulai).toLocaleDateString("id-ID")}</span>
      )
    },
    {
      header: "Selesai",
      render: (item: Periode) => (
        <span className="text-sm">{new Date(item.TanggalSelesai || item.tanggalSelesai).toLocaleDateString("id-ID")}</span>
      )
    },
    {
      header: "Status",
      headerClasses: "text-center",
      cellClasses: "text-center",
      render: (item: Periode) => (
        <Badge 
          color={item.Status === 'locked' ? "dark" : item.Status === 'open' ? "info" : item.Status === 'processed' ? "success" : "gray"} 
          className={`w-fit mx-auto px-3 py-1 font-black uppercase tracking-tighter ${item.Status === 'locked' ? 'bg-gray-800 text-gray-200 border-2 border-gray-600' : ''}`}
        >
          {String(item.Status || 'draft').toUpperCase()}
        </Badge>
      )
    },
    {
      header: "Manajemen & Aksi",
      headerClasses: "text-center",
      cellClasses: "text-center",
      render: (item: Periode) => (
        <div className="flex justify-center gap-2">
          <Tooltip content="Edit KPI (Kriteria)">
            <Button 
                color="light" 
                size="xs" 
                className="hover:bg-primary/10"
                onClick={() => window.location.href=`/apps/data-kpi?periodeId=${item.Id}`}
                disabled={item.Status === 'locked'}
              >
              <Icon icon="solar:filters-bold" className={`h-4 w-4 ${item.Status === 'locked' ? 'text-gray-400' : 'text-primary'}`} />
            </Button>
          </Tooltip>
          <Tooltip content="Input Nilai Karyawan">
            <Button 
                color="light" 
                size="xs" 
                className="hover:bg-success/10"
                onClick={() => window.location.href=`/apps/penilaian?periodeId=${item.Id}`}
                disabled={item.Status === 'locked'}
              >
              <Icon icon="solar:user-hand-up-bold" className={`h-4 w-4 ${item.Status === 'locked' ? 'text-gray-400' : 'text-green-600'}`} />
            </Button>
          </Tooltip>
          <Tooltip content="Hasil & Finalisasi">
            <Button 
                color="light" 
                size="xs" 
                className="hover:bg-secondary/10"
                onClick={() => window.location.href=`/apps/report?periodeId=${item.Id}`}
            >
              <Icon icon="solar:chart-square-bold" className="h-4 w-4 text-secondary" />
            </Button>
          </Tooltip>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          {!isReadOnly && (
            <>
              <Tooltip content={item.Status === 'locked' ? "Terkunci" : "Edit Periode"}>
                <Button 
                  color="light" 
                  size="xs" 
                  onClick={() => handleAction("edit", item)}
                  disabled={item.Status === 'locked'}
                  className={item.Status === 'locked' ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <Icon icon="solar:pen-new-square-linear" className="h-4 w-4" />
                </Button>
              </Tooltip>
              <Tooltip content={item.Status === 'locked' ? "Terkunci" : "Hapus"}>
                <Button 
                  color="light" 
                  size="xs" 
                  onClick={() => handleDelete(item.Id ?? item.id ?? 0)}
                  disabled={item.Status === 'locked'}
                  className={item.Status === 'locked' ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4 text-red-500" />
                </Button>
              </Tooltip>
            </>
          )}
        </div>
      )
    }
  ];

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [periodRes, divisiRes] = await Promise.all([
        periodeService.getAll(currentPage, pageSize),
        divisiService.getAll()
      ]);
      setPeriods(periodRes.data);
      setTotalItems(periodRes.meta?.total || (periodRes as any).totalCount || periodRes.data.length || 0);
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
        Status: "draft",
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

      // Ensure numeric types with backend contract: Tahun nullable, DivisiId numeric/null
      const tahunRaw = payload.tahun ?? payload.Tahun;
      const divisiRaw = payload.divisiId ?? payload.DivisiId;
      if (payload.id) payload.id = Number(payload.id);

      // Add time to date strings if backend expects full DateTime
      const namaPeriode = payload.namaPeriode || payload.NamaPeriode || "";
      const tanggalMulaiRaw = payload.tanggalMulai || payload.TanggalMulai || "";
      const tanggalSelesaiRaw = payload.tanggalSelesai || payload.TanggalSelesai || "";
      const status = String(payload.Status || payload.status || "draft").toLowerCase();

      const body = {
        ...payload,
        NamaPeriode: namaPeriode,
        Tahun: tahunRaw === "" || tahunRaw === undefined || tahunRaw === null ? null : Number(tahunRaw),
        DivisiId: divisiRaw === "" || divisiRaw === undefined || divisiRaw === null ? null : Number(divisiRaw),
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
      alert(err?.response?.data?.message || err?.data?.message || err?.message || "Gagal menyimpan data. Periksa konsol untuk detail.");
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
        if (err?.response?.status === 409 || err?.status === 409) {
          alert(err?.response?.data?.message || err?.data?.message || "Periode tidak dapat dihapus karena masih dipakai data lain.");
          return;
        }
        alert(err?.response?.data?.message || err?.data?.message || err?.message || "Gagal menghapus data");
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
        <DataTable
            loading={loading}
            data={periods}
            columns={columns}
            rowKey={(item) => item.Id ?? item.id ?? 0}
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

      {/* Modal Create/Edit/Detail */}
      <Modal show={openModal} onClose={() => setOpenModal(false)} size="lg">
        <Modal.Header className={`${selectedItem?.Status === 'locked' ? 'bg-gray-100' : ''}`}>
          <div className="flex items-center gap-2">
            {modalMode === "create" ? "Tambah Periode Baru" : modalMode === "edit" ? "Modifikasi Periode" : "Rincian Periode"}
            {selectedItem?.Status === 'locked' && (
              <Badge color="dark" className="ml-2 font-black uppercase text-[10px] tracking-widest border border-gray-400">LOCKED</Badge>
            )}
          </div>
        </Modal.Header>
        <Modal.Body className="max-h-[80vh] overflow-y-auto">
          {selectedItem?.Status === 'locked' && (
            <Alert color="dark" className="mb-4 border-2 border-gray-300" icon={() => <Icon icon="solar:lock-bold" className="h-5 w-5" />}>
              <span className="font-black uppercase text-xs">Informasi:</span> Periode ini terkunci dan seluruh data terkait tidak bisa diubah.
            </Alert>
          )}
          <div className={`space-y-4 ${selectedItem?.Status === 'locked' ? 'opacity-70 grayscale-[0.5]' : ''}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="namaPeriode" value="Nama Periode" className="text-[10px] font-black uppercase text-gray-500" />
                <TextInput
                  id="namaPeriode"
                  className="font-bold"
                  value={selectedItem?.namaPeriode ?? selectedItem?.NamaPeriode ?? ""}
                  onChange={(e) => setSelectedItem({ ...selectedItem!, namaPeriode: e.target.value, NamaPeriode: e.target.value })}
                  disabled={modalMode === "detail" || selectedItem?.Status === 'locked'}
                />
              </div>
              <div>
                <Label htmlFor="tahun" value="Tahun" className="text-[10px] font-black uppercase text-gray-500" />
                <TextInput
                  id="tahun"
                  type="number"
                  className="font-mono font-bold"
                  value={
                    selectedItem?.tahun === null ||
                      selectedItem?.tahun === undefined ||
                      isNaN(selectedItem?.tahun)
                      ? ""
                      : selectedItem.tahun
                  }
                  onChange={(e) => setSelectedItem({ ...selectedItem!, tahun: e.target.value === "" ? null : Number(e.target.value) })}
                  disabled={modalMode === "detail" || selectedItem?.Status === 'locked'}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="divisi" value="Target Divisi (Cakupan Penilaian)" className="text-[10px] font-black uppercase text-gray-500" />
              <Select
                id="divisi"
                className="font-bold"
                value={(selectedItem?.divisiId ?? selectedItem?.DivisiId) === null ? "all" : (selectedItem?.divisiId ?? selectedItem?.DivisiId ?? 0)}
                onChange={(e) => {
                  const val = e.target.value === "all" ? null : (e.target.value === "0" ? 0 : Number(e.target.value));
                  setSelectedItem({ ...selectedItem!, divisiId: val, DivisiId: val });
                }}
                disabled={modalMode === "detail" || selectedItem?.Status === 'locked'}
              >
                <option value={0}>Pilih Divisi</option>
                <option value="all">Semua Divisi (Lintas Divisi)</option>
                {divisis.map((d) => (
                  <option key={d.id} value={d.id}>{d.namaDivisi}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label value="Tanggal Mulai" className="text-[10px] font-black uppercase text-gray-500" />
                <TextInput
                  type="date"
                  value={selectedItem?.tanggalMulai
                    ? selectedItem.tanggalMulai.split('T')[0]
                    : selectedItem?.TanggalMulai
                      ? selectedItem.TanggalMulai.split('T')[0]
                      : ""}
                  onChange={(e) => setSelectedItem({ ...selectedItem!, tanggalMulai: e.target.value, TanggalMulai: e.target.value })}
                  disabled={modalMode === "detail" || selectedItem?.Status === 'locked'}
                />
              </div>
              <div>
                <Label value="Tanggal Selesai" className="text-[10px] font-black uppercase text-gray-500" />
                <TextInput
                  type="date"
                  value={selectedItem?.tanggalSelesai
                    ? selectedItem.tanggalSelesai.split('T')[0]
                    : selectedItem?.TanggalSelesai
                      ? selectedItem.TanggalSelesai.split('T')[0]
                      : ""}
                  onChange={(e) => setSelectedItem({ ...selectedItem!, tanggalSelesai: e.target.value, TanggalSelesai: e.target.value })}
                  disabled={modalMode === "detail" || selectedItem?.Status === 'locked'}
                />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-between">
          <Button color="gray" onClick={() => setOpenModal(false)} size="sm" className="font-bold uppercase text-[10px]">
            Tutup
          </Button>
          {(modalMode !== "detail" && !isReadOnly && selectedItem?.Status !== 'locked') && (
            <Button color="primary" onClick={handleSubmit} disabled={btnLoading} size="sm" className="px-6 shadow-lg shadow-primary/20">
              {btnLoading ? <Spinner size="sm" className="mr-2" /> : <Icon icon="solar:diskette-bold" className="mr-2 h-4 w-4" />}
              <span className="font-black uppercase text-[10px] tracking-widest">Simpan Perubahan</span>
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PeriodeKPI;
