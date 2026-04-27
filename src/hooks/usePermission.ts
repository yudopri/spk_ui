"use client";
import { useEffect, useState } from "react";
import { getStoredUser } from "@/utils/authSession";
import {
    canAccessAuditLogs,
    filterEmployeesByRoleScope,
    isAdminLikeRole,
    isKaryawanRole,
    isReadOnlyBusinessRole,
    normalizeRole,
} from "@/utils/accessControl";

const normalizePermissions = (raw: unknown): string[] => {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((item: any) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object") return item.name || item.permission || item.code || "";
            return "";
        })
        .filter((item: string) => Boolean(item));
};

export const usePermission = () => {
    const [permissions, setPermissions] = useState<string[]>([]);
    const [role, setRole] = useState<string | null>(null);
    const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);

    useEffect(() => {
        const storedPermissions = localStorage.getItem("permissions");
        const storedRole = localStorage.getItem("userRole"); // Updated to match AuthLogin keys
        
        if (storedPermissions) {
            try {
                setPermissions(normalizePermissions(JSON.parse(storedPermissions)));
            } catch (e) {
                setPermissions([]);
            }
        }
        setRole(storedRole);
        setUser(getStoredUser());
    }, []);

    const hasPermission = (permission: string) => {
        const normalized = normalizeRole(role);
        if (normalized === "Manager" || normalized === "Dev") return true;
        return permissions.includes(permission);
    };

    return {
        hasPermission,
        role,
        permissions,
        user,
        normalizedRole: normalizeRole(role),
        isReadOnly: isReadOnlyBusinessRole(role),
        canSeeAuditLogs: canAccessAuditLogs(role),
        isAdminLike: isAdminLikeRole(role),
        isKaryawan: isKaryawanRole(role),
        filterEmployeesByScope: <T extends { id: number; departemen_id?: number | null; dept_id?: number | null; employee_id?: number | null; role?: string | null }>(employees: T[]) =>
            filterEmployeesByRoleScope(employees, role, user),
    };
};