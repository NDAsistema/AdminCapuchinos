import { useState, useEffect } from "react";
import GroupService from "../../services/GroupService";
import brotherService from "../../services/brotherService";
import userServices from "../../services/userServices";
import { usePermissions } from "../../hooks/usePermissions";

interface FiltersProps {
  onFilterChange: (filters: { groupId: string; userId: string }) => void;
}

type Option = { id: number; name: string };

export function TaskFilters({ onFilterChange }: FiltersProps) {
  const { isAdmin, isCommunications } = usePermissions();
  const [groupId, setGroupId] = useState("");
  const [userId, setUserId] = useState("");
  const [groups, setGroups] = useState<Option[]>([]);
  const [users, setUsers] = useState<Option[]>([]);

  useEffect(() => {
    onFilterChange({ groupId, userId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, userId]);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        if (isAdmin) {
          const [groupsData, usersData] = await Promise.all([
            GroupService.getAll(),
            userServices.getAllUser(),
          ]);
          setGroups(
            (groupsData || []).map((g: any) => ({
              id: g.id,
              name: g.name || g.home_name || `Grupo ${g.id}`,
            }))
          );
          setUsers(
            (usersData || [])
              .filter((u: any) => Number(u.type_user) === 2)
              .map((u: any) => ({
                id: u.id,
                name: u.name_brother || u.email,
              }))
          );
        } else if (isCommunications) {
          const [groupsData, usersData] = await Promise.all([
            GroupService.findGroupsForCommunicationUser(),
            brotherService.findUsersInCommsScope(),
          ]);
          setGroups(
            (groupsData || []).map((g: any) => ({
              id: g.id,
              name: g.home_name ? `${g.name} (${g.home_name})` : g.name,
            }))
          );
          setUsers(
            (usersData || []).map((u: any) => ({
              id: u.id,
              name: u.name,
            }))
          );
        }
      } catch (error) {
        console.error("Error cargando filtros de tareas:", error);
      }
    };
    loadFilters();
  }, [isAdmin, isCommunications]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl">
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase ml-1 mb-1">
          Filtrar por Grupo
        </label>
        <select
          value={groupId}
          onChange={(e) => {
            setGroupId(e.target.value);
            setUserId("");
          }}
          className="w-full bg-white dark:bg-gray-800 border-none rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 h-11 px-4"
        >
          <option value="">Todos los Grupos</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase ml-1 mb-1">
          Filtrar por Usuario
        </label>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full bg-white dark:bg-gray-800 border-none rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 h-11 px-4"
        >
          <option value="">Todos los Usuarios</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
