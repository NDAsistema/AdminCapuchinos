import { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserPasswordCard from "../components/UserProfile/UserPasswordCard";
import PageMeta from "../components/common/PageMeta";
import { useAuth } from "../components/UserProfile/AuthProvider";
import authService from "../services/authService";

export default function UserProfiles() {
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const profile = await authService.getProfile();
        if (mounted) updateUser(profile);
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [updateUser]);

  return (
    <>
      <PageMeta
        title="Mi Perfil | Admin Capuchinos"
        description="Administra tu foto, datos personales y contraseña"
      />
      <PageBreadcrumb pageTitle="Mi Perfil" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Perfil
        </h3>
        {loading ? (
          <div className="py-12 text-sm text-center text-gray-500">Cargando perfil...</div>
        ) : (
          <div className="space-y-6">
            <UserMetaCard />
            <UserInfoCard />
            <UserPasswordCard />
          </div>
        )}
      </div>
    </>
  );
}
