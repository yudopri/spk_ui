"use client";
import React, { useState, useEffect } from "react";
import { Table, Button, Badge, Spinner, Alert, Modal, Label, TextInput, Textarea } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import permissionService, { Permission } from "@/services/permissionService";

const PermissionPage = () => {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState<Permission | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [saving, setSaving] = useState(false);

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
            setFormData({ name: item.name, description: item.description });
        } else {
            setEditData(null);
            setFormData({ name: '', description: '' });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
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

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Icon icon="solar:shield-keyhole-bold-duotone" className="text-primary" />
                        Manajemen Permission
                    </h1>
                    <p className="text-sm text-gray-500">Kelola hak akses sistem (RBAC Configuration)</p>
                </div>
                <Button color="primary" onClick={() => handleOpenModal()}>
                    <Icon icon="solar:add-circle-linear" className="mr-2 h-5 w-5" />
                    Tambah Permission
                </Button>
            </div>

            {error && <Alert color="failure">{error}</Alert>}

            <CardBox>
                <div className="overflow-x-auto">
                    <Table hoverable>
                        <Table.Head>
                            <Table.HeadCell>ID</Table.HeadCell>
                            <Table.HeadCell>Key Name</Table.HeadCell>
                            <Table.HeadCell>Description</Table.HeadCell>
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
                                    <Table.Cell colSpan={4} className="text-center py-10 text-gray-500 italic">
                                        Belum ada data permission.
                                    </Table.Cell>
                                </Table.Row>
                            ) : permissions.map((item) => (
                                <Table.Row key={item.id}>
                                    <Table.Cell className="font-mono text-xs">{item.id}</Table.Cell>
                                    <Table.Cell>
                                        <Badge color="info" className="font-mono">{item.name}</Badge>
                                    </Table.Cell>
                                    <Table.Cell>{item.description}</Table.Cell>
                                    <Table.Cell>
                                        <div className="flex justify-center gap-2">
                                            <Button size="xs" color="light" onClick={() => handleOpenModal(item)}>
                                                <Icon icon="solar:pen-new-square-linear" className="h-4 w-4 text-primary" />
                                            </Button>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </div>
            </CardBox>

            <Modal show={showModal} onClose={() => setShowModal(false)}>
                <Modal.Header>{editData ? 'Edit Permission' : 'Tambah Permission baru'}</Modal.Header>
                <Modal.Body>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name" value="Key Name (slug)" />
                            <TextInput
                                id="name"
                                placeholder="e.g. data_view"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="desc" value="Deskripsi" />
                            <Textarea
                                id="desc"
                                placeholder="Jelaskan fungsi permission ini..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button color="primary" onClick={handleSave} disabled={saving}>
                        {saving ? <Spinner size="sm" className="mr-2" /> : null}
                        Simpan
                    </Button>
                    <Button color="gray" onClick={() => setShowModal(false)}>Batal</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default PermissionPage;
