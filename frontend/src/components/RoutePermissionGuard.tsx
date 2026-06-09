import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./UserProfile/AuthProvider";
import { canAccessRoute } from "../config/permissions";

/**
 * Bloquea rutas no permitidas para el type_user actual.
 * Redirige al home (vista por defecto).
 */
export default function RoutePermissionGuard() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (!canAccessRoute(pathname, user.type_user)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
