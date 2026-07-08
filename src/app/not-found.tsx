import Image from "next/image";
import React from "react";
import ErrorImg from "@/../public/images/backgrounds/errorimg.svg";
import { Button } from "flowbite-react";
import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Halaman Tidak Ditemukan - HRIS",
  description: "Halaman yang Anda cari tidak tersedia.",
};
const Error = () => {
  return (
    <>
      <div className="h-screen flex items-center justify-center bg-white dark:bg-darkgray">
        <div className="text-center max-w-lg mx-auto">
          <Image src={ErrorImg} alt="error" className="mb-4" />
          <h1 className="text-dark dark:text-white text-4xl mb-6">404</h1>
          <h6 className="text-xl text-dark dark:text-white">
            Halaman yang Anda cari tidak ditemukan atau sudah dipindahkan.
          </h6>
          <Button
            color={"primary"}
            as={Link}
            href="/dashboards"
            className="w-fit mt-6 mx-auto"
          >
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    </>
  );
};

export default Error;
