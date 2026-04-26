"use client";

import { ReactNode } from "react";
import { Alert } from "flowbite-react";
import { usePermission } from "@/hooks/usePermission";

interface RoleGuardProps {
  children: ReactNode;
  allow: string[];
  fallback?: ReactNode;
}

export default function RoleGuard({ children, allow, fallback }: RoleGuardProps) {
  const { normalizedRole } = usePermission();

  if (!allow.includes(normalizedRole)) {
    return (
      <>
        {fallback || (
          <div className="p-3">
            <Alert color="warning">Anda tidak memiliki akses ke halaman ini.</Alert>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
