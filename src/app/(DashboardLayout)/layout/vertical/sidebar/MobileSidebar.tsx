"use client";
import React, { useContext, useEffect, useState } from "react";
import { Sidebar } from "flowbite-react";
import { IconSidebar } from "./IconSidebar";
import SidebarContent from "./Sidebaritems";
import NavItems from "./NavItems";
import NavCollapse from "./NavCollapse";
import { CustomizerContext } from "@/app/context/CustomizerContext";
import SimpleBar from "simplebar-react";
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

const MobileSidebar = () => {
  const { selectedIconId, setSelectedIconId } = useContext(CustomizerContext) || {};
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const perms = localStorage.getItem("permissions");
    const role = localStorage.getItem("userRole");
    if (perms) {
      try {
        setUserPermissions(normalizePermissions(JSON.parse(perms)));
      } catch { setUserPermissions([]); }
    }
    setUserRole(role);
  }, []);

  const hasAccess = (perm?: string, path?: string) =>
    canSeeMenuItem(userRole, userPermissions, perm, path);

  const selectedContent = SidebarContent.find(
    (data) => data.id === selectedIconId
  );
  return (
    <>
      <div>
        <Sidebar
          className="fixed menu-sidebar pt-8 bg-white dark:bg-darkgray transition-all"
          aria-label="Sidebar with multi-level dropdown example"
        >
          <SimpleBar className="h-[calc(100vh_-_85px)]">
            <Sidebar.Items className="ps-4 pe-4">
              <Sidebar.ItemGroup className="sidebar-nav">
                {selectedContent &&
                  selectedContent.items?.filter((item) => hasAccess(item.permission)).map((item, index) => (
                    <div className={`caption ${index === 0 ? 'first-caption' : ''}`} key={item.heading}>
                      <React.Fragment key={index}>
                        <h5 className="text-slate-400 dark:text-white/50 font-semibold caption-text leading-6 tracking-wider text-[10px] pb-2 pt-1 px-3 uppercase">
                          {item.heading}
                        </h5>
                        {item.children?.filter((child) => hasAccess(child.permission, child.url)).map((child, index) => (
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

export default MobileSidebar;
