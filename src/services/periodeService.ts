import axios from '../utils/axios';

export interface KPI {
  id: number;
  periodeId: number;
  namaKpi: string;
  deskripsi: string;
  tipe: string;
  bobot: number;
}

export interface Periode {
  id: number;
  namaPeriode: string;
  tahun: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  isAktif?: boolean;
  divisiId: number;
  divisi?: {
    id: number;
    namaDivisi: string;
  };
  kpis?: KPI[];
}

export interface PeriodeResponse {
  success: boolean;
  message: string;
  data: Periode[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const periodeService = {
  getAll: async (page = 1, pageSize = 10, search = '') => {
    const response = await axios.get<PeriodeResponse>('/Master/periode', {
      params: { page, pageSize, search }
    });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await axios.get<{ success: boolean; message: string; data: Periode }>(`/Master/periode/${id}`);
    return response.data;
  },

  create: async (data: Partial<Periode>) => {
    const response = await axios.post<{ success: boolean; message: string; data: Periode }>('/Master/periode', data);
    return response.data;
  },

  update: async (data: Partial<Periode>) => {
    const response = await axios.put<{ success: boolean; message: string; data: Periode }>('/Master/periode', data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await axios.delete<{ success: boolean; message: string }>(`/Master/periode/${id}`);
    return response.data;
  }
};

export default periodeService;
