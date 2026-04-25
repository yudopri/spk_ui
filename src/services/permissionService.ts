import axiosServices from '@/utils/axios';

export interface Permission {
  id: number;
  name: string;
  description: string;
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
          name: item,
          description: '',
        };
      }

      return {
        id: Number(item.id ?? index + 1),
        name: item.name ?? item.permission ?? item.code ?? '',
        description: item.description ?? '',
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
      name: data.name,
      description: data.description,
    });
    return response.data;
  },

  update: async (data: Permission) => {
    const response = await axiosServices.post('/auth/permissions', data);
    return response.data;
  },

  delete: async (id: number) => {
    throw new Error('Endpoint delete permission belum tersedia pada backend SPK terbaru (hanya GET/POST).');
  }
};

export default permissionService;
