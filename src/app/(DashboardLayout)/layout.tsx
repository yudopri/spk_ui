"use client";
import React, { useContext, useEffect, useState, Suspense } from "react";
import Sidebar from "./layout/vertical/sidebar/Sidebar";
import Header from "./layout/vertical/header/Header";
import { Customizer } from "./layout/shared/customizer/Customizer";
import { CustomizerContext } from "@/app/context/CustomizerContext";
import { useSearchParams } from "next/navigation";
import { Modal, Button } from "flowbite-react";
import { Icon } from "@iconify/react";

// ======================================================================
// 1. Buat Komponen Khusus untuk menangani Alert & URL Parameter
// ======================================================================
function AuthAlertHandler() {
  const searchParams = useSearchParams();
  const [showAuthAlert, setShowAuthAlert] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "unauthorized") {
      setShowAuthAlert(true);
      // Clean up URL without triggering re-render
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  return (
    <Modal show={showAuthAlert} size="md" onClose={() => setShowAuthAlert(false)} popup>
      <Modal.Header />
      <Modal.Body>
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
              <Icon icon="solar:shield-warning-bold-duotone" className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            Akses Ditolak
          </h3>
          <p className="mb-6 text-sm font-normal text-gray-500 dark:text-gray-400">
            Maaf, Anda tidak memiliki izin yang cukup untuk mengakses halaman yang Anda tuju. Silakan hubungi Administrator jika ini adalah kesalahan.
          </p>
          <div className="flex justify-center">
            <Button color="failure" onClick={() => setShowAuthAlert(false)}>
              Tutup Peringatan
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
// ======================================================================

// 2. Komponen Layout Utama
export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { activeLayout, isLayout } = useContext(CustomizerContext);

  return (
    <div className="flex w-full min-h-screen dark:bg-darkgray">
      
      {/* 3. Panggil Alert Handler di sini dan BUNGKUS DENGAN SUSPENSE */}
      <Suspense fallback={null}>
        <AuthAlertHandler />
      </Suspense>

      <div className="page-wrapper flex w-full">
        {/* Header/sidebar */}

        {activeLayout == "vertical" ? <Sidebar /> : null}
        <div className="page-wrapper-sub flex flex-col w-full dark:bg-darkgray">
          {/* Top Header  */}
          {activeLayout == "horizontal" ? (
            <Header layoutType="horizontal" />
          ) : (
            <Header layoutType="vertical" />
          )}

          <div
            className={`bg-lightgray dark:bg-dark h-full ${
              activeLayout != "horizontal" ? "rounded-bb" : "rounded-none"
            } `}
          >
            {/* Body Content  */}
            <div
              className={` ${
                isLayout == "full"
                  ? "w-full py-30 md:px-30 px-5"
                  : "container mx-auto  py-30"
              } ${activeLayout == "horizontal" ? "xl:mt-3" : ""}
              `}
            >
              {children}
            </div>
            <Customizer />
          </div>
        </div>
      </div>
    </div>
  );
}