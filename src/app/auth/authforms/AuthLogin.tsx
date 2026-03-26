"use client";

import { Button, Checkbox, Label, TextInput, Alert } from "flowbite-react";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axiosServices from "@/utils/axios";

const AuthLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axiosServices.post("/Auth/login", {
        username,
        password,
      });

      if (response.data.success) {
        const { token, refreshToken, role, username, permissions } = response.data.data;
        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("userRole", role);
        localStorage.setItem("userName", username);
        localStorage.setItem("permissions", JSON.stringify(permissions));

        // Set cookie so middleware knows user is authenticated
        document.cookie = `token=${token}; path=/; max-age=${3600 * 24}; SameSite=Lax`;

        router.push("/dashboards");
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred during login");
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
            <Label htmlFor="username" value="Username" />
          </div>
          <TextInput
            id="username"
            type="text"
            sizing="md"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            <Label
              htmlFor="accept"
              className="opacity-90 font-normal cursor-pointer"
            >
              Remember this Device
            </Label>
          </div>
          <Link
            href={"/auth/auth1/forgot-password"}
            className="text-primary text-sm font-medium"
          >
            Forgot Password ?
          </Link>
        </div>
        <Button
          color={"primary"}
          type="submit"
          className="rounded-md w-full"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </>
  );
};

export default AuthLogin;
