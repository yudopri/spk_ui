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
  Id: number;
  NamaPeriode: string;
  DivisiId: number;
  NamaDivisi: string;
  Tahun?: number | null;
  Status: string;
  TanggalMulai: string;
  TanggalSelesai: string;
  id?: number;
  namaPeriode?: string;
  tahun?: number;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  divisi?: {
    id: number;
    namaDivisi: string;
  } | null;
  // UI legacy fields (optional for compatibility)
  isAktif?: boolean;
  divisiId?: number;
}

const normalizePeriode = (item: any): Periode => {
  const mulai = item.TanggalMulai ?? item.tanggalMulai ?? '';
  const selesai = item.TanggalSelesai ?? item.tanggalSelesai ?? '';
  const status = item.Status ?? item.status ?? 'Nonaktif';
  const id = Number(item.Id ?? item.id ?? 0);

  return {
    ...item,
    Id: id,
    id,
    NamaPeriode: item.NamaPeriode ?? item.namaPeriode ?? '',
    namaPeriode: item.namaPeriode ?? item.NamaPeriode ?? '',
    NamaDivisi: item.NamaDivisi ?? (item.divisi?.namaDivisi || item.divisi?.name || ''),
    DivisiId: Number(item.DivisiId ?? item.divisiId ?? item.divisi?.id ?? 0),
    Tahun: item.Tahun ?? item.tahun ?? (mulai ? new Date(mulai).getFullYear() : null),
    Status: status,
    TanggalMulai: mulai,
    tanggalMulai: mulai,
    TanggalSelesai: selesai,
    tanggalSelesai: selesai,
    isAktif: String(status).toLowerCase() === 'aktif',
    tahun: item.tahun ?? item.Tahun ?? (mulai ? new Date(mulai).getFullYear() : new Date().getFullYear()),
    divisiId: Number(item.divisiId ?? item.DivisiId ?? item.dept_id ?? 0),
    divisi: item.divisi
      ? {
          id: Number(item.divisi.id ?? 0),
          namaDivisi: item.divisi.namaDivisi ?? item.divisi.name ?? '',
        }
      : null,
  };
};

const toNullableInt = (value: unknown): number | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const periodeService = {
  getAll: async (page = 1, pageSize = 100, search = '') => {
    const response = await axios.get<any>('/spk/periode', {
      params: {
        ...(search ? { search } : {}),
      },
    });

    const rawList = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

    const mapped = rawList.map(normalizePeriode);
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

  getById: async (id: number) => {
    const all = await periodeService.getAll(1, 1000);
    const found = all.data.find((p: Periode) => p.Id === id || p.id === id) || null;
    return { success: true, data: found };
  },

  create: async (data: Partial<Periode>) => {
    const tahunRaw = data.Tahun ?? data.tahun;
    const divisiRaw = data.DivisiId ?? data.divisiId;
    const response = await axios.post<{ Id?: number; success?: boolean; message?: string }>('/spk/periode', {
      NamaPeriode: data.NamaPeriode ?? data.namaPeriode,
      Tahun: toNullableInt(tahunRaw),
      DivisiId: toNullableInt(divisiRaw),
      TanggalMulai: data.TanggalMulai ?? data.tanggalMulai,
      TanggalSelesai: data.TanggalSelesai ?? data.tanggalSelesai,
      Status: data.Status || (data.isAktif ? 'Aktif' : 'Nonaktif'),
    });
    return response.data;
  },

  update: async (data: Partial<Periode>) => {
    const targetId = Number(data.Id ?? data.id ?? 0);
    if (!targetId) throw new Error('ID periode tidak ditemukan.');

    const tahunRaw = data.Tahun ?? data.tahun;
    const divisiRaw = data.DivisiId ?? data.divisiId;

    const response = await axios.put<{ success?: boolean; message?: string }>(`/spk/periode/${targetId}`, {
      NamaPeriode: data.NamaPeriode ?? data.namaPeriode,
      Tahun: toNullableInt(tahunRaw),
      DivisiId: toNullableInt(divisiRaw),
      TanggalMulai: data.TanggalMulai ?? data.tanggalMulai,
      TanggalSelesai: data.TanggalSelesai ?? data.tanggalSelesai,
      Status: data.Status || (data.isAktif ? 'Aktif' : 'Nonaktif'),
    });

    return response.data;
  },

  delete: async (id: number) => {
    const response = await axios.delete<{ success?: boolean; message?: string }>(`/spk/periode/${id}`);
    return response.data;
  }
};

export default periodeService;
