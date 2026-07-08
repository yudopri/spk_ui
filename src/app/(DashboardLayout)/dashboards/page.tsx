"use client";
import React from "react";
import WelcomeBox from "@/app/components/dashboards/Dashboard1/WelcomeBox";
import TrendChart from "@/app/components/dashboards/Dashboard1/TrendChart";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import Link from "next/link";

const DashboardPage = () => {
  const stats = [
    { title: "Data Karyawan", value: "Kelola data karyawan", icon: "solar:users-group-rounded-bold-duotone", color: "text-primary", href: "/apps/karyawan" },
    { title: "Periode KPI", value: "Atur periode penilaian", icon: "solar:calendar-bold-duotone", color: "text-secondary", href: "/apps/periode-kpi" },
    { title: "Data KPI", value: "Kelola kriteria penilaian", icon: "solar:documents-line-duotone", color: "text-warning", href: "/apps/data-kpi" },
    { title: "Laporan Ranking", value: "Lihat hasil ranking", icon: "solar:chart-square-bold-duotone", color: "text-success", href: "/apps/report" },
  ];

  const steps = [
    { label: "Siapkan Periode Penilaian", desc: "Buat periode baru dan tetapkan sebagai periode aktif.", href: "/apps/periode-kpi" },
    { label: "Atur Attribute / Satuan", desc: "Definisikan satuan pengukuran untuk tiap kriteria KPI.", href: "/apps/attribute" },
    { label: "Lengkapi Kriteria KPI", desc: "Masukkan daftar kriteria beserta target dan bobotnya.", href: "/apps/data-kpi" },
    { label: "Input Perbandingan", desc: "Masukkan perbandingan prioritas antar kriteria penilaian.", href: "/apps/perbandingan" },
    { label: "Input Penilaian Karyawan", desc: "Isi nilai penilaian untuk tiap karyawan berdasarkan kriteria yang berlaku.", href: "/apps/penilaian" },
    { label: "Lihat Hasil & Ranking", desc: "Tinjau hasil perhitungan dan ranking karyawan terbaik.", href: "/apps/report" },
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
            <CardBox className="hover:shadow-lg transition-shadow duration-200 h-full">
              <Link href={stat.href} className="flex items-center gap-4 h-full">
                <div className={`h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${stat.color}`}>
                  <Icon icon={stat.icon} height={28} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                  <h3 className="text-base font-bold text-dark dark:text-white">{stat.value}</h3>
                </div>
              </Link>
            </CardBox>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-30">
        <div className="col-span-12">
          <TrendChart />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-30">
        <div className="lg:col-span-7 col-span-12">
           <CardBox>
              <div className="flex justify-between items-center mb-4">
                 <h4 className="text-lg font-bold">Alur Kerja Penilaian</h4>
              </div>
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <Link
                    key={step.label}
                    href={step.href}
                    className="flex items-start gap-3 rounded-lg border border-ld p-4 hover:bg-lightprimary/50 transition-colors"
                  >
                    <div className="h-7 w-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <h5 className="font-semibold text-dark dark:text-white">{step.label}</h5>
                      <p className="text-sm text-bodytext mt-1">{step.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
           </CardBox>
        </div>
        <div className="lg:col-span-5 col-span-12">
           <CardBox>
              <h4 className="text-lg font-bold mb-4">Tips Penggunaan</h4>
              <div className="flex flex-col gap-4 text-sm text-bodytext">
                <div className="rounded-lg bg-lightprimary p-3 text-primary">
                  Gunakan satu periode aktif agar perhitungan perbandingan dan penilaian tetap konsisten.
                </div>
                <div className="rounded-lg bg-lightsuccess p-3 text-success">
                  Pastikan semua nilai penilaian sudah terisi sebelum melakukan finalisasi ranking.
                </div>
                <div className="rounded-lg bg-lightinfo p-3 text-info">
                  Menu Pengembang hanya untuk administrator guna memvalidasi perhitungan penilaian kinerja.
                </div>
              </div>
           </CardBox>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
