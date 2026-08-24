"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/utils/authSession";

/**
 * Halaman logout yang bisa diakses langsung via URL (mis. untuk automation test / Katalon).
 * Saat dibuka, halaman ini akan memanggil API logout (membersihkan cookie HttpOnly)
 * lalu mengarahkan user ke halaman login.
 */
const LogoutPage = () => {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    const doLogout = async () => {
      try {
        // Panggil API logout untuk membersihkan cookie HttpOnly di server
        await fetch("/api/proxy/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        // Tetap lanjut meskipun API gagal
      } finally {
        // Bersihkan session lokal (localStorage) lalu redirect ke login
        clearSession();
        if (!cancelled) {
          setStatus("done");
          router.replace("/auth/auth1/login");
        }
      }
    };

    doLogout();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-medium">
          {status === "error" ? "Gagal logout" : "Sedang keluar..."}
        </p>
        <p className="mt-1 text-sm opacity-70">Anda akan diarahkan ke halaman masuk.</p>
      </div>
    </div>
  );
};

export default LogoutPage;