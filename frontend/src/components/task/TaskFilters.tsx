import { useState, useEffect } from "react";
import GroupService from "../../services/GroupService";
import brotherService from "../../services/brotherService";
import userServices from "../../services/userServices";
import { usePermissions } from "../../hooks/usePermissions";

interface FiltersProps {
  onFilterChange: (filters: {
    groupId: string;
    userId: string;
    brotherId: string;
  }) => void;
  isLeaderMode?: boolean;
}

type GroupOption = { id: number; name: string };
type MemberOption = {
  key: string;
  label: string;
  userId?: number;
  brotherId: number;
};

function toMemberOptions(members: any[]): MemberOption[] {
  return (members || []).map((m: any) => {
    const brotherId = Number(m.brotherId ?? m.id_brother ?? m.id);
    const userId = m.userId != null ? Number(m.userId) : undefined;
    const name = m.name || m.name_brother || m.email || `Hermano ${brotherId}`;
    const hasAccount = userId != null && !Number.isNaN(userId);
    return {
      key: hasAccount ? `u:${userId}` : `b:${brotherId}`,
      label: name,
      userId: hasAccount ? userId : undefined,
      brotherId,
    };
  });
}

export function TaskFilters({ onFilterChange, isLeaderMode }: FiltersProps) {
  const { isAdmin, isCommunications, isGroupLeader } = usePermissions();
  const leaderMode = isLeaderMode ?? isGroupLeader;
  const [groupId, setGroupId] = useState("");
  const [memberKey, setMemberKey] = useState("");
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);

  useEffect(() => {
    const userId = memberKey.startsWith("u:") ? memberKey.slice(2) : "";
    const brotherId = memberKey.startsWith("b:") ? memberKey.slice(2) : "";
    onFilterChange({ groupId, userId, brotherId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, memberKey]);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        if (isAdmin) {
          const groupsData = await GroupService.getAll();
          setGroups(
            (groupsData || []).map((g: any) => ({
              id: g.id,
              name: g.name || g.home_name || `Grupo ${g.id}`,
            }))
          );
        } else if (isCommunications) {
          const groupsData = await GroupService.findGroupsForCommunicationUser();
          setGroups(
            (groupsData || []).map((g: any) => ({
              id: g.id,
              name: g.home_name ? `${g.name} (${g.home_name})` : g.name,
            }))
          );
        } else if (leaderMode) {
          const groupsData = await GroupService.findGroupsForGroupLeader();
          setGroups(
            (groupsData || []).map((g: any) => ({
              id: g.id,
              name: g.home_name ? `${g.name} (${g.home_name})` : g.name,
            }))
          );
        }
      } catch (error) {
        console.error("Error cargando grupos:", error);
      }
    };
    loadGroups();
  }, [isAdmin, isCommunications, leaderMode]);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        if (isCommunications) {
          const data = await brotherService.findUsersInCommsScope(
            groupId || undefined
          );
          setMembers(toMemberOptions(data));
        } else if (leaderMode) {
          const data = await brotherService.findMembersInLedGroups(
            groupId || undefined
          );
          setMembers(toMemberOptions(data));
        } else if (isAdmin) {
          if (groupId) {
            const data = await brotherService.findStandardUsersInGroup(groupId);
            setMembers(toMemberOptions(data));
          } else {
            const usersData = await userServices.getAllUser();
            setMembers(
              (usersData || [])
                .filter((u: any) => Number(u.type_user) === 2)
                .map((u: any) => ({
                  key: `u:${u.id}`,
                  label: u.name_brother || u.email,
                  userId: Number(u.id),
                  brotherId: Number(u.id_brother),
                }))
            );
          }
        }
      } catch (error) {
        console.error("Error cargando usuarios del filtro:", error);
        setMembers([]);
      }
    };

    if (isAdmin || isCommunications || leaderMode) {
      loadMembers();
    }
  }, [groupId, isAdmin, isCommunications, leaderMode]);

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
            setMemberKey("");
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
          value={memberKey}
          onChange={(e) => setMemberKey(e.target.value)}
          className="w-full bg-white dark:bg-gray-800 border-none rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 h-11 px-4"
        >
          <option value="">Todos los Usuarios</option>
          {members.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
