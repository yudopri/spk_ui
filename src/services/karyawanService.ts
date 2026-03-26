import axiosServices from '@/utils/axios';
import { ApiResponse } from './divisiService';

export interface Karyawan {
  id: number;
  nik: string;
  nama: string;
  jabatan: string;
  divisiId: number;
  divisi?: {
    id: number;
    namaDivisi: string;
  };
}

const karyawanService = {
  getAll: async (params: { search?: string; page?: number; pageSize?: number; sort?: string } = {}) => {
    const response = await axiosServices.get<ApiResponse<Karyawan[]>>('/Master/karyawan', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await axiosServices.get<ApiResponse<Karyawan>>(`/Master/karyawan/${id}`);
    return response.data;
  },

  create: async (data: Omit<Karyawan, 'id' | 'divisi'>) => {
    const response = await axiosServices.post<ApiResponse<Karyawan>>('/Master/karyawan', data);
    return response.data;
  },

  update: async (data: Omit<Karyawan, 'divisi'>) => {
    const response = await axiosServices.put<ApiResponse<Karyawan>>('/Master/karyawan', data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await axiosServices.delete<ApiResponse<any>>(`/Master/karyawan/${id}`);
    return response.data;
  },
};

export default karyawanService;
