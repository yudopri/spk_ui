"use client";
import React, { useState, useEffect } from "react";
import { Table, Button, Badge, Spinner, Alert, Modal, Label, TextInput, Checkbox } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import roleService, { Role, RolePermission } from "@/services/roleService";
import permissionService, { Permission } from "@/services/permissionService";
import { usePermission } from "@/hooks/usePermission";

const RolePage = () => {
    const { hasPermission } = usePermission();
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState<Role | null>(null);
    const [formData, setFormData] = useState({ name: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [roleRes, permRes] = await Promise.all([
                roleService.getAll(),
                permissionService.getAll()
            ]);
            setRoles(roleRes.data);
            setPermissions(permRes.data);
            setError(null);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Gagal mengambil data role/permission");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item?: Role) => {
        if (item) {
            setEditData(item);
            setFormData({ name: item.name });
        } else {
            setEditData(null);
            setFormData({ name: '' });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editData) {
                await roleService.update({ ...editData, ...formData });
            } else {
                await roleService.create({ ...formData, rolePermissions: [] });
            }
            setShowModal(false);
            fetchData();
        } catch (err: any) {
            alert(err?.response?.data?.message || "Gagal menyimpan data");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Apakah Anda yakin ingin menghapus role ini?")) return;
        try {
            await roleService.delete(id);
            fetchData();
        } catch (err: any) {
            alert(err?.response?.data?.message || "Gagal menghapus data");
        }
    };

    const togglePermission = async (role: Role, permissionId: number) => {
        const existing = role.rolePermissions.find(rp => rp.permissionId === permissionId);
        try {
            if (existing) {
                await roleService.revokePermission(existing.id);
            } else {
                await roleService.assignPermission(role.id, permissionId);
            }
            fetchData(); // Refresh list to reflect changes
        } catch (err: any) {
            alert("Gagal mengubah permission");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Icon icon="solar:user-rounded-bold-duotone" className="text-primary" />
                        Manajemen Role & Permission
                    </h1>
                    <p className="text-sm text-gray-500">Konfigurasi hak akses per tingkatan jabatan (ACL)</p>
                </div>
                {hasPermission("user_manage") && (
                    <Button color="primary" onClick={() => handleOpenModal()}>
                        <Icon icon="solar:add-circle-linear" className="mr-2 h-5 w-5" />
                        Tambah Role
                    </Button>
                )}
            </div>

            {error && <Alert color="failure">{error}</Alert>}

            <CardBox>
                <div className="overflow-x-auto">
                    <Table hoverable>
                        <Table.Head>
                            <Table.HeadCell>Role Name</Table.HeadCell>
                            <Table.HeadCell>Permissions Matrix</Table.HeadCell>
                            <Table.HeadCell className="text-center">Aksi</Table.HeadCell>
                        </Table.Head>
                        <Table.Body>
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={3} className="text-center py-10">
                                        <Spinner size="xl" />
                                    </Table.Cell>
                                </Table.Row>
                            ) : roles.map((role) => (
                                <Table.Row key={role.id}>
                                    <Table.Cell className="font-bold whitespace-nowrap align-top pt-4">
                                        <div className="flex flex-col gap-1">
                                            <span>{role.name}</span>
                                            <span className="text-[10px] text-gray-400 font-mono italic">Role ID: {role.id}</span>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 py-2">
                                            {permissions.map((perm) => {
                                                const isAssigned = role.rolePermissions.some(rp => rp.permissionId === perm.id);
                                                return (
                                                    <div key={perm.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-100 dark:border-gray-600">
                                                        <Checkbox 
                                                            id={`role-${role.id}-perm-${perm.id}`}
                                                            checked={isAssigned}
                                                            onChange={() => togglePermission(role, perm.id)}
                                                            disabled={!hasPermission("user_manage")}
                                                        />
                                                        <div className="flex flex-col">
                                                            <Label htmlFor={`role-${role.id}-perm-${perm.id}`} className="text-xs font-semibold cursor-pointer">
                                                                {perm.name}
                                                            </Label>
                                                            <span className="text-[10px] text-gray-500">{perm.description}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell className="align-top pt-4">
                                        <div className="flex justify-center gap-2">
                                            {hasPermission("user_manage") && (
                                                <>
                                                    <Button size="xs" color="light" onClick={() => handleOpenModal(role)}>
                                                        <Icon icon="solar:pen-new-square-linear" className="h-4 w-4 text-primary" />
                                                    </Button>
                                                    <Button size="xs" color="light" onClick={() => handleDelete(role.id)}>
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
                </div>
            </CardBox>

            <Modal show={showModal} onClose={() => setShowModal(false)}>
                <Modal.Header>{editData ? 'Edit Role' : 'Tambah Role Baru'}</Modal.Header>
                <Modal.Body>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="roleName" value="Role Name" />
                            <TextInput
                                id="roleName"
                                placeholder="e.g. Supervisor"
                                value={formData.name}
                                onChange={(e) => setFormData({ name: e.target.value })}
                                required
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

export default RolePage;
