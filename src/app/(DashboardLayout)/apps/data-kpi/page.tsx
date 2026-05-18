"use client";
import React, { useState, useEffect } from "react";
import { Table, Button, Badge, Modal, Label, TextInput, Select, Textarea, Spinner, Alert } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import kpiService, { KPI, KPIGroup } from "@/services/kpiService";
import periodeService, { Periode } from "@/services/periodeService";
import { usePermission } from "@/hooks/usePermission";

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
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

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
      setTotalItems(res.totalCount);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Master Kriteria KPI</h1>
          <p className="text-sm text-gray-500">
            {isLocked ? "Periode ini sudah Final dan terkunci" : "Kelola kriteria penilaian berdasarkan Periode & Divisi"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="w-64">
            <Select
              value={selectedPeriodeId}
              onChange={(e) => setSelectedPeriodeId(parseInt(e.target.value))}
              sizing="sm"
            >
              <option value={0}>Pilih Periode</option>
              {periodes.map((p) => (
                <option key={p.id} value={p.id}>
                  {(p.NamaPeriode || p.namaPeriode) + " - " + (p.NamaDivisi || p.divisi?.namaDivisi || "") +  (p.Status === 'Final' ? ' (Final)' : p.isAktif ? ' (Aktif)' : ' (Tidak Aktif)')}
                </option>
              ))}
            </Select>
          </div>
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
          >
            <Icon icon="solar:add-circle-linear" className="mr-2 h-5 w-5" />
            Tambah Kriteria
          </Button>
        </div>
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
                <Table.HeadCell>Nama Kriteria</Table.HeadCell>
                <Table.HeadCell>Tipe</Table.HeadCell>
                <Table.HeadCell>Satuan</Table.HeadCell>
                <Table.HeadCell className="text-center">Aksi</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {kpis.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={5} className="text-center py-10 text-gray-500">
                      Belum ada kriteria untuk periode ini
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  kpis.map((kpi) => (
                    <Table.Row key={kpi.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                      <Table.Cell className="font-medium text-gray-900 dark:text-white">
                        {kpi.namaKpi}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={kpi.tipe === "Benefit" ? "success" : "warning"} size="sm" className="w-fit">
                          {kpi.tipe}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell className="text-sm">
                        {kpi.nama_satuan ? `${kpi.nama_satuan} (${kpi.simbol || '-'})` : (kpi.simbol || '-')}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex justify-center gap-2">
                          <Button color="light" size="xs" onClick={() => handleOpenModal("view", kpi)}>
                            <Icon icon="solar:eye-linear" className="h-4 w-4" />
                          </Button>
                          {!isReadOnly && (
                            <>
                              <Button 
                                color="light" 
                                size="xs" 
                                onClick={() => handleOpenModal("edit", kpi)}
                                disabled={isLocked || !currentPeriode?.isAktif}
                              >
                                <Icon icon="solar:pen-new-square-linear" className="h-4 w-4 text-primary" />
                              </Button>
                              <Button 
                                color="light" 
                                size="xs" 
                                onClick={() => handleDelete(kpi.id)}
                                disabled={isLocked || !currentPeriode?.isAktif}
                              >
                                <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table>
          )}
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
