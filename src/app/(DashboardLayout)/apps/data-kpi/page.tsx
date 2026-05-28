"use client";
import React, { useState, useEffect } from "react";
import { Table, Button, Badge, Modal, Label, TextInput, Select, Textarea, Spinner, Alert } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import kpiService, { KPI, KPIGroup } from "@/services/kpiService";
import periodeService, { Periode } from "@/services/periodeService";
import { usePermission } from "@/hooks/usePermission";

// Shared Components
import DataTable, { Column } from "@/app/components/shared/DataTable";
import DataPagination from "@/app/components/shared/DataPagination";
import DataSearch from "@/app/components/shared/DataSearch";
import DataFilter from "@/app/components/shared/DataFilter";

interface Attribute {
  id: number;
  nama: string;
  simbol: string;
}

const DataKPI = () => {
  const { isReadOnly } = usePermission();
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "view">("add");
  const [selectedKpi, setSelectedKpi] = useState<Partial<KPI> | null>(null);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [groups, setGroups] = useState<KPIGroup[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [btnLoading, setBtnLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const columns: Column<KPI>[] = [
    {
      header: "Nama KPI",
      render: (item: KPI) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900">{item.NamaKpi}</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-tighter">
            {item.GrupKpi?.namaGrup || "Tanpa Grup"}
          </span>
        </div>
      )
    },
    {
      header: "Bobot",
      render: (item: KPI) => (
        <Badge color="info">{(item.Bobot * 100).toFixed(0)}%</Badge>
      )
    },
    {
      header: "Tipe",
      render: (item: KPI) => (
        <Badge color={item.IsBenefit ? "success" : "warning"}>
          {item.IsBenefit ? "Benefit" : "Cost"}
        </Badge>
      )
    },
    {
      header: "Target",
      render: (item: KPI) => (
        <span className="font-mono text-gray-600">
          {item.Target} {item.Satuan}
        </span>
      )
    },
    {
      header: "Aksi",
      headerClasses: "text-center",
      cellClasses: "text-center",
      render: (item: KPI) => (
        <div className="flex justify-center gap-2">
           <Button color="light" size="xs" onClick={() => handleOpenModal("view", item)}>
              <Icon icon="solar:eye-bold" className="text-base" />
           </Button>
           {!isReadOnly && (
             <>
               <Button color="primary" size="xs" onClick={() => handleOpenModal("edit", item)}>
                  <Icon icon="solar:pen-new-square-bold" className="text-base" />
               </Button>
               <Button color="failure" size="xs" onClick={() => handleDelete(item.Id ?? item.id ?? 0)}>
                  <Icon icon="solar:trash-bin-trash-bold" className="text-base" />
               </Button>
             </>
           )}
        </div>
      )
    }
  ];

  useEffect(() => {
    fetchPeriodes();
    fetchAttributes();
  }, []);

  useEffect(() => {
    if (selectedPeriodeId !== 0) {
      fetchKpis();
      fetchGroups();
    } else {
      setKpis([]);
      setGroups([]);
      setLoading(false);
    }
  }, [selectedPeriodeId, currentPage]);

  const fetchGroups = async () => {
    try {
      const res = await kpiService.getGroups(selectedPeriodeId);
      setGroups(res.data);
    } catch (err) {
      console.error("Gagal mengambil data grup KPI", err);
    }
  };

  const fetchPeriodes = async () => {
    try {
      const res = await periodeService.getAll(1, 100);
      // Filter only active periods if you want, but usually for "Master Data" 
      // we show all so they can still manage KPI of past periods.
      // If you strictly want ONLY active ones, use: res.data.filter(p => p.isAktif)
      const allPeriodes = res.data;
      setPeriodes(allPeriodes);
      
      if (allPeriodes.length > 0) {
        setSelectedPeriodeId(allPeriodes[0].id);
      }
    } catch (err: any) {
      setError("Gagal mengambil data periode");
    }
  };

  const fetchAttributes = async () => {
    try {
      const res = await kpiService.getAttributes();
      const list = (Array.isArray(res) ? res : res?.data || []).map((item: any) => ({
        id: Number(item.id ?? item.Id ?? 0),
        nama: String(item.nama ?? item.Nama ?? ""),
        simbol: String(item.simbol ?? item.Simbol ?? ""),
      }));
      setAttributes(list.filter((item: Attribute) => item.id > 0 && item.nama));
    } catch (err) {
      console.error("Gagal mengambil attribute", err);
    }
  };

  const fetchKpis = async () => {
    try {
      setLoading(true);
      const res = await kpiService.getByPeriode(selectedPeriodeId, currentPage, pageSize);
      setKpis(res.data);
      setTotalItems(Number(res.meta?.total || (res as any).totalCount || 0));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mengambil data KPI");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type: "add" | "edit" | "view", kpi?: KPI) => {
    setModalType(type);
    if (type === "add") {
      setSelectedKpi({
        periodeId: selectedPeriodeId,
        namaKpi: "",
        deskripsi: "",
        tipe: "Benefit",
        attributeId: attributes[0]?.id,
        GroupId: groups[0]?.Id || groups[0]?.id,
        bobot: 0
      });
    } else {
      setSelectedKpi(kpi || null);
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedKpi) return;
    try {
      setBtnLoading(true);

      // Map everything to the new backend structure
      const payload: any = {  
        NamaKpi: selectedKpi.namaKpi || selectedKpi.NamaKpi,
        Tipe: selectedKpi.tipe || selectedKpi.Tipe,
        PeriodeId: Number(selectedKpi.periodeId || selectedKpi.PeriodeId),
        GroupId: Number(selectedKpi.GroupId || 0) || null,
        attributeId: selectedKpi.attributeId || null,
        BobotAhp: Number(selectedKpi.bobot || selectedKpi.BobotAhp || selectedKpi.Bobot || 0),
      };

      if (modalType === "add") {
        await kpiService.create(payload);
      } else {
        const id = Number(selectedKpi.id || selectedKpi.Id);
        await kpiService.update({ ...payload, Id: id });
      }
      setShowModal(false);
      fetchKpis();
    } catch (err: any) {
      console.error("Submit Error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Gagal menyimpan data");
    } finally {
      setBtnLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus kriteria ini?")) {
      try {
        await kpiService.delete(id);
        fetchKpis();
      } catch (err: any) {
        if (err.status === 409 || err.response?.status === 409) {
          alert("KPI tidak dapat dihapus karena sudah memiliki data penilaian terkait.");
        } else {
          alert(err.response?.data?.message || "Gagal menghapus kriteria");
        }
      }
    }
  };

  const currentPeriode = periodes.find(p => p.id === selectedPeriodeId);
  const isLocked = currentPeriode?.Status === 'Final';

  return (
    <div className="flex flex-col gap-6">
      {/* Stepper Progress Tracker */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto overflow-x-auto gap-4">
          {[
            { step: 1, label: "Master KPI", icon: "solar:settings-bold" },
            { step: 2, label: "Bandingkan Grup", icon: "solar:folder-2-bold" },
            { step: 3, label: "Bandingkan KPI", icon: "solar:documents-bold" },
            { step: 4, label: "Input Nilai", icon: "solar:pen-new-square-bold" },
            { step: 5, label: "Hasil & Review", icon: "solar:chart-square-bold" }
          ].map((s, idx) => {
            const isCurrent = s.step === 1;
            const isDone = s.step < 1;
            return (
              <React.Fragment key={s.step}>
                <div className="flex flex-col items-center min-w-[100px] text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    isCurrent ? "bg-primary text-white ring-4 ring-primary/20" : 
                    isDone ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                  }`}>
                    <Icon icon={isDone ? "solar:check-read-bold" : s.icon} className="h-5 w-5" />
                  </div>
                  <span className={`text-xs font-bold whitespace-nowrap ${isCurrent ? "text-primary" : "text-gray-500"}`}>{s.label}</span>
                </div>
                {idx < 4 && <div className={`flex-1 h-[2px] min-w-[20px] mb-6 ${isDone ? "bg-green-500" : "bg-gray-100"}`} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Master Kriteria KPI</h1>
          <p className="text-sm text-gray-500">
            {isLocked ? "Periode ini sudah Final dan terkunci" : "Kelola kriteria penilaian berdasarkan Periode & Divisi"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <DataFilter
              value={selectedPeriodeId}
              onChange={(val) => {
                setSelectedPeriodeId(Number(val));
                setCurrentPage(1);
              }}
              options={periodes.map(p => ({ 
                value: p.id, 
                label: (p.NamaPeriode || p.namaPeriode) + " - " + (p.NamaDivisi || p.divisi?.namaDivisi || "") +  (p.Status === 'Final' ? ' (Final)' : p.isAktif ? ' (Aktif)' : ' (Tidak Aktif)')
              }))}
              placeholder="Pilih Periode"
              className="w-full md:w-64"
          />
          <Button 
            color="primary" 
            size="sm" 
            onClick={() => handleOpenModal("add")} 
            disabled={
              isReadOnly ||
              selectedPeriodeId === 0 ||
              isLocked ||
              !currentPeriode?.isAktif
            }
            className="w-full md:w-auto"
          >
            <Icon icon="solar:add-circle-linear" className="mr-2 h-5 w-5" />
            Tambah Kriteria
          </Button>
        </div>
      </div>

      {error && <Alert color="failure">{error}</Alert>}

      <CardBox>
        <DataTable
            loading={loading}
            data={kpis}
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

      {/* Modal CRUD */}
      <Modal show={showModal} onClose={() => setShowModal(false)} size="md">
        <Modal.Header>
          {modalType === "add" ? "Tambah Kriteria Baru" : modalType === "edit" ? "Edit Kriteria" : "Detail Kriteria"}
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="group" value="Grup KPI (Level 1)" />
              <Select
                id="group"
                value={selectedKpi?.GroupId || 0}
                onChange={(e) => setSelectedKpi({...selectedKpi!, GroupId: Number(e.target.value)})}
                disabled={modalType === "view"}
              >
                <option value={0}>Tidak Ada Grup</option>
                {groups.map(g => (
                  <option key={g.Id || g.id} value={g.Id || g.id}>{g.NamaGroup}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="nama" value="Nama Kriteria" />
              <TextInput
                id="nama"
                placeholder="Contoh: Kualitas Kerja"
                required
                value={selectedKpi?.namaKpi || selectedKpi?.NamaKpi || ""}
                onChange={(e) => setSelectedKpi({...selectedKpi!, namaKpi: e.target.value})}
                disabled={modalType === "view"}
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="tipe" value="Tipe" />
                <Select 
                  id="tipe" 
                  value={selectedKpi?.tipe || selectedKpi?.Tipe} 
                  onChange={(e) => setSelectedKpi({ ...selectedKpi!, tipe: e.target.value as "Benefit" | "Cost" })}
                  disabled={modalType === "view"}
                >
                  <option value="Benefit">Benefit</option>
                  <option value="Cost">Cost</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="attribute" value="Satuan / Attribute" />
                <Select
                  id="attribute"
                  value={selectedKpi?.attributeId || ""}
                  onChange={(e) => setSelectedKpi({ ...selectedKpi!, attributeId: e.target.value ? Number(e.target.value) : undefined })}
                  disabled={modalType === "view"}
                >
                  <option value="">Pilih Satuan (Optional)</option>
                  {attributes.map((attr) => (
                    <option key={attr.id} value={attr.id}>
                      {attr.nama} {attr.simbol ? `(${attr.simbol})` : ""}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          {modalType !== "view" && !isReadOnly && (
            <Button color="primary" onClick={handleSubmit} disabled={btnLoading}>
              {btnLoading ? <Spinner size="sm" className="mr-2" /> : null}
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
