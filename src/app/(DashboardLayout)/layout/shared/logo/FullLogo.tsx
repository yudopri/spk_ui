"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";

const FullLogo = () => {
  return (
    <Link href={"/dashboards"}>

      {/* <Image 
        src="/images/logos/logo.svg" 
        alt="logo" 
        className="block" 
        width={150} 
        height={40} 
      /> */}
      <div className="p-2">
        <h1 className="text-xl font-semibold text-primary dark:text-white">
          SISFO HRis
        </h1>
        <p className="text-xs text-slate-400 mt-1">Sistem Informasi Human Resources</p>
      </div>
    </Link>
  );
};

export default FullLogo;
