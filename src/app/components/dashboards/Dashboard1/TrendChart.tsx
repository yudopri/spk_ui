"use client";
import React, { useEffect, useState } from "react";
import CardBox from "../../shared/CardBox";
import dynamic from "next/dynamic";
import spkService from "@/services/spkService";
import periodeService from "@/services/periodeService";
import { Spinner, Select, Button } from "flowbite-react";
import { Icon } from "@iconify/react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface PeriodeOption {
  id: number;
  NamaPeriode: string;
  Tahun: number;
}

interface TrendDataPoint {
  periodeName: string;
  avgScore: number;
  topScore: number;
  count: number;
}

const TrendChart = () => {
  const [loading, setLoading] = useState(true);
  const [periodeList, setPeriodeList] = useState<PeriodeOption[]>([]);
  const [selectedPeriodeIds, setSelectedPeriodeIds] = useState<number[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [topEmployeeName, setTopEmployeeName] = useState<string>("");

  useEffect(() => {
    const fetchPeriodeList = async () => {
      try {
        const res = await periodeService.getAll(1, 50);
        const mapped: PeriodeOption[] = (res.data || []).map((p) => ({
          id: p.Id ?? p.id,
          NamaPeriode: p.NamaPeriode ?? p.namaPeriode,
          Tahun: p.Tahun ?? p.tahun,
        })).sort((a, b) => a.Tahun - b.Tahun || a.id - b.id);
        setPeriodeList(mapped);
        // default select last 5 periods
        setSelectedPeriodeIds(mapped.slice(-5).map((p) => p.id));
      } catch (err) {
        console.error("Failed to fetch periode list", err);
      }
    };
    fetchPeriodeList();
  }, []);

  useEffect(() => {
    const fetchTrendData = async () => {
      if (selectedPeriodeIds.length === 0) {
        setTrendData([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const results: TrendDataPoint[] = [];
        let currentTopName = "";
        let currentTopScore = -1;

        for (const pid of selectedPeriodeIds) {
          const resR = await spkService.getReport(pid, 1, 100);
          const items = resR.data || [];
          const scores = items.map((it) => it.nilai_akhir ?? it.NilaiSkala ?? 0);
          const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
          const max = scores.length ? Math.max(...scores) : 0;
          const topItem = items.find((it) => (it.nilai_akhir ?? it.NilaiSkala ?? 0) === max);
          const namaPeriode =
            items[0]?.Periode?.NamaPeriode ||
            `Periode ${pid}`;

          results.push({
            periodeName: namaPeriode,
            avgScore: Number(avg.toFixed(2)),
            topScore: Number(max.toFixed(2)),
            count: items.length,
          });

          if (max > currentTopScore) {
            currentTopScore = max;
            currentTopName =
              topItem?.nama ||
              topItem?.Karyawan?.Nama ||
              "-";
          }
        }

        setTrendData(results);
        setTopEmployeeName(currentTopName);
      } catch (err) {
        console.error("Failed to fetch trend data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendData();
  }, [selectedPeriodeIds]);

  const handleTogglePeriode = (id: number) => {
    setSelectedPeriodeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedPeriodeIds(periodeList.map((p) => p.id));
  };

  const handleClearAll = () => {
    setSelectedPeriodeIds([]);
  };

  const chartOptions: any = {
    chart: {
      type: "area",
      height: 360,
      fontFamily: "inherit",
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    xaxis: {
      categories: trendData.map((d) => d.periodeName.replace(/\s*\(\d+\)\s*$/, "")),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        rotate: -30,
        style: { fontSize: "11px" },
      },
    },
    yaxis: {
      title: { text: "Nilai Skala" },
      min: (min: number) => Math.max(0, Math.floor(min - 1)),
    },
    fill: {
      opacity: 0.15,
      type: "solid",
    },
    tooltip: {
      y: {
        formatter: (val: number) => val.toFixed(2) + " poin",
      },
    },
    grid: {
      borderColor: "rgba(0,0,0,0.05)",
      strokeDashArray: 4,
    },
    colors: ["#5D87FF", "#49BEFF", "#FFAE1F"],
    legend: {
      show: true,
      position: "top",
    },
  };

  const chartSeries = [
    {
      name: "Rata-rata Nilai",
      data: trendData.map((d) => d.avgScore),
    },
    {
      name: "Nilai Tertinggi",
      data: trendData.map((d) => d.topScore),
    },
  ];

  return (
    <CardBox>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h4 className="text-lg font-bold">Tren Performa Karyawan</h4>
          <p className="text-sm text-gray-500">
            {loading
              ? "Memuat data..."
              : topEmployeeName
              ? `Peringkat teratas: ${topEmployeeName}`
              : "Pilih minimal 1 periode untuk menampilkan tren"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" color="light" onClick={handleSelectAll}>
            Pilih Semua
          </Button>
          <Button size="sm" color="light" onClick={handleClearAll}>
            Hapus
          </Button>
        </div>
      </div>

      {/* Period filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {periodeList.map((p) => {
            const active = selectedPeriodeIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => handleTogglePeriode(p.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-700 border-gray-300 hover:border-primary hover:text-primary"
                }`}
              >
                {p.NamaPeriode} {p.Tahun ? `(${p.Tahun})` : ""}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-[360px] flex items-center justify-center">
        {loading ? (
          <Spinner size="xl" />
        ) : selectedPeriodeIds.length === 0 ? (
          <div className="text-gray-400 italic text-sm">Pilih minimal 1 periode untuk menampilkan tren</div>
        ) : trendData.length === 0 ? (
          <div className="text-gray-400 italic text-sm">Belum ada data penilaian tersedia</div>
        ) : (
          <div className="w-full">
            <Chart options={chartOptions} series={chartSeries} type="area" height={360} />
          </div>
        )}
      </div>
    </CardBox>
  );
};

export default TrendChart;