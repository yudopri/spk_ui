import axiosServices from '@/utils/axios';
import { Role } from './roleService';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface UserResponse {
  success: boolean;
  message?: string;
  data: User[];
}

const userService = {
  getAll: async () => {
    const response = await axiosServices.get<UserResponse>('/auth/users');
    return response.data;
  },

  getById: async (id: number) => {
    // Note: Endpoint for specific user by ID in /auth/users listing might be different or not needed for basic sync
    const res = await axiosServices.get<UserResponse>('/auth/users');
    const user = res.data?.data?.find(u => u.id === id);
    return { success: true, data: user };
  },

  create: async (data: Partial<User>) => {
    throw new Error('Penambahan user dilakukan melalui sistem SIP (Mitra).');
  },

  update: async (data: User) => {
    throw new Error('Perubahan user dilakukan melalui sistem SIP (Mitra).');
  },

  delete: async (id: number) => {
    throw new Error('Penghapusan user dilakukan melalui sistem SIP (Mitra).');
  }
};

export default userService;
