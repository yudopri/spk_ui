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
    const response = await axiosServices.get<PermissionResponse>('/User/permission');
    return response.data;
  },

  create: async (data: Omit<Permission, 'id'>) => {
    const response = await axiosServices.post('/User/permission', {
      ...data,
      id: 0
    });
    return response.data;
  },

  update: async (data: Permission) => {
    const response = await axiosServices.put('/User/permission', data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await axiosServices.delete(`/User/permission/${id}`);
    return response.data;
  }
};

export default permissionService;
