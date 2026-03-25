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
    name: "Dashboard",
    items: [
      {
        heading: "",
        children: [
          {
            name: "Dashboard",
            icon: "solar:atom-line-duotone",
            id: uniqueId(),
            url: "/",
          },
          {
            name: "Periode KPI",
            icon: "solar:clock-time",
            id: uniqueId(),
            url: "/periode-kpi",
          },
          {
            name: "Data KPI",
            icon: "solar:data-1-duotone",
            id: uniqueId(),
            url: "/data-kpi",
          },
        ],
      },
    ],
  },
];

export default SidebarContent;
