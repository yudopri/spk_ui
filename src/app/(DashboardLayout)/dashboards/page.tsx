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
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="grid grid-cols-12 gap-6">
        <div className="lg:col-span-12 col-span-12">
          <WelcomeBox />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <div key={index}>
            <CardBox className="hover:shadow-lg transition-all duration-300 h-full border border-ld hover:border-primary/20 group">
              <Link href={stat.href} className="flex items-center gap-4 h-full">
                <div className={`h-12 w-12 rounded-xl bg-lightgray dark:bg-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-200`}>
                  <Icon icon={stat.icon} height={24} />
                </div>
                <div>
                  <p className="text-[13px] text-slate-400 dark:text-slate-500 font-medium">{stat.title}</p>
                  <h3 className="text-[15px] font-bold text-dark dark:text-white">{stat.value}</h3>
                </div>
              </Link>
            </CardBox>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <TrendChart />
        </div>
      </div>

      {/* Workflow & Tips */}
      <div className="grid grid-cols-12 gap-6">
        <div className="lg:col-span-7 col-span-12">
           <CardBox>
              <div className="flex justify-between items-center mb-5">
                 <div>
                   <h4 className="text-lg font-bold text-dark dark:text-white">Alur Kerja Penilaian</h4>
                   <p className="text-sm text-slate-400 mt-1">Ikuti langkah-langkah berikut untuk proses penilaian</p>
                 </div>
              </div>
              <div className="space-y-2.5">
                {steps.map((step, idx) => (
                  <Link
                    key={step.label}
                    href={step.href}
                    className="flex items-start gap-3 rounded-xl border border-ld p-3.5 hover:bg-lightprimary/30 hover:border-primary/20 transition-all duration-200 group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary text-sm font-bold flex items-center justify-center mt-0.5 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                      {idx + 1}
                    </div>
                    <div>
                      <h5 className="font-semibold text-dark dark:text-white text-[15px]">{step.label}</h5>
                      <p className="text-sm text-slate-400 mt-0.5">{step.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
           </CardBox>
        </div>
        <div className="lg:col-span-5 col-span-12">
           <CardBox>
              <h4 className="text-lg font-bold mb-5 text-dark dark:text-white">Tips Penggunaan</h4>
              <div className="flex flex-col gap-3 text-sm">
                <div className="rounded-xl bg-lightprimary/50 p-3.5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon icon="solar:lightbulb-bold" className="text-primary" height={16} />
                    <span className="font-semibold text-primary">Periode Aktif</span>
                  </div>
                  <p className="text-slate-500 text-[13px]">Gunakan satu periode aktif agar perhitungan perbandingan dan penilaian tetap konsisten.</p>
                </div>
                <div className="rounded-xl bg-lightsuccess/50 p-3.5 border border-success/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon icon="solar:check-circle-bold" className="text-success" height={16} />
                    <span className="font-semibold text-success">Finalisasi</span>
                  </div>
                  <p className="text-slate-500 text-[13px]">Pastikan semua nilai penilaian sudah terisi sebelum melakukan finalisasi ranking.</p>
                </div>
                <div className="rounded-xl bg-lightinfo/50 p-3.5 border border-info/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon icon="solar:info-circle-bold" className="text-info" height={16} />
                    <span className="font-semibold text-info">Menu Pengembang</span>
                  </div>
                  <p className="text-slate-500 text-[13px]">Menu Pengembang hanya untuk administrator guna memvalidasi perhitungan penilaian kinerja.</p>
                </div>
              </div>
           </CardBox>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
