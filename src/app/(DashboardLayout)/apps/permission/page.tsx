"use client";
import React, { useState, useEffect } from "react";
import { Table, Button, Badge, Spinner, Alert, Modal, Label, TextInput } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import permissionService, { Permission } from "@/services/permissionService";
import { usePermission } from "@/hooks/usePermission";

const PermissionPage = () => {
    const { hasPermission } = usePermission();
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState<Permission | null>(null);
    const [formData, setFormData] = useState({ permission_name: '', path: '' });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);

    const canManage = hasPermission("user_manage");

    useEffect(() => {
        fetchPermissions();
    }, []);

    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const res = await permissionService.getAll();
            setPermissions(res.data);
            setError(null);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Gagal mengambil data permission");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item?: Permission) => {
        if (item) {
            setEditData(item);
            setFormData({ permission_name: item.permission_name, path: item.path });
        } else {
            setEditData(null);
            setFormData({ permission_name: '', path: '' });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.permission_name.trim() || !formData.path.trim()) {
            alert("Nama hak akses dan path wajib diisi.");
            return;
        }
        setSaving(true);
        try {
            if (editData) {
                await permissionService.update({ ...editData, ...formData });
            } else {
                await permissionService.create(formData);
            }
            setShowModal(false);
            fetchPermissions();
        } catch (err: any) {
            alert(err?.response?.data?.message || "Gagal menyimpan data");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (item: Permission) => {
        if (!confirm(`Hapus permission "${item.permission_name}"? Permission yang masih digunakan oleh role tidak dapat dihapus.`)) return;
        setDeleting(item.id);
        try {
            await permissionService.delete(item.id);
            fetchPermissions();
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Gagal menghapus permission.";
            alert(msg);
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Icon icon="solar:shield-keyhole-bold-duotone" className="text-primary" />
                        Manajemen Hak Akses
                    </h1>
                    <p className="text-sm text-gray-500">Kelola hak akses yang dapat diberikan ke setiap peran</p>
                </div>
                {canManage && (
                    <Button color="primary" onClick={() => handleOpenModal()}>
                        <Icon icon="solar:add-circle-linear" className="mr-2 h-5 w-5" />
                        Tambah Hak Akses
                    </Button>
                )}
            </div>

            {error && <Alert color="failure">{error}</Alert>}

            <CardBox>
                <div className="overflow-x-auto">
                    <Table hoverable>
                        <Table.Head>
                            <Table.HeadCell>ID</Table.HeadCell>
                            <Table.HeadCell>Nama Hak Akses</Table.HeadCell>
                            <Table.HeadCell>Path</Table.HeadCell>
                            <Table.HeadCell className="text-center">Aksi</Table.HeadCell>
                        </Table.Head>
                        <Table.Body>
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={4} className="text-center py-10">
                                        <Spinner size="xl" />
                                    </Table.Cell>
                                </Table.Row>
                            ) : permissions.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={4} className="text-center py-10">
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Icon icon="solar:shield-keyhole-bold" className="text-4xl" />
                                            <p className="italic">Belum ada data permission.</p>
                                            <p className="text-xs">Klik "Tambah Hak Akses" untuk membuat permission baru.</p>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ) : permissions.map((item) => (
                                <Table.Row key={item.id}>
                                    <Table.Cell className="font-mono text-xs">{item.id}</Table.Cell>
                                    <Table.Cell>
                                        <Badge color="info" className="font-mono">{item.permission_name}</Badge>
                                    </Table.Cell>
                                    <Table.Cell className="text-sm text-gray-600">{item.path}</Table.Cell>
                                    <Table.Cell>
                                        <div className="flex justify-center gap-2">
                                            {canManage && (
                                                <>
                                                    <Button size="xs" color="light" onClick={() => handleOpenModal(item)}>
                                                        <Icon icon="solar:pen-new-square-linear" className="h-4 w-4 text-primary" />
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        color="failure"
                                                        outline
                                                        onClick={() => handleDelete(item)}
                                                        disabled={deleting === item.id}
                                                    >
                                                        {deleting === item.id ? (
                                                            <Spinner size="sm" />
                                                        ) : (
                                                            <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <Badge color="gray">{permissions.length} Total Hak Akses</Badge>
                </div>
            </CardBox>

            <Modal show={showModal} onClose={() => setShowModal(false)}>
                <Modal.Header>{editData ? 'Edit Permission' : 'Tambah Hak Akses Baru'}</Modal.Header>
                <Modal.Body>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="perm_name" value="Nama Hak Akses (slug)" />
                            <TextInput
                                id="perm_name"
                                placeholder="Contoh: data_karyawan_view"
                                value={formData.permission_name}
                                onChange={(e) => setFormData({ ...formData, permission_name: e.target.value })}
                                required
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Gunakan format snake_case. Harus unik.</p>
                        </div>
                        <div>
                            <Label htmlFor="perm_path" value="Path" />
                            <TextInput
                                id="perm_path"
                                placeholder="Contoh: /karyawan/view"
                                value={formData.path}
                                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                                required
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Path rute terkait permission ini.</p>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button color="primary" onClick={handleSave} disabled={saving}>
                        {saving ? <Spinner size="sm" className="mr-2" /> : null}
                        {editData ? 'Perbarui' : 'Simpan'}
                    </Button>
                    <Button color="gray" onClick={() => setShowModal(false)}>Batal</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default PermissionPage;
