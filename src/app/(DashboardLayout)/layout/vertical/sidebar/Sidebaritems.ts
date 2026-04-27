export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: any;
  children?: ChildItem[];
  item?: any;
  url?: any;
  color?: string;
  permission?: string;
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
  permission?: string;
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
            permission: "divisi_view",
          },
          {
            name: "Data Karyawan",
            icon: "solar:users-group-rounded-linear",
            id: uniqueId(),
            url: "/apps/karyawan",
            permission: "employee_view",
          },
          {
            name: "Periode KPI",
            icon: "solar:calendar-line-duotone",
            id: uniqueId(),
            url: "/apps/periode-kpi",
            permission: "periode_view",
          },
          {
            name: "Data KPI (Kriteria)",
            icon: "solar:documents-line-duotone",
            id: uniqueId(),
            url: "/apps/data-kpi",
            permission: "kpi_view",
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
            permission: "kpi_manage",
          },
          {
            name: "Penilaian Karyawan",
            icon: "solar:star-line-duotone",
            id: uniqueId(),
            url: "/apps/penilaian",
            permission: "score_input",
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
            permission: "report_view",
          },
        ],
      },
      {
        heading: "System",
        children: [
          {
            name: "User Management",
            icon: "solar:user-id-linear",
            id: uniqueId(),
            url: "/apps/user",
            permission: "user_manage",
          },
          {
            name: "Role Management",
            icon: "solar:users-group-two-rounded-linear",
            id: uniqueId(),
            url: "/apps/role",
            permission: "user_manage",
          },
          {
            name: "Permission",
            icon: "solar:shield-keyhole-linear",
            id: uniqueId(),
            url: "/apps/permission",
            permission: "user_manage",
          },
          {
            name: "Developer Tools",
            icon: "solar:code-bold-linear",
            id: uniqueId(),
            url: "/apps/developer",
            permission: "audit_view",
          },
        ],
      },
    ],
  },
];

export default SidebarContent;
