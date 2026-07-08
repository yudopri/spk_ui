import React from "react";
import type { Metadata } from "next";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Masuk — HRIS PT. Wira Buana Arum",
  description: "Halaman masuk sistem HRIS PT. Wira Buana Arum.",
};

const Login = () => {
  return <LoginPageClient />;
};

export default Login;
