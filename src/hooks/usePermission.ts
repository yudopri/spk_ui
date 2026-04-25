"use client";
import { useEffect, useState } from "react";

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
    }, []);

    const hasPermission = (permission: string) => {
        if (role === "Admin" || role === "Developer") return true;
        return permissions.includes(permission);
    };

    return { hasPermission, role, permissions };
};