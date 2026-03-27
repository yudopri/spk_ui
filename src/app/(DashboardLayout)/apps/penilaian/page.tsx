"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Table, Button, Select, TextInput, Badge, Alert, Spinner } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import periodeService, { Periode } from "@/services/periodeService";
import kpiService, { KPI } from "@/services/kpiService";
import karyawanService, { Karyawan } from "@/services/karyawanService";
import spkService from "@/services/spkService";

const PenilaianKaryawan = () => {
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number>(0);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [allEmployees, setAllEmployees] = useState<Karyawan[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [periodeRes, karyawanRes] = await Promise.all([
          periodeService.getAll(1, 100),
          karyawanService.getAll({ page: 1, pageSize: 1000, sort: "id" }),
        ]);

        const aktif = periodeRes.data.filter((p) => p.isAktif);
        setPeriodes(aktif);
        setAllEmployees(karyawanRes.data);

        if (aktif.length > 0) {
          setSelectedPeriodeId(aktif[0].id);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Gagal mengambil data awal");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchKpis = async () => {
      if (!selectedPeriodeId) {
        setKpis([]);
        return;
      }

      try {
        setLoading(true);
        const res = await kpiService.getByPeriode(selectedPeriodeId, 1, 100);
        setKpis(res.data);
        setError(null);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Gagal mengambil KPI periode");
      } finally {
        setLoading(false);
      }
    };

    fetchKpis();
  }, [selectedPeriodeId]);

  useEffect(() => {
    const fetchExistingScores = async () => {
      if (!selectedPeriodeId || kpis.length === 0) return;
      try {
        const res = await spkService.getMooraPenilaian(selectedPeriodeId);
        if (res.success && res.data && res.data.length > 0) {
          const loadedScores: Record<string, string> = {};
          res.data.forEach((item) => {
            loadedScores[`${item.karyawanId}-${item.kpiId}`] = item.nilai.toString();
          });
          setScores(loadedScores);
        } else {
          setScores({});
        }
      } catch (err) {
        console.error("Gagal mengambil data penilaian eksisting", err);
      }
    };
    fetchExistingScores();
  }, [selectedPeriodeId, kpis]);

  const selectedPeriode = periodes.find((p) => p.id === selectedPeriodeId);

  const employees = useMemo(() => {
    if (!selectedPeriodeId || !selectedPeriode) return [];
    if (!selectedPeriode.divisiId) return allEmployees;
    return allEmployees.filter((e) => e.divisiId === selectedPeriode.divisiId);
  }, [allEmployees, selectedPeriode, selectedPeriodeId]);

  const handleSaveAll = async () => {
    if (!selectedPeriodeId || kpis.length === 0 || employees.length === 0) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const payload: {
        id: number;
        karyawanId: number;
        kpiId: number;
        periodeId: number;
        nilai: number;
      }[] = [];

      for (const emp of employees) {
        for (const kpi of kpis) {
          const key = `${emp.id}-${kpi.id}`;
          const raw = scores[key];
          
          // Jika field kosong (dihapus oleh user), kita bisa mengirim nilai 0 atau menghapusnya via API
          // Namun sesuai permintaan "bisa dihapus atau ditimpa", kita pastikan nilai yang ada dikirim 
          // ke backend untuk menimpa data lama.
          payload.push({
            id: 0,
            karyawanId: emp.id,
            kpiId: kpi.id,
            periodeId: selectedPeriodeId,
            nilai: raw === "" || raw === undefined ? 0 : Number(raw),
          });
        }
      }

      if (payload.length === 0 && employees.length > 0) {
        setError("Belum ada nilai yang diinput");
        return;
      }

      // 1. Hapus nilai lama untuk periode & karyawan yang sedang diproses agar tidak duplikat (Opsional tergantung logic backend)
      // Jika backend menggunakan 'Upsert' (Update or Insert) berdasarkan karyawanId + kpiId + periodeId, 
      // maka cukup kirim POST saja. Jika tidak, kita bisa tambahkan delete per karyawan.
      // Di sini kita asumsikan backend akan menimpa (overwrite) data berdasarkan kunci unik tersebut.

      const res = await spkService.saveMooraPenilaian(payload);
      
      // Hitung otomatis MOORA setelah simpan penilaian
      await spkService.calculateMoora(selectedPeriodeId);
      
      setSuccess(res?.message || "Penilaian berhasil disimpan dan ranking diperbarui");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal menyimpan penilaian");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold">Penilaian Karyawan</h1>
          <p className="text-sm text-gray-500">Input nilai KPI karyawan berdasarkan Periode & Divisi</p>
        </div>
        <div className="flex gap-4">
            <Select
              value={selectedPeriodeId}
              onChange={(e) => setSelectedPeriodeId(Number(e.target.value))}
              sizing="sm"
              className="w-64"
            >
                <option value={0}>Pilih Periode - Divisi</option>
                {periodes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.namaPeriode} - {p.divisi?.namaDivisi}
                  </option>
                ))}
            </Select>
            <Button
              color="primary"
              size="sm"
              onClick={handleSaveAll}
              disabled={submitting || !selectedPeriodeId || kpis.length === 0 || employees.length === 0}
            >
               <Icon icon="solar:diskette-bold-duotone" className="mr-2 h-5 w-5" />
               {submitting ? "Menyimpan..." : "Simpan Semua"}
            </Button>
        </div>
      </div>

      {error && <Alert color="failure">{error}</Alert>}
      {success && <Alert color="success">{success}</Alert>}

      <CardBox>
        <div className="mb-4 flex items-center justify-between">
           <h5 className="font-semibold text-primary underline decoration-dotted">
             {selectedPeriodeId === 0
              ? "Silakan pilih periode untuk melihat kriteria" 
              : `Kriteria Aktif: ${kpis.map((k) => k.namaKpi).join(", ")}`}
           </h5>
           {selectedPeriodeId !== 0 && (
             <Badge color="info">Target: {selectedPeriode?.divisi?.namaDivisi || "Semua Karyawan"}</Badge>
           )}
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-10">
              <Spinner size="xl" />
            </div>
          ) : (
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>NIK</Table.HeadCell>
              <Table.HeadCell>Nama Karyawan</Table.HeadCell>
              <Table.HeadCell>Divisi/Unit</Table.HeadCell>
              {kpis.map((kpi) => (
                <Table.HeadCell key={kpi.id} className="text-center">{kpi.namaKpi}</Table.HeadCell>
              ))}
            </Table.Head>
            <Table.Body className="divide-y">
              {employees.length > 0 ? employees.map((emp) => (
                <Table.Row key={emp.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell className="font-medium text-gray-900 dark:text-white">{emp.nik}</Table.Cell>
                  <Table.Cell>{emp.nama}</Table.Cell>
                  <Table.Cell>
                    <Badge color="gray" size="sm">{emp.divisi?.namaDivisi || "N/A"}</Badge>
                  </Table.Cell>
                  {kpis.map((kpi) => {
                    const key = `${emp.id}-${kpi.id}`;
                    return (
                    <Table.Cell key={kpi.id} className="text-center">
                       <TextInput
                         type="number"
                         sizing="sm"
                         placeholder="0-100"
                         className="w-20 mx-auto"
                         value={scores[key] ?? ""}
                         onChange={(e) => {
                           const value = e.target.value;
                           setScores((prev) => ({ ...prev, [key]: value }));
                         }}
                       />
                    </Table.Cell>
                  );})}
                </Table.Row>
              )) : (
                <Table.Row>
                   <Table.Cell colSpan={3 + kpis.length} className="text-center py-20 text-gray-400">
                      {selectedPeriodeId === 0
                        ? "Pilih Periode - Divisi di atas untuk menampilkan daftar karyawan" 
                        : "Tidak ada karyawan ditemukan untuk unit kerja ini."}
                   </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
          )}
        </div>
      </CardBox>
    </div>
  );
};

export default PenilaianKaryawan;
