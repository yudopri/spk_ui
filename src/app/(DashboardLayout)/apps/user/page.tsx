"use client";
import React, { useState, useEffect } from "react";
import { Table, Badge, Spinner, Alert, TextInput } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import userService, { User } from "@/services/userService";
import { usePermission } from "@/hooks/usePermission";

const UserManagementPage = () => {
    const { hasPermission } = usePermission();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await userService.getAll();
            setUsers(res.data || []);
            setError(null);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Gagal mengambil data user (Mitra)");
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(search.toLowerCase()) || 
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.role?.toLowerCase().includes(search.toLowerCase())
    );

    if (!hasPermission("user_manage")) {
        return (
            <div className="p-4">
                <Alert color="failure">
                    Anda tidak memiliki izin (user_manage) untuk mengakses halaman ini.
                </Alert>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Icon icon="solar:user-id-bold-duotone" className="text-primary" />
                        Manajemen Pengguna
                    </h1>
                    <p className="text-sm text-gray-500">Daftar pengguna terdaftar dalam sistem HRIS</p>
                </div>
            </div>

            {error && <Alert color="failure">{error}</Alert>}

            <CardBox>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="relative w-full md:w-96">
                        <TextInput
                            placeholder="Cari pengguna (nama, email, atau role)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            icon={() => <Icon icon="solar:magnifer-linear" className="text-xl" />}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table hoverable>
                        <Table.Head>
                            <Table.HeadCell>ID</Table.HeadCell>
                            <Table.HeadCell>Nama</Table.HeadCell>
                            <Table.HeadCell>Email</Table.HeadCell>
                            <Table.HeadCell>Role</Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="divide-y">
                            {loading ? (
                                <Table.Row>
                                    <Table.Cell colSpan={4} className="text-center py-10">
                                        <Spinner size="xl" />
                                    </Table.Cell>
                                </Table.Row>
                            ) : filteredUsers.length === 0 ? (
                                <Table.Row>
                                    <Table.Cell colSpan={4} className="text-center py-10 text-gray-500">
                                        Tidak ada data user yang sesuai.
                                    </Table.Cell>
                                </Table.Row>
                            ) : (
                                filteredUsers.map((user) => (
                                    <Table.Row key={user.id}>
                                        <Table.Cell className="font-medium">{user.id}</Table.Cell>
                                        <Table.Cell>{user.name}</Table.Cell>
                                        <Table.Cell>{user.email}</Table.Cell>
                                        <Table.Cell>
                                            <Badge color="info">{user.role}</Badge>
                                        </Table.Cell>
                                    </Table.Row>
                                ))
                            )}
                        </Table.Body>
                    </Table>
                </div>
            </CardBox>
        </div>
    );
};

export default UserManagementPage;
