"use client";
import React, { useContext } from "react";
import { ChildItem } from "../Sidebaritems";
import { Sidebar } from "flowbite-react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { CustomizerContext } from "@/app/context/CustomizerContext";

interface NavItemsProps {
  item: ChildItem;
}
const NavItems: React.FC<NavItemsProps> = ({ item }) => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const {setIsMobileSidebar} = useContext(CustomizerContext);
  const handleMobileSidebar = () => {
       setIsMobileSidebar(false)
  }
  return (
    <>
      <Sidebar.Item
        href={item.url}
        as={Link}
        className={`${
          item.url == pathname
            ? "text-white bg-primary rounded-xl hover:text-white hover:bg-primary dark:hover:text-white shadow-btnshdw active"
            : "text-slate-600 dark:text-white/70 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary rounded-xl transition-all duration-200"
        } mb-0.5`}
      >
        <span onClick={handleMobileSidebar} className="flex gap-3 align-center items-center">
          {item.icon ? (
            <Icon icon={item.icon} className={`${item.color || (item.url == pathname ? 'text-white' : 'text-slate-400 dark:text-white/50')}`} height={18} />
          ) : (
            <span
              className={`${
                item.url == pathname
                  ? "bg-white rounded-full mx-1.5 h-[6px] w-[6px]"
                  : "h-[6px] w-[6px] bg-slate-300 dark:bg-white/30 rounded-full mx-1.5 group-hover/link:bg-primary"
              } `}
            ></span>
          )}
          <span className="max-w-36 overflow-hidden text-[13px] font-medium">
            {t(`${item.name}`)}
          </span>
        </span> 
      </Sidebar.Item>
    </>
  );
};

export default NavItems;
