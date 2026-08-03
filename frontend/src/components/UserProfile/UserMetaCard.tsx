import { useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { usePermissions } from "../../hooks/usePermissions";
import authService from "../../services/authService";
import AlertService from "../../services/alertService";

export default function UserMetaCard() {
  const { user, updateUser } = useAuth();
  const { roleLabel } = usePermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoClick = () => {
    if (!uploading) fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      AlertService.error("Archivo inválido", "Solo se permiten imágenes");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      AlertService.error("Archivo muy grande", "La imagen no debe superar los 5MB");
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);
      AlertService.loading("Subiendo foto...");
      const updated = await authService.updateProfile({ img: file });
      updateUser(updated);
      AlertService.close();
      await AlertService.success("Listo", "Tu foto de perfil se actualizó correctamente");
    } catch (error: any) {
      AlertService.close();
      AlertService.error("Error", error.message || "No se pudo actualizar la foto");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (!user) return null;

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col items-center gap-6 xl:flex-row">
        <div className="relative group">
          <button
            type="button"
            onClick={handlePhotoClick}
            disabled={uploading}
            className="relative w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
            title="Cambiar foto de perfil"
          >
            <img
              src={user.img_brother || "/images/user/owner.jpg"}
              alt={user.name_brother || "Usuario"}
              className="object-cover w-full h-full"
              onError={(e) => {
                e.currentTarget.src = "/images/user/owner.jpg";
              }}
            />
            <span className="absolute inset-0 flex items-center justify-center transition-opacity bg-black/50 opacity-0 group-hover:opacity-100">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <p className="mt-2 text-xs text-center text-gray-400 xl:hidden">
            Toca la foto para cambiarla
          </p>
        </div>

        <div className="text-center xl:text-left">
          <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            {user.name_brother || "Sin nombre"}
          </h4>
          <div className="flex flex-col items-center gap-1 xl:flex-row xl:gap-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">{roleLabel}</p>
            {user.email && (
              <>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </>
            )}
          </div>
          <p className="hidden mt-2 text-xs text-gray-400 xl:block">
            Haz clic en la foto para actualizarla
          </p>
        </div>
      </div>
    </div>
  );
}
