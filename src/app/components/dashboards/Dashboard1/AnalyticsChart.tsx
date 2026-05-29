"use client";
import React from "react";
import CardBox from "../../shared/CardBox";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const AnalyticsChart = () => {
  const chartOptions: any = {
    chart: {
      type: "bar",
      height: 350,
      fontFamily: "inherit",
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "40%",
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        text: "Nilai Rata-rata",
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: (val: number) => val + " poin",
      },
    },
    grid: {
      borderColor: "rgba(0,0,0,0.1)",
      strokeDashArray: 4,
      padding: {
        left: 0,
        right: 0,
      },
    },
    colors: ["var(--color-primary)", "var(--color-secondary)"],
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
    },
  };

  const chartSeries = [
    {
      name: "Tahun Ini",
      data: [76, 85, 101, 98, 87, 105],
    },
    {
      name: "Tahun Lalu",
      data: [44, 55, 57, 56, 61, 58],
    },
  ];

  return (
    <CardBox>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-lg font-bold">Analitik Performa Karyawan</h4>
          <p className="text-sm text-gray-500">Perbandingan rata-rata nilai antar periode</p>
        </div>
      </div>
      <div className="h-[350px]">
        <Chart options={chartOptions} series={chartSeries} type="bar" height={350} />
      </div>
    </CardBox>
  );
};

export default AnalyticsChart;