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
  getAll: async (page = 1, pageSize = 10, search = ""): Promise<ApiResponse<Divisi[]>> => {
    try {
      const response = await axiosServices.get<any>("/departments", {
        params: { page, pageSize, search },
      });
      
      const rawList = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      const data = rawList.map((item: any) => ({
        ...item,
        id: Number(item.id || item.Id),
        name: item.name || item.namaDivisi || "",
        namaDivisi: item.namaDivisi || item.name || "",
      }));

      return {
        success: true,
        message: "Success",
        data,
        meta: response.data.meta || {
          total: data.length,
          page,
          pageSize,
          totalPages: Math.ceil(data.length / pageSize),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to fetch departments",
        data: [],
      };
    }
  },

  getById: async (id: number): Promise<ApiResponse<Divisi | null>> => {
    try {
      const response = await divisiService.getAll(1, 1000);
      const data = response.data.find((item) => item.id === id) || null;
      return {
        success: true,
        message: "Success",
        data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to fetch department",
        data: null
      };
    }
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    return {
      success: false,
      message: 'Endpoint create divisi belum tersedia pada API Flask terbaru.',
      data: null,
    };
  },

  update: async (id: number, data: any): Promise<ApiResponse<any>> => {
     return {
      success: false,
      message: 'Endpoint update divisi belum tersedia pada API Flask terbaru.',
      data: null,
    };
  },

  delete: async (id: number): Promise<ApiResponse<any>> => {
     return {
      success: false,
      message: 'Endpoint delete divisi belum tersedia pada API Flask terbaru.',
      data: null,
    };
  }
};

export default divisiService;
