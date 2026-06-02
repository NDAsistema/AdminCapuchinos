import { useState, useEffect } from "react";

interface FiltersProps {
  onFilterChange: (filters: { groupId: string; userId: string }) => void;
}

export function TaskFilters({ onFilterChange }: FiltersProps) {
  const [groupId, setGroupId] = useState("");
  const [userId, setUserId] = useState("");
  const [groups, setGroups] = useState([]); // Aquí cargarías tus grupos de la DB
  const [users, setUsers] = useState([]);   // Aquí cargarías los usuarios

  // Notificar al padre cada vez que cambie un filtro
  useEffect(() => {
    onFilterChange({ groupId, userId });
  }, [groupId, userId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl">
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase ml-1 mb-1">Filtrar por Grupo</label>
        <select 
          value={groupId}
          onChange={(e) => { setGroupId(e.target.value); setUserId(""); }}
          className="w-full bg-white dark:bg-gray-800 border-none rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 h-11 px-4"
        >
          <option value="">Todos los Grupos</option>
          {/* Ejemplo: groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>) */}
          <option value="1">Grupo A</option>
          <option value="2">Grupo B</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase ml-1 mb-1">Filtrar por Usuario</label>
        <select 
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full bg-white dark:bg-gray-800 border-none rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 h-11 px-4"
        >
          <option value="">Todos los Usuarios</option>
          {/* Aquí podrías filtrar el map de usuarios según el groupId seleccionado */}
          <option value="10">Nelson Alejandro</option>
          <option value="11">Enrique</option>
        </select>
      </div>
    </div>
  );
}