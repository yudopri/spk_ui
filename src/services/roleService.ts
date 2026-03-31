import axiosServices from '@/utils/axios';
import { Permission } from './permissionService';

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
    const response = await axiosServices.get<RoleResponse>('/User/role');
    return response.data;
  },

  create: async (data: Partial<Role>) => {
    const response = await axiosServices.post('/User/role', {
      ...data,
      id: 0,
      rolePermissions: data.rolePermissions || []
    });
    return response.data;
  },

  update: async (data: Role) => {
    const response = await axiosServices.put('/User/role', data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await axiosServices.delete(`/User/role/${id}`);
    return response.data;
  },

  assignPermission: async (roleId: number, permissionId: number) => {
    const response = await axiosServices.post('/User/role-permission', {
      id: 0,
      roleId,
      permissionId
    });
    return response.data;
  },

  revokePermission: async (id: number) => {
    const response = await axiosServices.delete(`/User/role-permission/${id}`);
    return response.data;
  }
};

export default roleService;
