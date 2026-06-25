"use client";
import React, { useState, useEffect } from "react";
import { Table, Button, TextInput, Select, Modal, Spinner, Alert, Badge } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import kpiService, { KPIGroup } from "@/services/kpiService";
import periodeService, { Periode } from "@/services/periodeService";
import { usePermission } from "@/hooks/usePermission";

const KPIGroupPage = () => {
    const { isAdminLike, user } = usePermission();
    const [periodes, setPeriodes] = useState<Periode[]>([]);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState<number>(0);
    const [groups, setGroups] = useState<KPIGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentGroup, setCurrentGroup] = useState<Partial<KPIGroup>>({ NamaGroup: "" });

    useEffect(() => {
        const fetchPeriodes = async () => {
            try {
                const res = await periodeService.getAll(1, 100);
                const list = res.data.filter((p: Periode) => {
                    if (isAdminLike && user?.dept_id) {
                        const divId = p.DivisiId ?? p.divisiId ?? p.divisi?.id;
                        return divId === 0 || Number(divId) === Number(user.dept_id);
                    }
                    return true;
                });
                setPeriodes(list);
                if (list.length > 0) setSelectedPeriodeId(list[0].Id || list[0].id);
            } catch (err) {
                setError("Gagal mengambil data periode");
            }
        };
        fetchPeriodes();
    }, []);

    useEffect(() => {
        const fetchGroups = async () => {
            if (!selectedPeriodeId) return;
            try {
                setLoading(true);
                const res = await kpiService.getGroups(selectedPeriodeId);
                setGroups(res.data);
            } catch (err) {
                setError("Gagal mengambil data grup KPI");
            } finally {
                setLoading(false);
            }
        };
        fetchGroups();
    }, [selectedPeriodeId]);

    const selectedPeriode = periodes.find(p => p.id === selectedPeriodeId || p.Id === selectedPeriodeId);
    const isLocked = selectedPeriode?.Status === 'locked';

    const handleSave = async () => {
        if (!currentGroup.NamaGroup) return;
        try {
            setLoading(true);
            if (isEdit && currentGroup.Id) {
                await kpiService.updateGroup(currentGroup.Id, { NamaGroup: currentGroup.NamaGroup });
            } else {
                await kpiService.createGroup({
                    NamaGroup: currentGroup.NamaGroup,
                    PeriodeId: selectedPeriodeId
                });
            }
            setShowModal(false);
            const res = await kpiService.getGroups(selectedPeriodeId);
            setGroups(res.data);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Gagal menyimpan grup");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Hapus grup kriteria ini? Semua KPI di dalamnya mungkin terpengaruh.")) return;
        try {
            await kpiService.deleteGroup(id);
            setGroups(groups.filter(g => (g.Id || g.id) !== id));
        } catch (err) {
            setError("Gagal menghapus grup");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-bold">KPI Groups (Level 1)</h1>
                    <p className="text-sm text-gray-500">Struktur Hierarki Penilaian Kinerja</p>
                </div>
                <div className="flex gap-4">
                    <Select
                        sizing="sm"
                        value={selectedPeriodeId}
                        onChange={(e) => setSelectedPeriodeId(Number(e.target.value))}
                    >
                        {periodes.map(p => (
                            <option key={p.Id || p.id} value={p.Id || p.id}>
                                {p.NamaPeriode || p.namaPeriode}
                            </option>
                        ))}
                    </Select>
                    <Button
                        size="sm"
                        color="primary"
                        onClick={() => {
                            setIsEdit(false);
                            setCurrentGroup({ NamaGroup: "" });
                            setShowModal(true);
                        }}
                        disabled={isLocked}
                    >
                        <Icon icon="solar:add-circle-bold" className="mr-2 h-4 w-4" />
                        Grup Baru
                    </Button>
                </div>
            </div>

            {error && <Alert color="failure" onDismiss={() => setError(null)}>{error}</Alert>}

            <CardBox>
                <div className="overflow-x-auto">
                    <Table hoverable striped>
                        <Table.Head>
                            <Table.HeadCell>Nama Grup KPI</Table.HeadCell>
                            <Table.HeadCell className="text-center">Bobot Global (Level 1)</Table.HeadCell>
                            <Table.HeadCell className="text-center">Aksi</Table.HeadCell>
                        </Table.Head>
                <Table.Body className="divide-y">
                    {loading ? (
                        <Table.Row><Table.Cell colSpan={3} className="text-center py-10"><Spinner /></Table.Cell></Table.Row>
                    ) : (groups || []).length > 0 ? (groups || []).map((group) => (
                            <Table.Row key={group.Id || group.id} className="bg-white">
                                <Table.Cell className="font-bold text-gray-900">{group.NamaGroup}</Table.Cell>
                                <Table.Cell className="text-center">
                                    {group.BobotGrup ? (
                                        <Badge color="info">{(Number(group.BobotGrup) * 100).toFixed(2)}%</Badge>
                                    ) : (
                                        <span className="text-gray-400 italic text-xs">Belum dihitung</span>
                                    )}
                                </Table.Cell>
                                <Table.Cell className="text-center">
                                    <div className="flex justify-center gap-2">
                                        <Button
                                            size="xs"
                                            color="info"
                                            onClick={() => {
                                                setIsEdit(true);
                                                setCurrentGroup(group);
                                                setShowModal(true);
                                            }}
                                            disabled={isLocked}
                                        >
                                            Edit
                                        </Button>
                                        <Button size="xs" color="failure" onClick={() => handleDelete(group.Id || group.id)} disabled={isLocked}>
                                            Hapus
                                        </Button>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                    )) : (
                        <Table.Row>
                            <Table.Cell colSpan={3} className="text-center py-10 text-gray-400 italic">
                                Belum ada grup KPI. Silakan buat grup tingkat pertama.
                            </Table.Cell>
                        </Table.Row>
                    )}
                </Table.Body>
                    </Table>
                </div>
            </CardBox>

                <Modal show={showModal} onClose={() => setShowModal(false)} size="md">
                    <Modal.Header>{isEdit ? "Edit Grup KPI" : "Tambah Grup KPI"}</Modal.Header>
                    <Modal.Body>
                        <div className="space-y-4">
                            <div>
                                <TextInput
                                    placeholder="Contoh: Hard Skill / Kompetensi Teknis"
                                    value={currentGroup.NamaGroup}
                                    onChange={(e) => setCurrentGroup({ ...currentGroup, NamaGroup: e.target.value })}
                                    disabled={isLocked}
                                />
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button color="primary" onClick={handleSave} disabled={loading || isLocked}>
                            {isLocked ? 'Periode Terkunci' : 'Simpan'}
                        </Button>
                        <Button color="gray" onClick={() => setShowModal(false)}>
                            Batal
                        </Button>
                    </Modal.Footer>
                </Modal>
        </div>
    );
};

export default KPIGroupPage;