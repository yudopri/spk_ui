import React, { useState, useEffect } from 'react';
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
  children: ChildItem[];
}

const flattenMenuGroups = (content: MenuItem[]): FlatGroup[] => {
  const groups: FlatGroup[] = [];
  for (const page of content) {
    for (const section of page.items || []) {
      if (section.children && section.children.length > 0) {
        groups.push({
          heading: section.heading || '',
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
      children: accessibleChildren,
    };
  }).filter((g) => g.children.length > 0);

  const handleDropdownEnter = (id: number) => setActiveDropdown(id);
  const handleDropdownLeave = () => setActiveDropdown(null);

  return (
    <nav className="bg-white dark:bg-darkgray border-t border-ld xl:border-b border-b-0">
      <div className="flex items-center overflow-x-auto hide-scrollbar">
        <ul className="flex items-center gap-1 px-1 py-1 min-w-max">
          {navItems.map((group) => {
            const hasActive = group.children.some((c) => c.url === pathname);
            return (
              <li key={group.id} className="relative">
                {group.children.length === 1 ? (
                  <Link
                    href={group.children[0].url}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${
                      group.children[0].url === pathname
                        ? 'text-white bg-primary shadow-sm'
                        : 'text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary'
                    }`}
                  >
                    <Icon icon={group.children[0].icon} height={16} className={group.children[0].url === pathname ? 'text-white' : 'text-slate-400'} />
                    <span>{t(group.children[0].name || '')}</span>
                  </Link>
                ) : (
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
                      {hasActive ? (
                        <Icon icon={group.children[0].icon} height={16} className="text-primary" />
                      ) : null}
                      <span>{group.heading}</span>
                      <IconChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${activeDropdown === group.id ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {activeDropdown === group.id && (
                      <div
                        className="absolute left-0 mt-1 bg-white dark:bg-darkgray rounded-xl shadow-lg border border-ld py-1.5 min-w-[220px] z-50"
                        onMouseEnter={() => handleDropdownEnter(group.id)}
                        onMouseLeave={handleDropdownLeave}
                      >
                        {group.children.map((child) => (
                          <Link
                            key={child.id}
                            href={child.url}
                            onClick={() => setActiveDropdown(null)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors duration-150 ${
                              child.url === pathname
                                ? 'text-primary bg-lightprimary font-semibold'
                                : 'text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-primary'
                            }`}
                          >
                            <Icon
                              icon={child.icon}
                              height={16}
                              className={child.url === pathname ? 'text-primary' : 'text-slate-400 dark:text-white/40'}
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
