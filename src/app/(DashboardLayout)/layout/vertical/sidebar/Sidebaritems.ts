export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: any;
  children?: ChildItem[];
  item?: any;
  url?: any;
  color?: string;
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: any;
  id?: number;
  to?: string;
  items?: MenuItem[];
  children?: ChildItem[];
  url?: any;
}

import { uniqueId } from "lodash";

const SidebarContent: MenuItem[] = [
  {
    id: 1,
    name: "Main",
    items: [
      {
        heading: "Dashboard",
        children: [
          {
            name: "Dashboard",
            icon: "solar:atom-line-duotone",
            id: uniqueId(),
            url: "/dashboards",
          },
        ],
      },
      {
        heading: "Master Data",
        children: [
          {
            name: "Data Divisi",
            icon: "solar:buildings-2-linear",
            id: uniqueId(),
            url: "/apps/divisi",
          },
          {
            name: "Data Karyawan",
            icon: "solar:users-group-rounded-linear",
            id: uniqueId(),
            url: "/apps/karyawan",
          },
          {
            name: "Periode KPI",
            icon: "solar:calendar-line-duotone",
            id: uniqueId(),
            url: "/apps/periode-kpi",
          },
          {
            name: "Data KPI (Kriteria)",
            icon: "solar:document-list-linear",
            id: uniqueId(),
            url: "/apps/data-kpi",
          },
        ],
      },
      {
        heading: "Proses SPK",
        children: [
          {
            name: "Nilai Perbandingan",
            icon: "solar:transfer-horizontal-linear",
            id: uniqueId(),
            url: "/apps/perbandingan",
          },
          {
            name: "Penilaian Karyawan",
            icon: "solar:star-line-duotone",
            id: uniqueId(),
            url: "/apps/penilaian",
          },
        ],
      },
      {
        heading: "Laporan",
        children: [
          {
            name: "Report Hasil",
            icon: "solar:printer-minimalistic-linear",
            id: uniqueId(),
            url: "/apps/report",
          },
        ],
      },
    ],
  },
];

export default SidebarContent;
