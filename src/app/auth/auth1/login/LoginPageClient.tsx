"use client";

import React from "react";
import Logo from "@/app/(DashboardLayout)/layout/shared/logo/Logo";
import AuthLogin from "../../authforms/AuthLogin";
import LeftSidebarPart from "../LeftSidebarPart";

const LoginPageClient = () => {
  return (
    <>
      <div className="relative overflow-hidden h-screen">
        <div className="grid grid-cols-12 gap-0 h-screen bg-white dark:bg-darkgray">
          <div className="xl:col-span-5 lg:col-span-6 col-span-12 sm:px-10 px-4">
            <div className="flex h-screen items-center px-2 lg:justify-start justify-center">
              <div className="max-w-md w-full mx-auto bg-white/85 dark:bg-dark/80 rounded-2xl border border-ld p-8 backdrop-blur-sm shadow-md">
                <Logo />
                <h3 className="text-2xl font-bold my-3 mt-5">Masuk ke HRIS</h3>
                <p className="text-sm font-medium text-bodytext">
                  Human Resource Information System — PT. Wira Buana Arum
                </p>
                <AuthLogin />
                <div className="mt-6 text-center text-xs text-bodytext">
                  Hubungi administrator jika mengalami kendala login
                </div>
              </div>
            </div>
          </div>
          <div className="xl:col-span-7 lg:col-span-6 col-span-12 bg-[#163149] dark:bg-dark lg:block hidden relative overflow-hidden">
            <LeftSidebarPart />
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPageClient;
