"use client";
import { useEffect, useState } from "react";

export const usePermission = () => {
    const [permissions, setPermissions] = useState<string[]>([]);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const storedPermissions = localStorage.getItem("permissions");
        const storedRole = localStorage.getItem("role");
        
        if (storedPermissions) {
            try {
                setPermissions(JSON.parse(storedPermissions));
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