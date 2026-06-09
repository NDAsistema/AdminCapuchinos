/**
 * Permisos de módulos por tipo de usuario (type_user).
 * Fuente única para rutas y menú lateral.
 */
export const USER_ROLES = {
  ADMIN: 1,
  STANDARD: 2,
  COMMUNICATIONS: 3,
} as const;

export type UserRoleId = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const MODULE_PATHS = {
  HOME: "/",
  BROTHERS: "/Hermanos",
  HOMES: "/Fraternidades",
  GROUPS: "/Grupos",
  USERS: "/Usuarios",
  NEWS: "/Noticias",
  TASKS: "/Tareas",
  PROFILE: "/profile",
} as const;

/** Rutas de negocio y perfil con roles explícitos */
const BUSINESS_ROUTE_ACCESS: Record<string, readonly UserRoleId[]> = {
  [MODULE_PATHS.HOME]: [USER_ROLES.ADMIN, USER_ROLES.STANDARD, USER_ROLES.COMMUNICATIONS],
  [MODULE_PATHS.BROTHERS]: [USER_ROLES.ADMIN],
  [MODULE_PATHS.HOMES]: [USER_ROLES.ADMIN, USER_ROLES.COMMUNICATIONS],
  [MODULE_PATHS.GROUPS]: [USER_ROLES.ADMIN],
  [MODULE_PATHS.USERS]: [USER_ROLES.ADMIN],
  [MODULE_PATHS.NEWS]: [USER_ROLES.ADMIN, USER_ROLES.COMMUNICATIONS],
  [MODULE_PATHS.TASKS]: [USER_ROLES.ADMIN, USER_ROLES.STANDARD, USER_ROLES.COMMUNICATIONS],
  [MODULE_PATHS.PROFILE]: [USER_ROLES.ADMIN, USER_ROLES.STANDARD, USER_ROLES.COMMUNICATIONS],
};

/** Rutas demo TailAdmin — solo administrador */
const DEMO_ROUTE_PREFIXES = [
  "/calendar",
  "/blank",
  "/form-elements",
  "/basic-tables",
  "/alerts",
  "/avatars",
  "/badge",
  "/buttons",
  "/images",
  "/videos",
  "/line-chart",
  "/bar-chart",
  "/error-404",
  "/signin",
  "/signup",
] as const;

export function normalizeUserRole(typeUser: unknown): UserRoleId | null {
  const role = Number(typeUser);
  if (role === USER_ROLES.ADMIN || role === USER_ROLES.STANDARD || role === USER_ROLES.COMMUNICATIONS) {
    return role;
  }
  return null;
}

export function canAccessRoute(pathname: string, typeUser: unknown): boolean {
  const role = normalizeUserRole(typeUser);
  if (!role) return false;

  if (role === USER_ROLES.ADMIN) return true;

  const path = pathname.split("?")[0] || "/";

  const businessRoles = BUSINESS_ROUTE_ACCESS[path];
  if (businessRoles) {
    return businessRoles.includes(role);
  }

  if (DEMO_ROUTE_PREFIXES.some((demoPath) => path === demoPath || path.startsWith(`${demoPath}/`))) {
    return false;
  }

  return false;
}

export function getRoleLabel(typeUser: unknown): string {
  const role = normalizeUserRole(typeUser);
  switch (role) {
    case USER_ROLES.ADMIN:
      return "Administrador";
    case USER_ROLES.STANDARD:
      return "Usuario estándar";
    case USER_ROLES.COMMUNICATIONS:
      return "Comunicaciones";
    default:
      return "Usuario";
  }
}

/** Paths del menú principal (negocio) para filtrar sidebar */
export const MAIN_MENU_PATHS = [
  MODULE_PATHS.HOME,
  MODULE_PATHS.BROTHERS,
  MODULE_PATHS.HOMES,
  MODULE_PATHS.GROUPS,
  MODULE_PATHS.USERS,
  MODULE_PATHS.NEWS,
  MODULE_PATHS.TASKS,
] as const;
