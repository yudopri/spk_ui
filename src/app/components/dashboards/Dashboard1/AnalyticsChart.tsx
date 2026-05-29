"use client";
import React, { useEffect, useState } from "react";
import CardBox from "../../shared/CardBox";
import dynamic from "next/dynamic";
import spkService from "@/services/spkService";
import periodeService from "@/services/periodeService";
import { Spinner } from "flowbite-react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const AnalyticsChart = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{name: string, score: number}[]>([]);
  const [periodeName, setPeriodeName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get latest period
        const resP = await periodeService.getAll(1, 5);
        if (resP.data && resP.data.length > 0) {
          const latestP = resP.data[0];
          setPeriodeName(latestP.namaPeriode || latestP.NamaPeriode);
          
          const resR = await spkService.getReport(latestP.id || latestP.Id, 1, 8);
          if (resR.data) {
             const mapped = resR.data.map((item: any) => ({
                name: item.Karyawan?.Nama || item.Karyawan?.name || "Unknown",
                score: item.NilaiSkala || 0
             }));
             setData(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to fetch analytics data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartOptions: any = {
    chart: {
      type: "bar",
      height: 350,
      fontFamily: "inherit",
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
            enabled: true,
            delay: 150
        },
        dynamicAnimation: {
            enabled: true,
            speed: 350
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "40%",
        borderRadius: 4,
        distributed: true,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val.toFixed(2),
      style: {
        fontSize: '10px',
      }
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: data.map(d => d.name),
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        rotate: -45,
        style: {
          fontSize: '10px'
        }
      }
    },
    yaxis: {
      title: {
        text: "Nilai Skala",
      },
    },
    fill: {
      opacity: 1,
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: "vertical",
        shadeIntensity: 0.25,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 0.85,
        opacityTo: 0.85,
        stops: [50, 0, 100]
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => val.toFixed(4) + " poin",
      },
    },
    grid: {
      borderColor: "rgba(0,0,0,0.1)",
      strokeDashArray: 4,
    },
    colors: ["#5D87FF", "#49BEFF", "#FFAE1F", "#FA896B", "#39B69A", "#539BFF", "#13DEB9", "#763EBD"],
    legend: {
      show: false,
    },
  };

  const chartSeries = [
    {
      name: "Skor",
      data: data.map(d => d.score),
    }
  ];

  return (
    <CardBox>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-lg font-bold">Analitik Performa Karyawan</h4>
          <p className="text-sm text-gray-500">
            {loading ? "Memuat data..." : `Peringkat teratas pada periode ${periodeName}`}
          </p>
        </div>
      </div>
      <div className="h-[350px] flex items-center justify-center">
        {loading ? (
          <Spinner size="xl" />
        ) : data.length > 0 ? (
          <div className="w-full">
            <Chart options={chartOptions} series={chartSeries} type="bar" height={350} />
          </div>
        ) : (
          <div className="text-gray-400 italic text-sm">Belum ada data penilaian tersedia</div>
        )}
      </div>
    </CardBox>
  );
};

export default AnalyticsChart;