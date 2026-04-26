"use client";

import { Button, Checkbox, Label, TextInput, Alert } from "flowbite-react";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axiosServices from "@/utils/axios";
import { AuthUser, setSession } from "@/utils/authSession";

const parseJwt = (token: string) => {
  try {
    const base64 = token.split(".")[1];
    const payload = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

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
  status: string;
  access_token: string;
  refresh_token: string;
  user: AuthUser;
  permissions: string[];
  message?: string;
}

const AuthLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axiosServices.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      if (response && (response.data.status === "success" || response.data.access_token)) {
        const token = response.data.access_token;
        const refreshToken = response.data.refresh_token;
        const claims = token ? parseJwt(token) : null;
        const rawPermissions = response.data.permissions ?? claims?.permissions ?? claims?.Permission ?? [];
        const permissions = normalizePermissions(rawPermissions);
        const userData = response.data.user;
        const normalizedUser: AuthUser = {
          id: Number(userData?.id || claims?.id || 0),
          employee_id: userData?.employee_id ?? claims?.employee_id ?? null,
          name: userData?.name || claims?.name || "",
          role: userData?.role || claims?.role || claims?.Role || "",
          dept_id: userData?.dept_id ?? claims?.dept_id ?? null,
          lokasi_kerja: userData?.lokasi_kerja ?? claims?.lokasi_kerja ?? null,
        };

        setSession({
          accessToken: token,
          refreshToken,
          user: normalizedUser,
          permissions,
        });

        router.push("/dashboards");
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "An error occurred during login");
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
          {loading ? "Memproses..." : "Masuk"}
        </Button>
      </form>
    </>
  );
};

export default AuthLogin;
