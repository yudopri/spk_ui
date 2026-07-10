"use client";
import React from "react";
import CardBox from "../../shared/CardBox";
import { Icon } from "@iconify/react";


const WelcomeBox = () => {
  return (
    <>
      <CardBox className="bg-gradient-to-br from-primary to-primary/80 dark:from-primary dark:to-primary/80 border-0 overflow-hidden relative">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative grid grid-cols-12 gap-6 items-center p-1">
          <div className="md:col-span-8 col-span-12">
            <div className="flex gap-4 items-center mb-5">
              <div className="h-12 w-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
                <Icon icon="solar:chart-square-outline" className="text-white" height={24} />
              </div>
              <div>
                <h5 className="text-xl font-bold text-white">Dashboard HRIS</h5>
                <p className="text-white/70 text-xs">PT. Wira Buana Arum</p>
              </div>
            </div>

            <p className="text-white/85 text-sm leading-relaxed max-w-xl">
              Pantau proses penilaian kinerja dari data master, input penilaian, hingga
              laporan ranking. Gunakan menu di samping untuk melanjutkan alur kerja periode aktif.
            </p>
          </div>
          <div className="md:col-span-4 col-span-12 hidden md:flex justify-end">
            <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Icon icon="solar:users-group-rounded-bold" className="text-white/80" height={40} />
            </div>
          </div>
        </div>
      </CardBox>
    </>
  );
};

export default WelcomeBox;
