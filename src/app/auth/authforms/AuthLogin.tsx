"use client";

import { Button, Checkbox, Label, TextInput, Alert, Spinner } from "flowbite-react";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axiosServices from "@/utils/axios";
import { AuthUser, setSession } from "@/utils/authSession";

const normalizePermissions = (raw: any): string[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") return item.name || item.permission || item.code || "";
      return "";
    })
    .filter(Boolean);
};

interface LoginResponse {
  status?: string;
  user?: AuthUser;
  permissions?: string[];
  Permission?: string[];
  message?: string;
  success?: boolean;
  data?: any;
}

const AuthLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await axiosServices.post<LoginResponse>(
        "/auth/login",
        {
          email,
          password,
        },
        // Jangan picu auto-refresh/redirect saat login gagal (401 = email/password salah)
        { _skipAuthRefresh: true } as any
      );

      const payload: any = response?.data || {};
      const body = payload?.data && typeof payload.data === "object" ? payload.data : payload;

      // Token sudah di HttpOnly cookie — tidak perlu di-response body lagi
      const isSuccess = Boolean(
        payload?.success === true || payload?.status === "success" || body?.status === "success"
      );

      if (isSuccess) {
        // Ambil permissions dari response (bukan dari JWT payload)
        const rawPermissions =
          body?.permissions ??
          body?.Permission ??
          payload?.permissions ??
          payload?.Permission ??
          [];
        const permissions = normalizePermissions(rawPermissions);

        const userData = body?.user || payload?.user || {};
        const normalizedUser: AuthUser = {
          id: Number(userData?.id || 0),
          employee_id: userData?.employee_id ?? null,
          name: userData?.name || "",
          role: userData?.role || "",
          dept_id: userData?.dept_id ?? null,
          lokasi_kerja: userData?.lokasi_kerja ?? null,
        };

        // Simpan data user & permissions di localStorage (untuk UI)
        // Token TIDAK disimpan — sudah di HttpOnly cookie
        setSession({
          user: normalizedUser,
          permissions,
        });

        router.replace("/dashboards");
        router.refresh();
      } else {
        setError(payload?.message || body?.message || "Gagal masuk. Periksa email dan password Anda.");
      }
    } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Terjadi kesalahan saat mencoba masuk.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form className="mt-6" onSubmit={handleSubmit}>
        {error && (
          <Alert color="failure" className="mb-4">
            {error}
          </Alert>
        )}
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="email" value="Email" />
          </div>
          <TextInput
            id="email"
            type="email"
            sizing="md"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="userpwd" value="Password" />
          </div>
          <TextInput
            id="userpwd"
            type="password"
            sizing="md"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-between my-5">
          <div className="flex items-center gap-2">
            <Checkbox id="accept" title="accept" className="checkbox" />
            <Label htmlFor="accept" className="opacity-90 font-normal cursor-pointer">
              Ingat perangkat ini
            </Label>
          </div>
          <Link href={"/auth/auth1/forgot-password"} className="text-primary text-sm font-medium">
            Lupa password?
          </Link>
        </div>
        <Button
          color={"primary"}
          type="submit"
          className="rounded-md w-full"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" />
              Memproses...
            </span>
          ) : (
            "Masuk"
          )}
        </Button>
      </form>
    </>
  );
};

export default AuthLogin;
