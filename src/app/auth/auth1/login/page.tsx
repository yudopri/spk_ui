import React from "react";
import type { Metadata } from "next";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Login - SPK Kinerja Karyawan",
  description: "Halaman autentikasi sistem SPK penilaian kinerja karyawan.",
};

const Login = () => {
  return <LoginPageClient />;
};

export default Login;
