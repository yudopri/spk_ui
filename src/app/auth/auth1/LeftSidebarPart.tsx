"use client";
import Image from "next/image";
import React from "react";
import Bgimg from "@/../public/images/logos/logo-icon.svg";

const LeftSidebarPart = () => {
  return (
    <>
      <div className="circle-top"></div>
      <div>
        <Image src={Bgimg} alt="materilm" className="circle-bottom" />
      </div>
      <div className="flex xl:justify-start justify-center xl:ps-56 h-screen items-center z-10 relative px-10">
        <div className="max-w-md">
          <h2 className="text-white text-[38px] font-bold leading-[1.2]">
            SPK Penilaian
            <br></br>
            Kinerja Karyawan
          </h2>
          <p className="opacity-80 text-white my-4 text-base font-medium">
            Kelola data karyawan, periode KPI, penilaian, dan ranking berbasis AHP-MOORA
            dalam satu dashboard yang terintegrasi.
          </p>
          <div className="mt-8 border border-white/30 rounded-xl p-4 bg-white/10 backdrop-blur-sm">
            <p className="text-white text-sm leading-6">
              Fokus sistem: objektif, terukur, dan transparan untuk mendukung keputusan SDM.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeftSidebarPart;
