"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Table, Button, Badge, Spinner, Alert, Modal, Label, TextInput, Checkbox } from "flowbite-react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import roleService, { Role, RoleDetail } from "@/services/roleService";
import permissionService, { Permission } from "@/services/permissionService";
import { usePermission } from "@/hooks/usePermission";

// Shared Components
import DataTable, { Column } from "@/app/components/shared/DataTable";
import DataPagination from "@/app/components/shared/DataPagination";

const RolePage = () => {
    const { hasPermission } = usePermission();
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // Detail modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailRole, setDetailRole] = useState<RoleDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<{ type: "success" | "failure"; text: string } | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const isAdminRole = detailRole?.role_name?.toLowerCase() === "admin";

    const columns: Column<Role>[] = [
        {
            header: "Nama Peran",
            render: (item: Role) => (
                <div className="flex items-center gap-2">
                    <Icon icon="solar:shield-user-bold" className="text-primary text-lg" />
                    <div className="flex flex-col">
                        <span className="font-bold">{item.role_name}</span>
                        <span className="text-[10px] text-gray-400 font-mono italic">ID: {item.id}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Jumlah Hak Akses",
            render: (item: Role) => (
                <Badge color="info">{item.permission_count ?? 0} Hak Akses</Badge>
            )
        },
        {
            header: "Ringkasan",
            render: (item: Role) => (
                <div className="flex flex-wrap gap-1 max-w-md">
                    {(item.permissions || []).slice(0, 3).map((perm, i) => (
                        <Badge key={i} color="gray" className="text-[10px]">{perm}</Badge>
                    ))}
                    {(item.permissions || []).length > 3 && (
                        <Badge color="gray" className="text-[10px]">+{(item.permissions || []).length - 3} lagi</Badge>
                    )}
                    {(!item.permissions || item.permissions.length === 0) && (
                        <span className="text-xs text-gray-400 italic">Tidak ada hak akses</span>
                    )}
                </div>
            )
        },
        {
            header: "Aksi",
            headerClasses: "text-right",
            cellClasses: "text-right",
            render: (item: Role) => (
                <div className="flex justify-end gap-2">
                    <Button color="primary" size="xs" onClick={() => handleOpenDetail(item)}>
                        <Icon icon="solar:eye-bold" className="text-base mr-1" />
                        Lihat Detail
                    </Button>
                </div>
            )
        }
    ];

    useEffect(() => {
        fetchData();
    }, [page, pageSize, search]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [roleRes, permRes] = await Promise.all([
                roleService.getAll(page, pageSize, search),
                permissionService.getAll()
            ]);
            setRoles(roleRes.data);
            setTotalItems(roleRes.meta?.total || roleRes.data.length);
            setPermissions(permRes.data);
            setError(null);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Gagal mengambil data role/permission");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDetail = async (role: Role) => {
        setShowDetailModal(true);
        setDetailLoading(true);
        setSaveMsg(null);
        try {
            const [detailRes, rolePerms] = await Promise.all([
                roleService.getById(role.id),
                roleService.getRolePermissions(role.id),
            ]);

            let roleDetail = detailRes.data;

            // Use the more reliable getRolePermissions if detail has none
            const assignedPerms = rolePerms.length > 0
                ? rolePerms
                : (roleDetail?.permissions || []);

            if (detailRes.success && roleDetail) {
                setDetailRole({ ...roleDetail, permissions: assignedPerms });
            } else {
                // Fallback: construct detail from list data
                setDetailRole({
                    id: role.id,
                    role_name: role.role_name,
                    permissions: assignedPerms,
                });
            }
            setSelectedPermIds(assignedPerms.map(p => p.id));
        } catch {
            setDetailRole(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const togglePerm = (permId: number) => {
        setSelectedPermIds(prev =>
            prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
        );
    };

    const handleSavePermissions = async () => {
        if (!detailRole) return;
        setSaving(true);
        setSaveMsg(null);
        try {
            const res = await roleService.setPermissions(detailRole.id, selectedPermIds);
            setSaveMsg({ type: "success", text: res.message || "Berhasil menyimpan hak akses." });
            fetchData(); // Refresh list
            // Reload detail
            const updated = await roleService.getById(detailRole.id);
            if (updated.success && updated.data) {
                setDetailRole(updated.data);
                setSelectedPermIds(updated.data.permissions.map(p => p.id));
            }
        } catch (err: any) {
            setSaveMsg({
                type: "failure",
                text: err?.response?.data?.message || "Gagal menyimpan hak akses."
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Icon icon="solar:user-rounded-bold-duotone" className="text-primary" />
                        Manajemen Peran & Hak Akses
                    </h1>
                    <p className="text-sm text-gray-500">Daftar peran dalam sistem beserta hak akses yang dimiliki</p>
                </div>
                <TextInput
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Cari nama peran..."
                    sizing="sm"
                    className="w-full md:w-64"
                />
            </div>

            {error && <Alert color="failure">{error}</Alert>}

            <CardBox>
                <DataTable
                    columns={columns}
                    data={roles}
                    loading={loading}
                    striped
                    rowKey={(item: Role) => item.id}
                    emptyMessage="Tidak ada data peran."
                />

                <DataPagination
                    currentPage={page}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                />
            </CardBox>

            {/* Detail Role + Permission Mapping Modal */}
            <Modal show={showDetailModal} onClose={() => setShowDetailModal(false)} size="4xl">
                <Modal.Header>
                    {detailRole ? `Detail Peran — ${detailRole.role_name}` : "Detail Peran"}
                </Modal.Header>
                <Modal.Body>
                    {detailLoading ? (
                        <div className="flex justify-center py-10">
                            <Spinner size="xl" />
                        </div>
                    ) : detailRole ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <Icon icon="solar:shield-user-bold" className="text-primary text-2xl" />
                                <div>
                                    <p className="font-bold text-lg">{detailRole.role_name}</p>
                                    <p className="text-xs text-gray-500">ID: {detailRole.id} · {detailRole.permissions.length} hak akses ter-assign</p>
                                </div>
                                {isAdminRole && (
                                    <Badge color="warning" className="ml-auto">Admin — semua akses</Badge>
                                )}
                            </div>

                            {saveMsg && (
                                <Alert color={saveMsg.type === "success" ? "success" : "failure"}>
                                    {saveMsg.text}
                                </Alert>
                            )}

                            <div>
                                <Label value="Hak Akses (Permission)" className="mb-2 block font-semibold" />
                                <p className="text-xs text-gray-500 mb-3">
                                    {isAdminRole
                                        ? "Role Admin memiliki semua hak akses secara otomatis."
                                        : "Centang atauhapus hak akses untuk peran ini, lalu klik Simpan."}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto border rounded-lg p-3">
                                    {permissions.map((perm) => {
                                        const isAssigned = selectedPermIds.includes(perm.id);
                                        return (
                                            <div
                                                key={perm.id}
                                                className={`flex items-center gap-2 p-2 rounded border transition-colors ${
                                                    isAssigned
                                                        ? "bg-primary/5 border-primary/30"
                                                        : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-600"
                                                }`}
                                            >
                                                <Checkbox
                                                    id={`perm-${perm.id}`}
                                                    checked={isAssigned}
                                                    onChange={() => togglePerm(perm.id)}
                                                    disabled={isAdminRole || saving}
                                                />
                                                <Label htmlFor={`perm-${perm.id}`} className="cursor-pointer flex-1">
                                                    <span className="text-xs font-semibold block">{perm.permission_name}</span>
                                                    <span className="text-[10px] text-gray-500 block">{perm.path}</span>
                                                </Label>
                                            </div>
                                        );
                                    })}
                                    {permissions.length === 0 && (
                                        <p className="text-sm text-gray-400 italic col-span-2 text-center py-4">
                                            Tidak ada data permission.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-10">Gagal memuat detail peran.</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {!isAdminRole && (
                        <Button color="primary" onClick={handleSavePermissions} disabled={saving || detailLoading}>
                            {saving ? <Spinner size="sm" className="mr-2" /> : null}
                            Simpan Perubahan
                        </Button>
                    )}
                    <Button color="gray" onClick={() => setShowDetailModal(false)}>Tutup</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default RolePage;
