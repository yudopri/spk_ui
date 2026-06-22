import axiosServices from '@/utils/axios';
import { ApiResponse } from './divisiService';

export interface Periode {
  id: number;
  Id: number;
  namaPeriode: string;
  NamaPeriode: string;
  tahun: number;
  Tahun: number;
  divisiId: number;
  DivisiId: number;
  tanggalMulai: string;
  TanggalMulai: string;
  tanggalSelesai: string;
  TanggalSelesai: string;
  status: string;
  Status: string;
  isAktif: boolean;
  lockStatus?: 'draft' | 'open' | 'processed' | 'locked';
  NamaDivisi?: string;
  divisi?: {
    id: number;
    namaDivisi: string;
  } | null;
}

const normalizePeriode = (item: any): Periode => {
  const id = Number(item.Id ?? item.id ?? 0);
  const status = String(item.Status ?? item.status ?? 'draft').toLowerCase();
  const lockStatus = ['draft', 'open', 'processed', 'locked'].includes(status) ? status as any : 'draft';
  const isAktif = lockStatus === 'open';
  
  return {
    ...item,
    id,
    Id: id,
    namaPeriode: item.NamaPeriode ?? item.namaPeriode ?? '',
    NamaPeriode: item.NamaPeriode ?? item.namaPeriode ?? '',
    tahun: Number(item.Tahun ?? item.tahun ?? 0),
    Tahun: Number(item.Tahun ?? item.tahun ?? 0),
    divisiId: Number(item.DivisiId ?? item.divisiId ?? 0),
    DivisiId: Number(item.DivisiId ?? item.divisiId ?? 0),
    tanggalMulai: item.TanggalMulai ?? item.tanggalMulai ?? '',
    TanggalMulai: item.TanggalMulai ?? item.tanggalMulai ?? '',
    tanggalSelesai: item.TanggalSelesai ?? item.tanggalSelesai ?? '',
    TanggalSelesai: item.TanggalSelesai ?? item.tanggalSelesai ?? '',
    status: lockStatus,
    Status: lockStatus,
    isAktif,
    lockStatus,
    NamaDivisi: item.NamaDivisi ?? item.namaDivisi ?? item.divisi?.namaDivisi ?? '',
    divisi: item.divisi || null
  };
};

const toNullableInt = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
};

const periodeService = {
  getAll: async (page = 1, pageSize = 10, search = '', sort = '', filter = {}): Promise<ApiResponse<Periode[]>> => {
    const response = await axiosServices.get<any>('/spk/periode', {
      params: {
        page,
        pageSize,
        search,
        sort,
        filter: JSON.stringify(filter),
      },
    });

    const rawList = response.data.data || [];
    const meta = response.data.meta;
    const mapped = rawList.map(normalizePeriode);

    return {
      success: true,
      message: 'Success',
      data: mapped,
      meta,
    };
  },

  getById: async (id: number): Promise<ApiResponse<Periode | null>> => {
    const all = await periodeService.getAll(1, 1000);
    const found = all.data.find((p: Periode) => p.Id === id || p.id === id) || null;
    return { success: true, message: 'Success', data: found };
  },

  create: async (data: Partial<Periode>) => {
    const tahunRaw = data.Tahun ?? data.tahun;
    const divisiRaw = data.DivisiId ?? data.divisiId;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const mulai = data.TanggalMulai ?? data.tanggalMulai;
    const selesai = data.TanggalSelesai ?? data.tanggalSelesai;
    const startDate = mulai ? new Date(mulai) : null;
    const endDate = selesai ? new Date(selesai) : null;
    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(0, 0, 0, 0);

    let calculatedStatus = String(data.Status || data.status || (data.isAktif ? 'open' : 'draft')).toLowerCase();
    if (startDate && endDate && calculatedStatus !== 'locked') {
      calculatedStatus = (now >= startDate && now <= endDate) ? 'open' : 'draft';
    }

    const response = await axiosServices.post<{ Id?: number; success?: boolean; message?: string }>('/spk/periode', {
      NamaPeriode: data.NamaPeriode ?? data.namaPeriode,
      Tahun: toNullableInt(tahunRaw),
      DivisiId: toNullableInt(divisiRaw),
      TanggalMulai: mulai,
      TanggalSelesai: selesai,
      Status: calculatedStatus,
    });
    return response.data;
  },

  update: async (data: Partial<Periode>) => {
    const targetId = Number(data.Id ?? data.id ?? 0);
    if (!targetId) throw new Error('ID periode tidak ditemukan.');

    const tahunRaw = data.Tahun ?? data.tahun;
    const divisiRaw = data.DivisiId ?? data.divisiId;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const mulai = data.TanggalMulai ?? data.tanggalMulai;
    const selesai = data.TanggalSelesai ?? data.tanggalSelesai;
    const startDate = mulai ? new Date(mulai) : null;
    const endDate = selesai ? new Date(selesai) : null;
    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(0, 0, 0, 0);

    let calculatedStatus = String(data.Status || data.status || (data.isAktif ? 'open' : 'draft')).toLowerCase();
    if (startDate && endDate && calculatedStatus !== 'locked') {
      calculatedStatus = (now >= startDate && now <= endDate) ? 'open' : 'draft';
    }

    const response = await axiosServices.put<{ success?: boolean; message?: string }>(`/spk/periode/${targetId}`, {
      NamaPeriode: data.NamaPeriode ?? data.namaPeriode,
      Tahun: toNullableInt(tahunRaw),
      DivisiId: toNullableInt(divisiRaw),
      TanggalMulai: mulai,
      TanggalSelesai: selesai,
      Status: calculatedStatus,
    });

    return response.data;
  },

  delete: async (id: number) => {
    const response = await axiosServices.delete<{ success?: boolean; message?: string }>(`/spk/periode/${id}`);
    return response.data;
  }
};

export default periodeService;
