"use client";
import React from "react";
import CardBox from "../../shared/CardBox";
import { Icon } from "@iconify/react";


const WelcomeBox = () => {
  return (
    <>
      <CardBox className="bg-primary dark:bg-primary">
        <div className="grid grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 col-span-12">
            <div className="flex gap-4 items-center mb-4">
              <div className="h-12 w-12 rounded-tw bg-white/95 flex items-center justify-center flex-shrink-0">
                <Icon icon="solar:chart-square-outline" className="text-primary" height={24} />
              </div>
              <h5 className="text-xl text-white">Dashboard HRIS — PT. Wira Buana Arum</h5>
            </div>

            <p className="text-white/90 text-sm leading-6">
              Pantau proses penilaian kinerja dari data master, input penilaian, hingga
              laporan ranking. Gunakan menu di samping untuk melanjutkan alur kerja periode aktif.
            </p>
          </div>
        </div>
      </CardBox>
    </>
  );
};

export default WelcomeBox;
