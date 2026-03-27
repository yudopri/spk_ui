import axiosServices from '@/utils/axios';

export interface AhpDebugData {
  matrix: number[][];
  weights: number[];
  ci: number;
  cr: number;
  isConsistent: boolean;
  kpis: {
    id: number;
    namaKpi: string;
    bobot: number;
  }[];
  comparisons: {
    id: number;
    kpiAId: number;
    kpiAName: string;
    kpiBId: number;
    kpiBName: string;
    nilai: number;
  }[];
}

export interface MooraDebugData {
  kpis: {
    id: number;
    namaKpi: string;
    tipe: string;
    bobot: number;
  }[];
  evaluations: {
    id: number;
    karyawanId: number;
    kpiId: number;
    nilai: number;
    karyawan: {
      id: number;
      nama: string;
      nik: string;
    };
    kpi: {
      id: number;
      namaKpi: string;
      tipe: string;
    };
  }[];
  karyawanCount: number;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  userId: number;
  username: string;
  action: string;
  entityName: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogResponse {
  success: boolean;
  message: string;
  data: AuditLog[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ApiBaseResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

const developerService = {
  getAhpDebug: async (periodeId: number) => {
    const response = await axiosServices.get<ApiBaseResponse<AhpDebugData>>(`/Developer/ahp-debug/${periodeId}`);
    return response.data;
  },

  getMooraDebug: async (periodeId: number) => {
    const response = await axiosServices.get<ApiBaseResponse<MooraDebugData>>(`/Developer/moora-debug/${periodeId}`);
    return response.data;
  },

  getAuditLogs: async (page = 1, pageSize = 10, search = '') => {
    const response = await axiosServices.get<AuditLogResponse>('/Developer/audit-logs', {
      params: { page, pageSize, search }
    });
    return response.data;
  }
};

export default developerService;