"use client";
import React from "react";
import Link from "next/link";

const FullLogo = () => {
  return (
    <Link href={"/dashboards"} className="inline-flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-lg">
        S
      </div>
      <div className="p-1">
        <h1 className="text-lg font-semibold text-primary dark:text-white leading-none">
          SPK Kinerja
        </h1>
        <p className="text-xs text-slate-500 mt-1">Penilaian Karyawan AHP-MOORA</p>
      </div>
    </Link>
  );
};

export default FullLogo;
