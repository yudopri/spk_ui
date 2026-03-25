"use client";
import React from "react";
import WelcomeBox from "@/app/components/dashboards/Dashboard1/WelcomeBox";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";

const DashboardPage = () => {
  const stats = [
    { title: "Total Karyawan", value: "150", icon: "solar:users-group-rounded-bold-duotone", color: "text-primary" },
    { title: "Periode Aktif", value: "Semester 1 2024", icon: "solar:calendar-bold-duotone", color: "text-secondary" },
    { title: "Kriteria KPI", value: "5", icon: "solar:document-list-bold-duotone", color: "text-warning" },
    { title: "Penilaian Selesai", value: "85%", icon: "solar:chart-square-bold-duotone", color: "text-success" },
  ];

  return (
    <div className="flex flex-col gap-30">
      <div className="grid grid-cols-12 gap-30">
        <div className="lg:col-span-12 col-span-12">
          <WelcomeBox />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-30">
        {stats.map((stat, index) => (
          <div key={index} className="lg:col-span-3 md:col-span-6 col-span-12">
            <CardBox>
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${stat.color}`}>
                  <Icon icon={stat.icon} height={28} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                  <h3 className="text-xl font-bold">{stat.value}</h3>
                </div>
              </div>
            </CardBox>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-30">
        <div className="lg:col-span-8 col-span-12">
           <CardBox>
              <div className="flex justify-between items-center mb-4">
                 <h4 className="text-lg font-bold">Statistik Penilaian Per Departemen</h4>
              </div>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                 <p className="text-gray-400">Chart Grafik Akan Muncul Di Sini</p>
              </div>
           </CardBox>
        </div>
        <div className="lg:col-span-4 col-span-12">
           <CardBox>
              <h4 className="text-lg font-bold mb-4">Aktivitas Terakhir</h4>
              <div className="flex flex-col gap-4">
                 {[1,2,3].map(i => (
                   <div key={i} className="flex gap-3 items-start border-b border-gray-100 dark:border-gray-700 pb-3">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                      <div>
                         <p className="text-sm font-medium">Penilaian Karyawan #100{i} Selesai</p>
                         <p className="text-xs text-gray-400">2 jam yang lalu</p>
                      </div>
                   </div>
                 ))}
              </div>
           </CardBox>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
