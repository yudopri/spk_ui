"use client";

import Link from "next/link";
import { Button } from "flowbite-react";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
        <h1 className="text-5xl font-bold text-red-500 mb-3">403</h1>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Akses Ditolak</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Anda tidak memiliki izin untuk membuka halaman ini.
        </p>
        <div className="flex justify-center gap-3">
          <Button as={Link} href="/dashboards" color="primary">
            Kembali ke Dashboard
          </Button>
          <Button as={Link} href="/auth/auth1/login" color="gray">
            Login Ulang
          </Button>
        </div>
      </div>
    </div>
  );
}
