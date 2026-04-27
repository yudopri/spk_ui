import axios from '../utils/axios';

export interface KPI {
  Id: number;
  NamaKpi: string;
  Tipe: 'Benefit' | 'Cost';
  PeriodeId: number;
  AttributeId?: number;
  attributeId?: number;
  id_satuan?: number;
  nama_satuan?: string;
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
  simbol?: string;
}

export interface Attribute {
  id: number;
  nama: string;
  simbol: string;
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
    AttributeId: Number(item.AttributeId ?? item.attributeId ?? item.id_satuan ?? 0),
    attributeId: Number(item.attributeId ?? item.AttributeId ?? item.id_satuan ?? 0),
    id_satuan: Number(item.id_satuan ?? item.attributeId ?? item.AttributeId ?? 0),
    nama_satuan: item.nama_satuan ?? item.namaSatuan ?? '',
    BobotAhp: item.BobotAhp ?? item.bobotAhp ?? null,
    Bobot: item.Bobot ?? item.bobot ?? 0,
    bobot: item.bobot ?? item.Bobot ?? item.BobotAhp ?? 0,
    Deskripsi: item.Deskripsi ?? item.deskripsi ?? '',
    deskripsi: item.deskripsi ?? item.Deskripsi ?? '',
    simbol: item.simbol ?? '',
  };
};

const kpiService = {
  getAttributes: async () => {
    const response = await axios.get('/attribute');
    return response.data;
  },

  createAttribute: async (data: { nama: string; simbol: string }) => {
    const response = await axios.post<{ success?: boolean; message?: string; data?: Attribute }>('/attribute', {
      nama: data.nama,
      simbol: data.simbol,
    });
    return response.data;
  },

  updateAttribute: async (id: number, data: { nama: string; simbol: string }) => {
    const response = await axios.put<{ success?: boolean; message?: string; data?: Attribute }>(`/attribute/${id}`, {
      nama: data.nama,
      simbol: data.simbol,
    });
    return response.data;
  },

  deleteAttribute: async (id: number) => {
    const response = await axios.delete<{ success?: boolean; message?: string }>(`/attribute/${id}`);
    return response.data;
  },

  getByPeriode: async (periodeId: number, page = 1, pageSize = 10) => {
    const response = await axios.get<any>('/kriteria', {
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

  create: async (data: { NamaKpi?: string; Tipe?: string; PeriodeId?: number; namaKpi?: string; tipe?: string; periodeId?: number; bobot?: number; deskripsi?: string; id_satuan?: number; attributeId?: number }) => {
    const response = await axios.post<{ Id?: number; success?: boolean; message?: string }>('/kriteria', {
      NamaKpi: data.NamaKpi ?? data.namaKpi,
      Tipe: data.Tipe ?? data.tipe ?? 'Benefit',
      PeriodeId: data.PeriodeId ?? data.periodeId,
      id_satuan: data.id_satuan ?? data.attributeId,
      Bobot: data.bobot ?? 0,
      Deskripsi: data.deskripsi ?? '',
    });
    return response.data;
  },

  update: async (data: Partial<KPI>) => {
    const targetId = Number(data.Id ?? data.id ?? 0);
    if (!targetId) throw new Error('ID KPI tidak ditemukan');

    const response = await axios.put<{ success?: boolean; message?: string }>(`/kriteria/${targetId}`, {
      NamaKpi: data.NamaKpi ?? data.namaKpi,
      Tipe: data.Tipe ?? data.tipe,
      PeriodeId: data.PeriodeId ?? data.periodeId,
      id_satuan: data.id_satuan ?? data.attributeId ?? data.AttributeId,
      Bobot: data.Bobot ?? data.bobot ?? 0,
      Deskripsi: data.Deskripsi ?? data.deskripsi ?? '',
    });
    return response.data;
  },

  delete: async (id: number) => {
    const response = await axios.delete<{ success?: boolean; message?: string }>(`/kriteria/${id}`);
    return response.data;
  }
};

export default kpiService;
