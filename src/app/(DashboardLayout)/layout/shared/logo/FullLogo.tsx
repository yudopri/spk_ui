"use client";
import React from "react";
import Link from "next/link";

const FullLogo = () => {
  return (
    <Link href={"/dashboards"} className="inline-flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-lg">
        W
      </div>
      <div className="p-1">
        <h1 className="text-lg font-semibold text-primary dark:text-white leading-none">
          HRIS
        </h1>
        <p className="text-xs text-slate-500 mt-1">PT. Wira Buana Arum</p>
      </div>
    </Link>
  );
};

export default FullLogo;
