import axiosServices from '@/utils/axios';
import { Role } from './roleService';

export interface User {
  id: number;
  username: string;
  password?: string; // For POST/PUT
  passwordHash?: string; // From API
  roleId: number;
  role?: Role | null;
  refreshToken?: string;
  refreshTokenExpiry?: string;
}

export interface UserResponse {
  success: boolean;
  message?: string;
  data: User[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const userService = {
  getAll: async (page = 1, pageSize = 10, search = '') => {
    const response = await axiosServices.get<UserResponse>('/User', {
      params: { page, pageSize, search }
    });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await axiosServices.get<{success: boolean, data: User}>(`/User/${id}`);
    return response.data;
  },

  create: async (data: Partial<User>) => {
    const response = await axiosServices.post('/User', {
      ...data,
      id: 0
    });
    return response.data;
  },

  update: async (data: User) => {
    const response = await axiosServices.put('/User', data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await axiosServices.delete(`/User/${id}`);
    return response.data;
  }
};

export default userService;
