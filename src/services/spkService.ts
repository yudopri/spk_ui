import axiosServices from '@/utils/axios';

export interface AhpPerbandingan {
  id: number;
  periodeId: number;
  periode: {
    id: number;
    namaPeriode: string;
    tahun: number;
  } | null;
  kpiAId: number;
  kpiA: {
    id: number;
    namaKpi: string;
  } | null;
  kpiBId: number;
  kpiB: {
    id: number;
    namaKpi: string;
  } | null;
  nilai: number;
}

export interface MooraPenilaian {
  id: number;
  periodeId: number;
  periode: {
    id: number;
    namaPeriode: string;
    tahun: number;
  } | null;
  karyawanId: number;
  karyawan: {
    id: number;
    nik: string;
    nama: string;
  } | null;
  kpiId: number;
  kpi: {
    id: number;
    namaKpi: string;
    tipe: string;
  } | null;
  nilai: number;
}

export interface SpkReport {
  id: number;
  periodeId: number;
  periode: {
    id: number;
    namaPeriode: string;
    tahun: number;
  } | null;
  nilaiSkala: number;
  nilaiOptimasi: number;
  ranking: number;
  karyawan: {
    id: number;
    nik: string;
    nama: string;
    jabatan: string;
  } | null;
}

export interface ReportResponse {
  success: boolean;
  message: string;
  data: SpkReport[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ApiBaseResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

const spkService = {
  // AHP Endpoints
  getAhpPerbandingan: async (periodeId: number) => {
    const response = await axiosServices.get<ApiBaseResponse<AhpPerbandingan[]>>(`/Spk/ahp/perbandingan/${periodeId}`);
    return response.data;
  },

  saveAhpPerbandingan: async (payload: Partial<AhpPerbandingan>[]) => {
    const response = await axiosServices.post<ApiBaseResponse<null>>('/Spk/ahp/perbandingan', payload);
    return response.data;
  },

  deleteAhpPerbandingan: async (periodeId: number) => {
    const response = await axiosServices.delete<ApiBaseResponse<null>>(`/Spk/ahp/perbandingan/${periodeId}`);
    return response.data;
  },

  calculateAhpWeight: async (periodeId: number) => {
    const response = await axiosServices.post<ApiBaseResponse<null>>(`/Spk/ahp/calculate-weight/${periodeId}`);
    return response.data;
  },

  // MOORA Endpoints
  getMooraPenilaian: async (periodeId: number, karyawanId?: number) => {
    const url = karyawanId 
      ? `/Spk/moora/penilaian/${periodeId}?karyawanId=${karyawanId}`
      : `/Spk/moora/penilaian/${periodeId}`;
    const response = await axiosServices.get<ApiBaseResponse<MooraPenilaian[]>>(url);
    return response.data;
  },

  saveMooraPenilaian: async (payload: Partial<MooraPenilaian>[]) => {
    const response = await axiosServices.post<ApiBaseResponse<null>>('/Spk/moora/penilaian', payload);
    return response.data;
  },

  deleteMooraPenilaian: async (periodeId: number, karyawanId: number) => {
    const response = await axiosServices.delete<ApiBaseResponse<null>>(`/Spk/moora/penilaian/${periodeId}/${karyawanId}`);
    return response.data;
  },

  calculateMoora: async (periodeId: number) => {
    const response = await axiosServices.post<ApiBaseResponse<null>>(`/Spk/moora/calculate/${periodeId}`);
    return response.data;
  },

  // Report Endpoints
  getReport: async (periodeId: number, page = 1, pageSize = 10) => {
    const response = await axiosServices.get<ReportResponse>(`/Spk/report/${periodeId}`, {
      params: { page, pageSize }
    });
    return response.data;
  }
};

export default spkService;
