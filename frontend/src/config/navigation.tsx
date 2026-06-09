import type { ReactNode } from "react";
import {
  BoxCubeIcon,
  CalenderIcon,
  GridIcon,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons";
import { MODULE_PATHS } from "./permissions";

export type NavItem = {
  name: string;
  icon: ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

export const businessNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: MODULE_PATHS.HOME,
  },
  {
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    name: "Hermanos",
    path: MODULE_PATHS.BROTHERS,
  },
  {
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M12 7v14m-6-7h12M5 21V10.85a2 2 0 01.2-.9l2-4A2 2 0 019 5h6a2 2 0 011.8 1.1l2 4a2 2 0 01.2.9V21M12 7l-3-3m3 3l3-3M9 17v-4m6 4v-4" />
      </svg>
    ),
    name: "Fraternidad",
    path: MODULE_PATHS.HOMES,
  },
  {
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    name: "Grupos",
    path: MODULE_PATHS.GROUPS,
  },
  {
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h7" />
        <rect x="14" y="14" width="7" height="5" rx="1" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 14v-2a2 2 0 114 0v2" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    name: "Usuarios",
    path: MODULE_PATHS.USERS,
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style={{ width: "24px", height: "24px" }}>
        <path d="M192 32H32C14.33 32 0 46.33 0 64v384c0 17.67 14.33 32 32 32h160V32zm32 448h192c17.67 0 32-14.33 32-32V64c0-17.67-14.33-32-32-32H224v448zM96 128h64c8.84 0 16 7.16 16 16s-7.16 16-16 16H96c-8.84 0-16-7.16-16-16s7.16-16 16-16zm0 64h64c8.84 0 16 7.16 16 16s-7.16 16-16 16H96c-8.84 0-16-7.16-16-16s7.16-16 16-16zm0 64h64c8.84 0 16 7.16 16 16s-7.16 16-16 16H96c-8.84 0-16-7.16-16-16s7.16-16 16-16zm192-128h64c8.84 0 16 7.16 16 16s-7.16 16-16 16h-64c-8.84 0-16-7.16-16-16s7.16-16 16-16zm0 64h64c8.84 0 16 7.16 16 16s-7.16 16-16 16h-64c-8.84 0-16-7.16-16-16s7.16-16 16-16z" fill="currentColor" />
      </svg>
    ),
    name: "Noticias",
    path: MODULE_PATHS.NEWS,
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style={{ width: "24px", height: "24px" }} fill="currentColor">
        <path d="M133.8 36.3c10.9 7.6 13.5 22.6 5.9 33.4l-56 80c-4.1 5.8-10.5 9.5-17.6 10.1S52 158 47 153L7 113C-2.3 103.6-2.3 88.4 7 79S31.6 69.7 41 79l19.8 19.8 39.6-56.6c7.6-10.9 22.6-13.5 33.4-5.9zm0 160c10.9 7.6 13.5 22.6 5.9 33.4l-56 80c-4.1 5.8-10.5 9.5-17.6 10.1S52 318 47 313L7 273c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l19.8 19.8 39.6-56.6c7.6-10.9 22.6-13.5 33.4-5.9zM224 96c0-17.7 14.3-32 32-32l224 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-224 0c-17.7 0-32-14.3-32-32zm0 160c0-17.7 14.3-32 32-32l224 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-224 0c-17.7 0-32-14.3-32-32zM160 416c0-17.7 14.3-32 32-32l288 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-288 0c-17.7 0-32-14.3-32-32zM64 376a40 40 0 1 1 0 80 40 40 0 1 1 0-80z" />
      </svg>
    ),
    name: "Tareas",
    path: MODULE_PATHS.TASKS,
  },
  {
    icon: <CalenderIcon />,
    name: "Calendario",
    path: MODULE_PATHS.CALENDAR,
  },
];

/** Menú demo TailAdmin — visible solo para administrador */
export const adminDemoNavItems: NavItem[] = [
  {
    icon: <UserCircleIcon />,
    name: "User Profile",
    path: MODULE_PATHS.PROFILE,
  },
  {
    name: "Forms",
    icon: <ListIcon />,
    subItems: [{ name: "Form Elements", path: "/form-elements", pro: false }],
  },
  {
    name: "Tables",
    icon: <TableIcon />,
    subItems: [{ name: "Basic Tables", path: "/basic-tables", pro: false }],
  },
  {
    name: "Pages",
    icon: <PageIcon />,
    subItems: [
      { name: "Blank Page", path: "/blank", pro: false },
      { name: "404 Error", path: "/error-404", pro: false },
    ],
  },
];

export const adminDemoOthersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Charts",
    subItems: [
      { name: "Line Chart", path: "/line-chart", pro: false },
      { name: "Bar Chart", path: "/bar-chart", pro: false },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "UI Elements",
    subItems: [
      { name: "Alerts", path: "/alerts", pro: false },
      { name: "Avatar", path: "/avatars", pro: false },
      { name: "Badge", path: "/badge", pro: false },
      { name: "Buttons", path: "/buttons", pro: false },
      { name: "Images", path: "/images", pro: false },
      { name: "Videos", path: "/videos", pro: false },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Authentication",
    subItems: [
      { name: "Sign In", path: "/signin", pro: false },
      { name: "Sign Up", path: "/signup", pro: false },
    ],
  },
];

export function filterNavByAccess(items: NavItem[], canAccess: (path: string) => boolean): NavItem[] {
  return items
    .map((item) => {
      if (item.subItems) {
        const subItems = item.subItems.filter((sub) => canAccess(sub.path));
        if (subItems.length === 0) return null;
        return { ...item, subItems };
      }
      if (item.path && !canAccess(item.path)) return null;
      return item;
    })
    .filter((item): item is NavItem => item !== null);
}
