// Search & Profile helper data (vertical header)

interface SearchType {
  href: string;
  title: string;
}

const SearchLinks: SearchType[] = [
  {
    title: "Dashboard",
    href: "/dashboards",
  },
  {
    title: "Periode KPI",
    href: "/apps/periode-kpi",
  },
  {
    title: "Grup KPI (Level 1)",
    href: "/apps/data-kpi/group",
  },
  {
    title: "Data KPI (Level 2)",
    href: "/apps/data-kpi",
  },
  {
    title: "Perbandingan KPI",
    href: "/apps/perbandingan",
  },
  {
    title: "Input Penilaian",
    href: "/apps/penilaian",
  },
  {
    title: "Ranking Karyawan",
    href: "/apps/report",
  },
  {
    title: "Data Karyawan",
    href: "/apps/karyawan",
  },
];

//  Profile Data
interface ProfileType {
  title: string;
  url: string;
}

const profileDD: ProfileType[] = [
  {
    title: "Dashboard",
    url: "/dashboards",
  },
  {
    title: "Data Karyawan",
    url: "/apps/karyawan",
  },
  {
    title: "Ranking Karyawan",
    url: "/apps/report",
  },
];

export { SearchLinks, profileDD };
