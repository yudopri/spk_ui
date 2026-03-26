import axiosServices from '@/utils/axios';

export interface Divisi {
  id: number;
  namaDivisi: string;
  karyawanCount?: number;
  periodeCount?: number;
}

export interface DivisiDetail extends Divisi {
  karyawans: {
    id: number;
    nik: string;
    nama: string;
    jabatan: string;
  }[];
  periodes: {
    id: number;
    namaPeriode: string;
    tahun: number;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  totalCount?: number;
  page?: number;
  pageSize?: number;
}

const divisiService = {
  getAll: async (params: { search?: string; page?: number; pageSize?: number; sort?: string } = {}) => {
    const response = await axiosServices.get<ApiResponse<Divisi[]>>('/Master/divisi', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await axiosServices.get<ApiResponse<DivisiDetail>>(`/Master/divisi/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await axiosServices.post<ApiResponse<any>>('/Master/divisi', data);
    return response.data;
  },

  update: async (data: any) => {
    const response = await axiosServices.put<ApiResponse<any>>('/Master/divisi', data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await axiosServices.delete<ApiResponse<any>>(`/Master/divisi/${id}`);
    return response.data;
  },
};

export default divisiService;
