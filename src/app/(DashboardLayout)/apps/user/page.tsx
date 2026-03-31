"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Badge, Spinner, Alert, Modal, Label, TextInput, Select, Pagination } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import userService, { User } from "@/services/userService";
import roleService, { Role } from "@/services/roleService";

const UserManagementPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [search, setSearch] = useState("");
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState<User | null>(null);
    const [formData, setFormData] = useState({ 
        username: '', 
        password: '', 
        roleId: 0 
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchRoles();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [page, search]);

    const fetchRoles = async () => {
        try {
            const res = await roleService.getAll();
            setRoles(res.data);
        } catch (err) {
            console.error("Gagal ambil roles");
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await userService.getAll(page, pageSize, search);
            setUsers(res.data);
            setTotalItems(res.totalCount);
            setError(null);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Gagal mengambil data user");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item?: User) => {
        if (item) {
            setEditData(item);
            setFormData({ 
                username: item.username, 
                password: '', // Blank for edit (only change if provided)
                roleId: item.roleId 
            });
        } else {
            setEditData(null);
            setFormData({ 
                username: '', 
                password: '', 
                roleId: roles.length > 0 ? roles[0].id : 0 
            });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if(!formData.username || (!editData && !formData.password) || !formData.roleId) {
            alert("Harap isi semua field yang wajib");
            return;
        }

        setSaving(true);
        try {
            if (editData) {
                // Update - password optional depending on backend logic (usually hash password if not empty)
                await userService.update({ 
                    ...editData, 
                    username: formData.username,
                    roleId: Number(formData.roleId),
                    ...(formData.password ? { passwordHash: formData.password } : {}) // Note: backend usually handles hashing logic
                });
            } else {
                await userService.create({
                    username: formData.username,
                    password: formData.password, // Backend expecting password string to hash
                    roleId: Number(formData.roleId)
                });
            }
            setShowModal(false);
            fetchUsers();
        } catch (err: any) {
            alert(err?.response?.data?.message || "Gagal menyimpan data user");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Hapus user ini?")) return;
        try {
            await userService.delete(id);
            fetchUsers();
        } catch (err: any) {
            alert("Gagal menghapus user");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Icon icon="solar:user-id-bold-duotone" className="text-primary" />
                        Manajemen User
                    </h1>
                    <p className="text-sm text-gray-500">Kelola akun pengguna dan penetapan role</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <TextInput 
                        placeholder="Cari username..." 
                        icon={() => <Icon icon="solar:magnifer-linear" />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full md:w-64"
                    />
                    <Button color="primary" onClick={() => handleOpenModal()}>
                        <Icon icon="solar:user-plus-linear" className="mr-2 h-5 w-5" />
                        Tambah
                    </Button>
                </div>
            </div>

            {error && <Alert color="failure">{error}</Alert>}

            <CardBox>
                <div className="overflow-x-auto min-h-[400px]">
                    <Table hoverable>
                        <Table.Head>
                            <Table.HeadCell>ID</Table.HeadCell>
                            <Table.HeadCell>Username</Table.HeadCell>
                            <Table.HeadCell>Role</Table.HeadCell>
                            <Table.HeadCell className="text-center">Aksi</Table.HeadCell>
                        </Table.Head>
                        <Table.Body>
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={4} className="text-center py-20">
                                        <Spinner size="xl" />
                                    </Table.Cell>
                                </Table.Row>
                            ) : users.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={4} className="text-center py-20 text-gray-400 italic">
                                        Data user tidak ditemukan.
                                    </Table.Cell>
                                </Table.Row>
                            ) : users.map((u) => (
                                <Table.Row key={u.id}>
                                    <Table.Cell className="font-mono text-xs text-gray-400">#{u.id}</Table.Cell>
                                    <Table.Cell className="font-bold">{u.username}</Table.Cell>
                                    <Table.Cell>
                                        <Badge color={
                                            u.role?.name === 'Admin' ? 'failure' : 
                                            u.role?.name === 'Developer' ? 'dark' : 
                                            u.role?.name === 'HRD' ? 'success' : 'info'
                                        }>
                                            {u.role?.name || 'No Role'}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex justify-center gap-2">
                                            <Button size="xs" color="light" onClick={() => handleOpenModal(u)}>
                                                <Icon icon="solar:pen-new-square-linear" className="h-4 w-4 text-primary" />
                                            </Button>
                                            <Button size="xs" color="light" onClick={() => handleDelete(u.id)}>
                                                <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </div>
                <div className="flex justify-center mt-4">
                    <Pagination
                        currentPage={page}
                        totalPages={Math.ceil(totalItems / pageSize)}
                        onPageChange={(p) => setPage(p)}
                        showIcons
                    />
                </div>
            </CardBox>

            <Modal show={showModal} onClose={() => setShowModal(false)}>
                <Modal.Header>{editData ? 'Edit User' : 'Tambah User'}</Modal.Header>
                <Modal.Body>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="username" value="Username" />
                            <TextInput 
                                id="username" 
                                value={formData.username} 
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="password" value={editData ? "Ganti Password (Biarkan kosong jika tidak diubah)" : "Password"} />
                            <TextInput 
                                id="password" 
                                type="password"
                                placeholder="******"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                required={!editData}
                            />
                        </div>
                        <div>
                            <Label htmlFor="roleId" value="Role" />
                            <Select 
                                id="roleId" 
                                value={formData.roleId} 
                                onChange={(e) => setFormData({...formData, roleId: Number(e.target.value)})}
                                required
                            >
                                <option value={0}>Pilih Role</option>
                                {roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </Select>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button color="primary" onClick={handleSave} disabled={saving}>
                        {saving && <Spinner size="sm" className="mr-2" />}
                        Simpan
                    </Button>
                    <Button color="gray" onClick={() => setShowModal(false)}>Batal</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default UserManagementPage;
