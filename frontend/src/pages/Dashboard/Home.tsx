import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../components/UserProfile/AuthProvider";
import { getRoleLabel } from "../../config/permissions";

export default function Home() {
  const { user } = useAuth();
  const displayName = user?.name_brother?.trim() || user?.email || "usuario";

  return (
    <>
      <PageMeta
        title="Dashboard | Admin Capuchinos"
        description="Panel de administración Capuchinos"
      />
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] md:p-8">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Bienvenido, {displayName}
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Panel de administración Capuchinos
          {user?.type_user != null ? ` · ${getRoleLabel(user.type_user)}` : ""}.
          Usa el menú lateral para acceder a los módulos disponibles.
        </p>
      </div>
    </>
  );
}
