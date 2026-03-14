import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../UserProfile/AuthProvider";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera del menú
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-gray-700 focus:outline-none group"
        type="button"
      >
        {/* Contenedor del Avatar con el borde verde/azul de tu imagen */}
        <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-blue-500 to-green-500">
          <div className="overflow-hidden rounded-full h-9 w-9 bg-white border-2 border-white">
            <img
              src={user.img_brother || "/default-avatar.png"}
              className="w-full h-full object-cover"
              alt="User"
              onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
            />
          </div>
        </div>

        {/* Nombre del Usuario (Nelson Alejandro...) */}
        <span className="ml-3 hidden sm:block font-semibold text-sm text-gray-800 group-hover:text-blue-600 transition-colors">
          {user.name_brother}
        </span>

        {/* Flecha indicadora */}
        <svg 
          className={`ml-2 w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Menú Desplegable Estilizado */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[9999] py-2 animate-in fade-in zoom-in duration-200">
          <div className="px-4 py-3 border-b border-gray-50 mb-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Cuenta</p>
            <p className="text-sm font-bold text-gray-800 truncate">{user.email}</p>
            <p className="text-[11px] text-blue-500 font-bold mt-0.5">
              {user.type_user === 1 ? "ADMINISTRADOR" : "USUARIO"}
            </p>
          </div>

          <Link
            to="/profile"
            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Mi Perfil
          </Link>

          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="flex w-full items-center px-4 py-2 mt-1 text-sm text-red-500 hover:bg-red-50 font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
}