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

  // Logic to determine active status based on dates
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset time for date-only comparison

  const startDate = mulai ? new Date(mulai) : null;
  const endDate = selesai ? new Date(selesai) : null;

  if (startDate) startDate.setHours(0, 0, 0, 0);
  if (endDate) endDate.setHours(0, 0, 0, 0);

  let calculatedStatus = status;
  // HANYA hitung status berdasarkan tanggal jika status saat ini BUKAN 'Final'
  if (status !== 'Final' && startDate && endDate) {
    if (now >= startDate && now <= endDate) {
      calculatedStatus = 'Aktif';
    } else {
      calculatedStatus = 'Nonaktif';
    }
  }

  return {
    ...item,
    Id: id,
    id,
    NamaPeriode: item.NamaPeriode ?? item.namaPeriode ?? '',
    namaPeriode: item.namaPeriode ?? item.NamaPeriode ?? '',
    NamaDivisi: item.NamaDivisi ?? (item.divisi?.namaDivisi || item.divisi?.name || 'Semua Divisi'),
    DivisiId: item.DivisiId ?? item.divisiId ?? item.divisi?.id ?? null,
    Tahun: item.Tahun ?? item.tahun ?? (mulai ? new Date(mulai).getFullYear() : null),
    Status: calculatedStatus,
    TanggalMulai: mulai,
    tanggalMulai: mulai,
    TanggalSelesai: selesai,
    tanggalSelesai: selesai,
    isAktif: String(calculatedStatus).toLowerCase() === 'aktif' || calculatedStatus === 'Final',
    tahun: item.tahun ?? item.Tahun ?? (mulai ? new Date(mulai).getFullYear() : new Date().getFullYear()),
    divisiId: item.divisiId ?? item.DivisiId ?? item.dept_id ?? null,
    divisi: item.divisi
      ? {
          id: item.divisi.id ?? null,
          namaDivisi: item.divisi.namaDivisi ?? item.divisi.name ?? 'Semua Divisi',
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

    // Logic to determine status based on dates
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const mulai = data.TanggalMulai ?? data.tanggalMulai;
    const selesai = data.TanggalSelesai ?? data.tanggalSelesai;
    const startDate = mulai ? new Date(mulai) : null;
    const endDate = selesai ? new Date(selesai) : null;
    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(0, 0, 0, 0);

    let calculatedStatus = data.Status || (data.isAktif ? 'Aktif' : 'Nonaktif');
    if (startDate && endDate) {
      calculatedStatus = (now >= startDate && now <= endDate) ? 'Aktif' : 'Nonaktif';
    }

    const response = await axios.post<{ Id?: number; success?: boolean; message?: string }>('/spk/periode', {
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

    // Logic to determine status based on dates
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const mulai = data.TanggalMulai ?? data.tanggalMulai;
    const selesai = data.TanggalSelesai ?? data.tanggalSelesai;
    const startDate = mulai ? new Date(mulai) : null;
    const endDate = selesai ? new Date(selesai) : null;
    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(0, 0, 0, 0);

    let calculatedStatus = data.Status || (data.isAktif ? 'Aktif' : 'Nonaktif');
    if (startDate && endDate) {
      calculatedStatus = (now >= startDate && now <= endDate) ? 'Aktif' : 'Nonaktif';
    }

    const response = await axios.put<{ success?: boolean; message?: string }>(`/spk/periode/${targetId}`, {
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
    const response = await axios.delete<{ success?: boolean; message?: string }>(`/spk/periode/${id}`);
    return response.data;
  }
};

export default periodeService;
