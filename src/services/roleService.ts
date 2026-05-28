import axiosServices from '@/utils/axios';
import { Permission } from './permissionService';
import { ApiResponse } from './divisiService';

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
  role_name: string;
  users?: any[] | null;
  rolePermissions: RolePermission[];
}

const roleService = {
  getAll: async (page = 1, pageSize = 10): Promise<ApiResponse<Role[]>> => {
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        axiosServices.get<any>('/auth/roles-mitra'),
        axiosServices.get<any>('/auth/permissions').catch(() => ({ data: [] })),
      ]);

      const roleNames = (Array.isArray(rolesRes.data)
        ? rolesRes.data
        : Array.isArray(rolesRes.data?.data)
          ? rolesRes.data.data
          : []) as Array<string | { id?: number; role_name?: string; role?: string }>;

      const permissionList = (Array.isArray(permissionsRes.data)
        ? permissionsRes.data
        : Array.isArray(permissionsRes.data?.data)
          ? permissionsRes.data.data
          : Array.isArray(permissionsRes.data?.permissions)
            ? permissionsRes.data.permissions
            : []) as Array<string | { id?: number; permission_name?: string; permission?: string }>;

      permissionIdToName.clear();
      permissionList.forEach((perm: any, index) => {
        const id = Number(perm?.id ?? index + 1);
        const name = typeof perm === 'string' ? perm : (perm?.permission_name ?? perm?.permission ?? '');
        if (name) {
          permissionIdToName.set(id, name);
        }
      });

      const roles: Role[] = await Promise.all(
        roleNames.map(async (rawRole: any, index: number) => {
          const roleName = typeof rawRole === 'string' ? rawRole : (rawRole?.role_name ?? rawRole?.role ?? '');
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
                permission_name: permName,
                path: '',
              },
            };
          });

          return {
            id: roleId,
            role_name: roleName,
            users: null,
            rolePermissions,
          };
        })
      );

      // Slice for pagination since backend might not support it for this specific endpoint
      const start = (page - 1) * pageSize;
      const paginatedRoles = roles.slice(start, start + pageSize);

      return {
        success: true,
        message: "Success",
        data: paginatedRoles,
        meta: {
          total: roles.length,
          page,
          pageSize,
          totalPages: Math.ceil(roles.length / pageSize),
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to fetch roles",
        data: [],
      };
    }
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

  assignPermission: async (roleName: string, permissionId: number) => {
    const response = await axiosServices.post(`/auth/mitra-roles/${encodeURIComponent(roleName)}/permissions`, {
      permissions: [permissionId],
    });
    return response.data;
  },

  updatePermissions: async (roleName: string, permissionIds: number[]) => {
    const response = await axiosServices.post(`/auth/mitra-roles/${encodeURIComponent(roleName)}/permissions`, {
      permissions: permissionIds,
    });
    return response.data;
  },
};

export default roleService;
