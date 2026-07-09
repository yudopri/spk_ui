import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Icon } from "@iconify/react";
import { IconChevronDown } from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import SidebarContent, { MenuItem, ChildItem } from '@/app/(DashboardLayout)/layout/vertical/sidebar/Sidebaritems';
import { canSeeMenuItem } from '@/utils/accessControl';

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

interface FlatGroup {
  heading: string;
  icon?: any;
  children: ChildItem[];
}

const flattenMenuGroups = (content: MenuItem[]): FlatGroup[] => {
  const groups: FlatGroup[] = [];
  for (const page of content) {
    for (const section of page.items || []) {
      if (section.children && section.children.length > 0) {
        groups.push({
          heading: section.heading || '',
          icon: section.children[0]?.icon,
          children: section.children,
        });
      }
    }
  }
  return groups;
};

const Navigation = () => {
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const pathname = usePathname();
  const { t } = useTranslation();
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const dropdownTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const allGroups = flattenMenuGroups(SidebarContent);

  const navItems = allGroups.map((group, idx) => {
    const accessibleChildren = group.children.filter((c) => hasAccess(c.permission, c.url));
    return {
      id: idx,
      heading: group.heading,
      icon: group.icon,
      children: accessibleChildren,
    };
  }).filter((g) => g.children.length > 0);

  const handleDropdownEnter = (id: number) => {
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
      dropdownTimerRef.current = null;
    }
    setActiveDropdown(id);
  };

  const handleDropdownLeave = () => {
    dropdownTimerRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const isItemActive = (url: string) => pathname === url;
  const isGroupActive = (children: ChildItem[]) => children.some((c) => c.url === pathname);

  return (
    <nav className="bg-white dark:bg-darkgray border-t border-ld xl:border-b border-b-0">
      <div className="flex items-center overflow-x-auto hide-scrollbar">
        <ul className="flex items-center gap-0.5 px-2 py-1.5 min-w-max">
          {navItems.map((group) => {
            const hasActive = isGroupActive(group.children);
            return (
              <li key={group.id} className="relative">
                {group.children.length === 1 ? (
                  /* ─── Single-item: render as direct link ─── */
                  <Link
                    href={group.children[0].url}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${
                      isItemActive(group.children[0].url)
                        ? 'text-white bg-primary shadow-sm'
                        : 'text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary'
                    }`}
                  >
                    <Icon
                      icon={group.children[0].icon}
                      height={17}
                      className={isItemActive(group.children[0].url) ? 'text-white' : 'text-slate-400'}
                    />
                    <span>{t(group.children[0].name || '')}</span>
                  </Link>
                ) : (
                  /* ─── Multi-item: render as hover dropdown ─── */
                  <div
                    className="relative"
                    onMouseEnter={() => handleDropdownEnter(group.id)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <button
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${
                        hasActive
                          ? 'text-primary bg-lightprimary'
                          : activeDropdown === group.id
                            ? 'text-primary bg-lightprimary'
                            : 'text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary'
                      }`}
                    >
                      <Icon
                        icon={hasActive ? group.icon : group.children[0].icon}
                        height={17}
                        className={hasActive ? 'text-primary' : 'text-slate-400'}
                      />
                      <span>{group.heading}</span>
                      <IconChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${activeDropdown === group.id ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {activeDropdown === group.id && (
                      <div
                        className="absolute left-0 mt-1 bg-white dark:bg-darkgray rounded-xl shadow-lg border border-ld py-1.5 min-w-[230px] z-50 animate-in fade-in slide-in-from-top-1"
                        onMouseEnter={() => handleDropdownEnter(group.id)}
                        onMouseLeave={handleDropdownLeave}
                      >
                        <div className="px-3 py-1.5 mb-1">
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wider">
                            {group.heading}
                          </span>
                        </div>
                        <div className="border-t border-ld mx-2 mb-1" />
                        {group.children.map((child) => (
                          <Link
                            key={child.id}
                            href={child.url}
                            onClick={() => setActiveDropdown(null)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors duration-150 mx-1 rounded-lg ${
                              isItemActive(child.url)
                                ? 'text-primary bg-lightprimary font-semibold'
                                : 'text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-primary'
                            }`}
                          >
                            <Icon
                              icon={child.icon}
                              height={17}
                              className={isItemActive(child.url) ? 'text-primary' : 'text-slate-400 dark:text-white/40'}
                            />
                            <span>{t(child.name || '')}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
