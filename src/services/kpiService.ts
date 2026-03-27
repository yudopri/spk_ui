import axios from '../utils/axios';
import { Periode } from './periodeService';

export interface KPI {
  id: number;
  periodeId: number;
  namaKpi: string;
  deskripsi: string;
  tipe: string;
  bobot: number;
  bobotAhp: number | null;
  periode?: Partial<Periode>;
}

export interface KPIResponse {
  success: boolean;
  message: string;
  data: KPI[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const kpiService = {
  getByPeriode: async (periodeId: number, page = 1, pageSize = 10, search = '') => {
    const response = await axios.get<KPIResponse>(`/Master/kpi/${periodeId}`, {
      params: { page, pageSize, search }
    });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await axios.get<{ success: boolean; message: string; data: KPI }>(`/Master/kpi-detail/${id}`);
    return response.data;
  },

  create: async (data: Partial<KPI>) => {
    const response = await axios.post<{ success: boolean; message: string; data: KPI }>('/Master/kpi', data);
    return response.data;
  },

  update: async (data: Partial<KPI>) => {
    const response = await axios.put<{ success: boolean; message: string; data: KPI }>('/Master/kpi', data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await axios.delete<{ success: boolean; message: string }>(`/Master/kpi/${id}`);
    return response.data;
  }
};

export default kpiService;
