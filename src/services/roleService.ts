import axiosServices from '@/utils/axios';
import { Permission } from './permissionService';

const ROLE_PERMISSION_MULTIPLIER = 100000;

const roleIdToName = new Map<number, string>();
const permissionIdToName = new Map<number, string>();

export interface RolePermission {
  id: number;
  roleId: number;
  permissionId: number;
  permission?: Permission | null;
}

export interface Role {
  id: number;
  name: string;
  users?: any[] | null;
  rolePermissions: RolePermission[];
}

export interface RoleResponse {
  success: boolean;
  message?: string;
  data: Role[];
}

const roleService = {
  getAll: async () => {
    const [rolesRes, permissionsRes] = await Promise.all([
      axiosServices.get<any>('/auth/roles-mitra'),
      axiosServices.get<any>('/auth/permissions').catch(() => ({ data: [] })),
    ]);

    const roleNames = (Array.isArray(rolesRes.data)
      ? rolesRes.data
      : Array.isArray(rolesRes.data?.data)
        ? rolesRes.data.data
        : []) as Array<string | { id?: number; name?: string; role?: string }>;

    const permissionList = (Array.isArray(permissionsRes.data)
      ? permissionsRes.data
      : Array.isArray(permissionsRes.data?.data)
        ? permissionsRes.data.data
        : Array.isArray(permissionsRes.data?.permissions)
          ? permissionsRes.data.permissions
          : []) as Array<string | { id?: number; name?: string; permission?: string }>;

    permissionIdToName.clear();
    permissionList.forEach((perm: any, index) => {
      const id = Number(perm?.id ?? index + 1);
      const name = typeof perm === 'string' ? perm : (perm?.name ?? perm?.permission ?? '');
      if (name) {
        permissionIdToName.set(id, name);
      }
    });

    const roles: Role[] = await Promise.all(
      roleNames.map(async (rawRole: any, index: number) => {
        const roleName = typeof rawRole === 'string' ? rawRole : (rawRole?.name ?? rawRole?.role ?? '');
        const roleId = Number(rawRole?.id ?? index + 1);
        roleIdToName.set(roleId, roleName);

        let assignedPermissions: string[] = [];
        try {
          const rolePermRes = await axiosServices.get<any>(`/auth/mitra-roles/${encodeURIComponent(roleName)}/permissions`);
          const rawPerms = Array.isArray(rolePermRes.data)
            ? rolePermRes.data
            : Array.isArray(rolePermRes.data?.data)
              ? rolePermRes.data.data
              : Array.isArray(rolePermRes.data?.permissions)
                ? rolePermRes.data.permissions
                : [];
          assignedPermissions = rawPerms
            .map((item: any) => (typeof item === 'string' ? item : (item?.name ?? item?.permission ?? '')))
            .filter((name: string) => Boolean(name));
        } catch {
          assignedPermissions = [];
        }

        const rolePermissions: RolePermission[] = assignedPermissions.map((permName, permIndex) => {
          const matchedPermissionId =
            [...permissionIdToName.entries()].find(([, value]) => value === permName)?.[0] ?? permIndex + 1;

          return {
            id: roleId * ROLE_PERMISSION_MULTIPLIER + matchedPermissionId,
            roleId,
            permissionId: matchedPermissionId,
            permission: {
              id: matchedPermissionId,
              name: permName,
              description: '',
            },
          };
        });

        return {
          id: roleId,
          name: roleName,
          users: null,
          rolePermissions,
        };
      })
    );

    return {
      success: true,
      data: roles,
    };
  },

  create: async (data: Partial<Role>) => {
    throw new Error('Endpoint create role belum tersedia pada backend SPK terbaru.');
  },

  update: async (data: Role) => {
    throw new Error('Endpoint update role belum tersedia pada backend SPK terbaru.');
  },

  delete: async (id: number) => {
    throw new Error('Endpoint delete role belum tersedia pada backend SPK terbaru.');
  },

  assignPermission: async (roleId: number, permissionId: number) => {
    const roleName = roleIdToName.get(roleId);
    const permissionName = permissionIdToName.get(permissionId);

    if (!roleName || !permissionName) {
      throw new Error('Role atau permission tidak dikenali untuk assign permission.');
    }

    const response = await axiosServices.post(`/auth/mitra-roles/${encodeURIComponent(roleName)}/permissions`, {
      permission: permissionName,
    });
    return response.data;
  },

  revokePermission: async (id: number) => {
    throw new Error('Endpoint revoke permission belum tersedia pada backend SPK terbaru (hanya GET/POST).');
  }
};

export default roleService;
