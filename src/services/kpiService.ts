import axios from '../utils/axios';
import { Periode } from './periodeService';

export interface KPI {
  Id: number;
  NamaKpi: string;
  Tipe: 'Benefit' | 'Cost';
  PeriodeId: number;
  BobotAhp?: number | null;
  Bobot?: number;
  Deskripsi?: string;
  bobot?: number;
  deskripsi?: string;
  periodeId?: number;
  tipe?: 'Benefit' | 'Cost';
  // UI legacy fields
  id: number;
  namaKpi: string;
}

const normalizeKpi = (item: any): KPI => {
  const id = Number(item.Id ?? item.id ?? 0);
  const tipe = (item.Tipe ?? item.tipe ?? 'Benefit') as 'Benefit' | 'Cost';
  return {
    ...item,
    Id: id,
    id,
    NamaKpi: item.NamaKpi ?? item.namaKpi ?? '',
    namaKpi: item.namaKpi ?? item.NamaKpi ?? '',
    Tipe: tipe,
    tipe,
    PeriodeId: Number(item.PeriodeId ?? item.periodeId ?? 0),
    periodeId: Number(item.periodeId ?? item.PeriodeId ?? 0),
    BobotAhp: item.BobotAhp ?? item.bobotAhp ?? null,
    Bobot: item.Bobot ?? item.bobot ?? 0,
    bobot: item.bobot ?? item.Bobot ?? item.BobotAhp ?? 0,
    Deskripsi: item.Deskripsi ?? item.deskripsi ?? '',
    deskripsi: item.deskripsi ?? item.Deskripsi ?? '',
  };
};

const kpiService = {
  getByPeriode: async (periodeId: number, page = 1, pageSize = 10) => {
    const response = await axios.get<any>('/spk/kpi', {
      params: { periode_id: periodeId }
    });

    const rawList = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

    const mapped = rawList.map(normalizeKpi);
    const start = (page - 1) * pageSize;
    const paged = mapped.slice(start, start + pageSize);

    return {
      success: true,
      data: paged,
      totalCount: mapped.length,
      page,
      pageSize,
    };
  },

  create: async (data: { NamaKpi?: string; Tipe?: string; PeriodeId?: number; namaKpi?: string; tipe?: string; periodeId?: number; bobot?: number; deskripsi?: string }) => {
    const response = await axios.post<{ Id?: number; success?: boolean; message?: string }>('/spk/kpi', {
      NamaKpi: data.NamaKpi ?? data.namaKpi,
      Tipe: data.Tipe ?? data.tipe ?? 'Benefit',
      PeriodeId: data.PeriodeId ?? data.periodeId,
      Bobot: data.bobot ?? 0,
      Deskripsi: data.deskripsi ?? '',
    });
    return response.data;
  },

  update: async (data: Partial<KPI>) => {
    throw new Error('Endpoint update KPI belum tersedia pada backend SPK terbaru (hanya GET/POST).');
  },

  delete: async (id: number) => {
    throw new Error('Endpoint delete KPI belum tersedia pada backend SPK terbaru (hanya GET/POST).');
  }
};

export default kpiService;
