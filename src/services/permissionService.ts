import axiosServices from '@/utils/axios';

export interface Permission {
  id: number;
  permission_name: string;
  path: string;
  rolePermissions?: string[] | null;
}

export interface PermissionResponse {
  success: boolean;
  message?: string;
  data: Permission[];
}

const permissionService = {
  getAll: async () => {
    const response = await axiosServices.get<any>('/auth/permissions');
    const rawList = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.permissions)
          ? response.data.permissions
          : [];

    const mapped: Permission[] = rawList.map((item: any, index: number) => {
      if (typeof item === 'string') {
        return {
          id: index + 1,
          permission_name: item,
          path: '',
        };
      }

      return {
        id: Number(item.id ?? index + 1),
        permission_name: item.permission_name ?? item.name ?? item.permission ?? item.code ?? '',
        path: item.path ?? '',
        rolePermissions: item.rolePermissions ?? null,
      };
    });

    return {
      success: Boolean(response.data?.success ?? true),
      message: response.data?.message,
      data: mapped,
    };
  },

  create: async (data: Omit<Permission, 'id'>) => {
    const response = await axiosServices.post('/auth/permissions', {
      permission_name: data.permission_name,
      path: data.path,
    });
    return response.data;
  },

  update: async (data: Permission) => {
    const response = await axiosServices.put(`/auth/permissions/${data.id}`, {
      permission_name: data.permission_name,
      path: data.path,
    });
    return response.data;
  },

  delete: async (id: number) => {
    const response = await axiosServices.delete(`/auth/permissions/${id}`);
    return response.data;
  }
};

export default permissionService;
