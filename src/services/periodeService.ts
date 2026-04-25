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
    Status: status,
    TanggalMulai: mulai,
    tanggalMulai: mulai,
    TanggalSelesai: selesai,
    tanggalSelesai: selesai,
    isAktif: String(status).toLowerCase() === 'aktif',
    tahun: item.tahun ?? (mulai ? new Date(mulai).getFullYear() : new Date().getFullYear()),
    divisiId: item.divisiId ?? item.dept_id ?? null,
    divisi: item.divisi
      ? {
          id: Number(item.divisi.id ?? 0),
          namaDivisi: item.divisi.namaDivisi ?? item.divisi.name ?? '',
        }
      : null,
  };
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
    const response = await axios.post<{ Id?: number; success?: boolean; message?: string }>('/spk/periode', {
      NamaPeriode: data.NamaPeriode,
      TanggalMulai: data.TanggalMulai,
      TanggalSelesai: data.TanggalSelesai,
      Status: data.Status || (data.isAktif ? 'Aktif' : 'Nonaktif')
    });
    return response.data;
  },

  update: async (data: Partial<Periode>) => {
    throw new Error('Endpoint update periode belum tersedia pada backend SPK terbaru (hanya GET/POST).');
  },

  delete: async (id: number) => {
    throw new Error('Endpoint delete periode belum tersedia pada backend SPK terbaru (hanya GET/POST).');
  }
};

export default periodeService;
