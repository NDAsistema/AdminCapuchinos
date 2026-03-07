import { useState } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { Link } from "react-router";
import { useAuth } from "../UserProfile/AuthProvider";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  // Bloqueo de seguridad: Si el usuario es null, mostramos un estado de carga simple
  if (!user) {
    return (
      <div className="flex items-center">
        <div className="w-11 h-11 bg-gray-200 animate-pulse rounded-full"></div>
      </div>
    );
  }

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400"
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11">
          <img 
            src={user?.img_brother || "/default-avatar.png"} 
            className="w-full h-full object-cover" 
            alt="Usuario" 
          />
        </span>

        <span className="block mr-1 font-medium text-theme-sm">{user?.name_brother}</span>
        
        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div className="px-3 py-2">
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {user?.name_brother}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {user?.email}
          </span>
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            >
              {/* Icono de Editar Perfil */}
              <span>Editar Perfil</span>
            </DropdownItem>
          </li>
          {/* ... otros items del menú ... */}
        </ul>
        
        <Link
          to="/signin"
          className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-red-500 rounded-lg group text-theme-sm hover:bg-red-50 dark:hover:bg-red-900/10"
        >
          Cerrar Sesión
        </Link>
      </Dropdown>
    </div>
  );
}