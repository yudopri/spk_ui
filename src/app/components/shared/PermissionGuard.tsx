"use client";

import { ReactNode } from "react";
import { Alert } from "flowbite-react";
import { usePermission } from "@/hooks/usePermission";

interface PermissionGuardProps {
  children: ReactNode;
  permission: string;
  fallback?: ReactNode;
}

export default function PermissionGuard({ children, permission, fallback }: PermissionGuardProps) {
  const { hasPermission } = usePermission();

  if (!hasPermission(permission)) {
    return (
      <>
        {fallback || (
          <div className="p-10 text-center">
            <Alert color="failure" className="mx-auto max-w-md">
                <span className="font-bold">Akses Ditolak!</span> Anda tidak memiliki izin untuk mengakses modul ini ({permission}).
            </Alert>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
