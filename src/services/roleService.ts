import axiosServices from '@/utils/axios';
import { ApiResponse } from './divisiService';

export interface RolePermission {
  id: number;
  permission_name: string;
  path: string;
}

export interface Role {
  id: number;
  role_name: string;
  permission_count?: number;
  permissions?: string[];
}

export interface RoleDetail {
  id: number;
  role_name: string;
  permissions: RolePermission[];
}

const roleService = {
  getAll: async (
    page = 1,
    pageSize = 10,
    search = '',
    sortBy = 'role_name',
    sortOrder: 'ASC' | 'DESC' = 'ASC'
  ): Promise<ApiResponse<Role[]>> => {
    try {
      const response = await axiosServices.get<any>('/auth/roles', {
        params: { page, pageSize, search, sort_by: sortBy, sort_order: sortOrder },
      });

      const rawList = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];

      const data: Role[] = rawList.map((item: any) => ({
        id: Number(item.id ?? 0),
        role_name: item.role_name ?? item.name ?? '',
        permission_count: item.permission_count ?? item.permissions?.length ?? 0,
        permissions: Array.isArray(item.permissions)
          ? item.permissions.map((p: any) => typeof p === 'string' ? p : (p?.permission_name ?? p?.name ?? ''))
          : [],
      }));

      return {
        success: true,
        message: 'Success',
        data,
        meta: response.data?.meta || {
          total: data.length,
          page,
          pageSize,
          totalPages: Math.ceil(data.length / pageSize),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch roles',
        data: [],
      };
    }
  },

  getById: async (id: number): Promise<{ success: boolean; data: RoleDetail | null }> => {
    try {
      const response = await axiosServices.get<any>(`/auth/roles/${id}`);
      const raw = response.data?.data ?? response.data;

      // Try to extract permissions from role detail response
      let permissions: RolePermission[] = [];
      const rawPerms = raw?.permissions ?? raw?.role_permissions ?? [];

      if (Array.isArray(rawPerms) && rawPerms.length > 0) {
        permissions = rawPerms.map((p: any) => ({
          id: Number(p.id ?? p.permission_id ?? p.permissionId ?? 0),
          permission_name: p.permission_name ?? p.name ?? p.permission ?? '',
          path: p.path ?? '',
        }));
      }

      // Fallback: if no permissions from detail, fetch from dedicated endpoint
      if (permissions.length === 0) {
        try {
          permissions = await roleService.getRolePermissions(id);
        } catch {
          // ignore
        }
      }

      return {
        success: true,
        data: {
          id: Number(raw?.id ?? raw?.role_id ?? id),
          role_name: raw?.role_name ?? raw?.name ?? '',
          permissions,
        },
      };
    } catch (error: any) {
      return { success: false, data: null };
    }
  },

  getRolePermissions: async (roleId: number): Promise<RolePermission[]> => {
    try {
      const response = await axiosServices.get<any>(`/auth/roles/${roleId}/permissions`);
      const rawList = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];
      return rawList.map((item: any) => ({
        id: Number(item.id ?? item.permission_id ?? item.permissionId ?? 0),
        permission_name: item.permission_name ?? item.name ?? item.permission ?? '',
        path: item.path ?? '',
      }));
    } catch {
      return [];
    }
  },

  /**
   * Bulk set permissions for a role (REPLACE all)
   * POST /api/auth/roles/:id/permissions
   * Body: { permission_ids: [1, 2, 3] }
   */
  setPermissions: async (roleId: number, permissionIds: number[]): Promise<{ success: boolean; message?: string; assigned?: number; invalid_ids?: number[] }> => {
    const response = await axiosServices.post<any>(`/auth/roles/${roleId}/permissions`, {
      permission_ids: permissionIds,
    });
    return response.data;
  },

  /**
   * Assign a single permission to a role
   * POST /api/auth/roles/:id/permissions/:permission_id
   */
  assignPermission: async (roleId: number, permissionId: number) => {
    const response = await axiosServices.post<any>(
      `/auth/roles/${roleId}/permissions/${permissionId}`
    );
    return response.data;
  },

  /**
   * Remove a single permission from a role
   * DELETE /api/auth/roles/:id/permissions/:permission_id
   */
  removePermission: async (roleId: number, permissionId: number) => {
    const response = await axiosServices.delete<any>(
      `/auth/roles/${roleId}/permissions/${permissionId}`
    );
    return response.data;
  },
};

export default roleService;
