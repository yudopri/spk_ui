import axiosServices from '@/utils/axios';

export interface Divisi {
  id: number;
  name: string;
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

export interface ApiMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: ApiMeta;
  totalCount?: number;
  page?: number;
  pageSize?: number;
}

const divisiService = {
  getAll: async () => {
    const response = await axiosServices.get<any>('/departments');
    const rawList = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

    const data = rawList.map((item: any) => ({
      ...item,
      id: Number(item.id ?? 0),
      name: item.name ?? item.department_name ?? item.namaDivisi ?? '',
      namaDivisi: item.namaDivisi ?? item.department_name ?? item.name ?? '',
    }));
    return {
        success: true,
        message: "Data retrieved",
        data
    };
  },

  getById: async (id: number) => {
    const all = await divisiService.getAll();
    const list = all.data as Divisi[];
    const data = list.find((item) => item.id === id) || null;
    return {
        success: true,
        data
    };
  },

  create: async (data: any) => {
    return {
      success: false,
      message: 'Endpoint create divisi belum tersedia pada API Flask terbaru.',
      data: null,
    };
  },

  update: async (data: any) => {
    return {
      success: false,
      message: 'Endpoint update divisi belum tersedia pada API Flask terbaru.',
      data: null,
    };
  },

  delete: async (id: number) => {
    return {
      success: false,
      message: 'Endpoint delete divisi belum tersedia pada API Flask terbaru.',
      data: null,
    };
  },
};

export default divisiService;
