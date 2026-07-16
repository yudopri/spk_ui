import axiosServices from '@/utils/axios';
import { ApiResponse } from './divisiService';

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
  userId: number;
  email: string;
  name: string;
  action: string;
  entityName: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastLogin: string | null;
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

  getAuditLogs: async (page = 1, pageSize = 10, search = '', sort = 'CreatedAt:desc', filter = {}): Promise<ApiResponse<AuditLog[]>> => {
    const response = await axiosServices.get<any>('/auth/audit-logs', {
      params: { 
        page, 
        pageSize, 
        search,
        sort,
        filter: JSON.stringify(filter)
      }
    });
    
    const mappedData = (response.data.data || []).map((item: any) => ({
      id: item.Id,
      userId: item.UserId,
      email: item.Email || '',
      name: item.Name || '-',
      action: item.Action || '',
      entityName: item.EntityName || '',
      details: item.Details || '',
      ipAddress: item.IpAddress || '',
      userAgent: item.UserAgent || '',
      createdAt: item.CreatedAt || new Date().toISOString(),
      lastLogin: item.last_login ?? null,
    }));
    
    return {
      success: true,
      message: 'Success',
      data: mappedData,
      meta: response.data.meta
    };
  }
};

export default developerService;