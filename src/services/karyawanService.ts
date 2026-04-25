import axiosServices from '@/utils/axios';
import { ApiResponse } from './divisiService';

export interface Karyawan {
  id: number;
  name: string;
  nik: string;
  email?: string;
  departemen_id?: number | null;
  department_name?: string;
  lokasi_kerja?: string | null;
  role?: string;
  nama: string;
  jabatan?: string;
  divisiId?: number;
  divisi?: {
    id: number;
    namaDivisi: string;
  };
}

const karyawanService = {
  getAll: async (params: { dept_id?: number; jabatan_id?: number } = {}) => {
    const response = await axiosServices.get<any>('/employees', {
      params: {
        ...(params.dept_id ? { dept_id: params.dept_id } : {}),
      },
    });
    const rawList = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

    const data = rawList.map((item: any) => ({
      ...item,
      id: Number(item.id ?? 0),
      name: item.name ?? item.nama ?? '',
      nama: item.nama ?? item.name ?? '',
      nik: item.nik ?? '',
      email: item.email ?? '',
      departemen_id: item.departemen_id ?? item.dept_id ?? null,
      department_name: item.department_name ?? item.nama_departemen ?? '',
      lokasi_kerja: item.lokasi_kerja ?? null,
      role: item.role ?? item.jabatan ?? '',
      jabatan: item.jabatan ?? item.role ?? '',
      divisiId: item.departemen_id ?? item.dept_id ?? params.dept_id ?? 0,
    }));
    return {
        success: true,
        data
    };
  },

  getById: async (id: number) => {
    const all = await karyawanService.getAll();
    const found = all.data.find((item: any) => item.id === id) || null;
    return {
        success: true,
        data: found
    };
  },

  create: async (data: Omit<Karyawan, 'id' | 'divisi'>) => {
    return {
      success: false,
      message: 'Endpoint create karyawan belum tersedia pada API Flask terbaru.',
      data: null,
    } as ApiResponse<any>;
  },

  update: async (data: Omit<Karyawan, 'divisi'>) => {
    return {
      success: false,
      message: 'Endpoint update karyawan belum tersedia pada API Flask terbaru.',
      data: null,
    } as ApiResponse<any>;
  },

  delete: async (id: number) => {
    return {
      success: false,
      message: 'Endpoint delete karyawan belum tersedia pada API Flask terbaru.',
      data: null,
    } as ApiResponse<any>;
  },
};

export default karyawanService;
