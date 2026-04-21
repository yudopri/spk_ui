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

const SidebarLayout = () => {
  const { selectedIconId, setSelectedIconId } =
    useContext(CustomizerContext) || {};
  
  // Get permissions from localStorage
  const [userPermissions, setUserPermissions] = React.useState<string[]>([]);
  const [userRole, setUserRole] = React.useState<string | null>(null);

  useEffect(() => {
    const perms = localStorage.getItem("permissions");
    const role = localStorage.getItem("role");
    if (perms) {
      try {
        setUserPermissions(JSON.parse(perms));
      } catch (e) {
        setUserPermissions([]);
      }
    }
    setUserRole(role);
  }, []);

  const hasPermission = (perm: string | undefined) => {
    if (!perm) return true; // No permission required
    if (userRole === "Admin" || userRole === "Developer") return true; // Bypass for admin
    return userPermissions.includes(perm);
  };

  const selectedContent = SidebarContent.find(
    (data) => data.id === selectedIconId
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
          className="fixed menu-sidebar  bg-white dark:bg-darkgray rtl:pe-4 rtl:ps-0 "
          aria-label="Sidebar with multi-level dropdown example"
        >
          <div className="px-6 py-4 flex items-center sidebarlogo">
            <FullLogo />
          </div>
          <SimpleBar className="h-[calc(100vh_-_85px)]">
            <Sidebar.Items className="pe-4 rtl:pe-0 rtl:ps-4 px-5 mt-2">
              <Sidebar.ItemGroup className="sidebar-nav hide-menu">
                {selectedContent &&
                  selectedContent.items?.filter(item => hasPermission(item.permission)).map((item, index) => (
                    <div className="caption" key={item.heading}>
                      <React.Fragment key={index}>
                        <h5 className="text-link dark:text-white/70 font-semibold caption font-semibold leading-6 tracking-widest text-xs text-sm  pb-2 uppercase">
                          {item.heading}
                        </h5>
                        {item.children?.filter(child => hasPermission(child.permission)).map((child, index) => (
                          <React.Fragment key={child.id && index}>
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

