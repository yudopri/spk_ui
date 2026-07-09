"use client";
import React, { useContext, useEffect } from "react";
import { Drawer, Sidebar } from "flowbite-react";
import { IconSidebar } from "./IconSidebar";
import SidebarContent from "./Sidebaritems";
import NavItems from "./NavItems";
import NavCollapse from "./NavCollapse";
import { CustomizerContext } from "@/app/context/CustomizerContext";
import SimpleBar from "simplebar-react";
import FullLogo from "@/app/(DashboardLayout)/layout/shared/logo/FullLogo";
import { usePathname } from "next/navigation";
import { canSeeMenuItem } from "@/utils/accessControl";

const normalizePermissions = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: any) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") return item.name || item.permission || item.code || "";
      return "";
    })
    .filter((item: string) => Boolean(item));
};

const SidebarLayout = () => {
  const { selectedIconId, setSelectedIconId } =
    useContext(CustomizerContext) || {};
  
  // Get permissions from localStorage
  const [userPermissions, setUserPermissions] = React.useState<string[]>([]);
  const [userRole, setUserRole] = React.useState<string | null>(null);

  useEffect(() => {
    const perms = localStorage.getItem("permissions");
    const role = localStorage.getItem("userRole"); 
    
    console.log("Sidebar Debug:", { role, perms }); // Cek apakah role dan perms terbaca

    if (perms) {
      try {
        setUserPermissions(normalizePermissions(JSON.parse(perms)));
      } catch (e) {
        setUserPermissions([]);
      }
    }
    setUserRole(role);
  }, []);

  const hasAccess = (perm?: string, path?: string) =>
    canSeeMenuItem(userRole, userPermissions, perm, path);

  const selectedContent = SidebarContent.find(
    (data) => Number(data.id) === Number(selectedIconId)
  );

  const pathname = usePathname();

  function findActiveUrl(narray: any, targetUrl: any) {
    for (const item of narray) {
      // Check if the `items` array exists in the top-level object
      if (item.items) {
        // Iterate through each item in the `items` array
        for (const section of item.items) {
          // Check if `children` array exists and search through it
          if (section.children) {
            for (const child of section.children) {
              if (child.url === targetUrl) {
                return item.id; // Return the ID of the first-level object
              }
            }
          }
        }
      }
    }
    return null; // URL not found
  }

  useEffect(() => {
    const result = findActiveUrl(SidebarContent, pathname);
    if (result) {
      setSelectedIconId(result);
    }
  }, [pathname, setSelectedIconId]);

  return (
    <>
      <div className="xl:block hidden">
        <Sidebar
          className="fixed menu-sidebar bg-white dark:bg-darkgray rtl:pe-4 rtl:ps-0 border-r-0 shadow-none"
          aria-label="Sidebar with multi-level dropdown example"
        >
          <div className="px-5 py-5 flex items-center sidebarlogo border-b border-ld mx-4 mb-1">
            <FullLogo />
          </div>
          <SimpleBar className="h-[calc(100vh_-_90px)]">
            <Sidebar.Items className="pe-4 rtl:pe-0 rtl:ps-4 px-4 mt-1">
              <Sidebar.ItemGroup className="sidebar-nav hide-menu">
                {selectedContent &&
                  selectedContent.items?.filter((item) => hasAccess(item.permission)).map((item, index) => (
                    <div className="caption" key={item.heading}>
                      <React.Fragment key={index}>
                        <h5 className="text-slate-400 dark:text-white/50 font-medium caption leading-6 tracking-wider text-[11px] pb-2 pt-1 uppercase">
                          {item.heading}
                        </h5>
                        {item.children?.filter((child) => hasAccess(child.permission, child.url)).map((child, index) => (
                          <React.Fragment key={String(child.id ?? index)}>
                            {child.children ? (
                              <NavCollapse item={child} />
                            ) : (
                              <NavItems item={child} />
                            )}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    </div>
                  ))}
              </Sidebar.ItemGroup>
            </Sidebar.Items>
          </SimpleBar>
        </Sidebar>
      </div>
    </>
  );
};

export default SidebarLayout;

