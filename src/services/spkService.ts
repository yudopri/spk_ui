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
  Id: number;
  PeriodeId: number;
  Periode: {
    Id: number;
    NamaPeriode: string;
    Tahun: number;
  } | null;
  NilaiSkala: number;
  NilaiOptimasi: number;
  Ranking: number;
  Karyawan: {
    Id: number;
    Nik: string;
    Nama: string;
    Jabatan: string;
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
    const response = await axiosServices.get<any>(`/spk/ahp/perbandingan/${periodeId}`);
    const rawList = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

    const data: AhpPerbandingan[] = rawList.map((item: any) => ({
      ...item,
      id: Number(item.id ?? 0),
      periodeId: Number(item.periodeId ?? item.PeriodeId ?? periodeId),
      kpiAId: Number(item.kpiAId ?? item.KpiAId ?? item.kpi_a_id ?? 0),
      kpiBId: Number(item.kpiBId ?? item.KpiBId ?? item.kpi_b_id ?? 0),
      nilai: Number(item.nilai ?? item.Nilai ?? 1),
    }));

    return {
      success: Boolean(response.data?.success ?? true),
      data,
    };
  },

  saveAhpPerbandingan: async (payload: { PeriodeId: number; KpiAId: number; KpiBId: number; Nilai: number }[]) => {
    const response = await axiosServices.post<{ message: string; success: boolean }>('/spk/ahp/perbandingan', payload);
    return response.data;
  },

  calculateAhpWeight: async (periodeId: number) => {
    const response = await axiosServices.post<{ data: number[]; success: boolean }>(`/spk/ahp/calculate-weight/${periodeId}`);
    return response.data;
  },

  // MOORA Endpoints
  saveMooraPenilaian: async (payload: { KaryawanId: number; KpiId: number; PeriodeId: number; Nilai: number }[]) => {
    const response = await axiosServices.post<{ message: string; success: boolean }>('/spk/moora/penilaian', payload);
    return response.data;
  },

  calculateMoora: async (periodeId: number) => {
    const response = await axiosServices.post<{ message: string; success: boolean }>(`/spk/moora/calculate/${periodeId}`);
    return response.data;
  },

  // Report Endpoints
  getReport: async (periodeId: number, page = 1, pageSize = 10, lokasiKerja?: string) => {
    const response = await axiosServices.get<any>(`/spk/moora/hasil/${periodeId}`, {
      params: {
        page,
        pageSize,
        ...(lokasiKerja ? { lokasi_kerja: lokasiKerja } : {}),
      }
    });
    const rawList = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

    const mapped: SpkReport[] = rawList.map((item: any): SpkReport => ({
        Id: Number(item.Id ?? item.id ?? item.karyawan_id ?? 0),
        PeriodeId: Number(item.PeriodeId ?? item.periodeId ?? periodeId),
        Periode: item.Periode ?? null,
        NilaiSkala: Number(item.NilaiSkala ?? item.nilai_skala ?? item.nilai ?? 0),
        NilaiOptimasi: Number(item.NilaiOptimasi ?? item.nilai_optimasi ?? 0),
        Ranking: Number(item.Ranking ?? item.ranking ?? 0),
        Karyawan: item.Karyawan
          ? {
              Id: Number(item.Karyawan.Id ?? item.Karyawan.id ?? 0),
              Nik: item.Karyawan.Nik ?? item.Karyawan.nik ?? '',
              Nama: item.Karyawan.Nama ?? item.Karyawan.name ?? '',
              Jabatan: item.Karyawan.Jabatan ?? item.Karyawan.role ?? '',
            }
          : {
              Id: Number(item.karyawan_id ?? 0),
              Nik: item.nik ?? '',
              Nama: item.name ?? item.nama ?? '',
              Jabatan: item.role ?? '',
            },
      }));

    const data = mapped.sort((left, right) => left.Ranking - right.Ranking);

    return {
      success: Boolean(response.data?.success ?? true),
      message: response.data?.message || 'OK',
      data,
      totalCount: data.length,
      page,
      pageSize,
    };
  },

  // Optimized individual and summary report endpoints
  getIndividualReport: async (periodeId: number, karyawanId: number) => {
    const response = await axiosServices.get<any>(`/spk/report/individual/${periodeId}/${karyawanId}`);
    return response.data;
  },

  getSummaryReport: async (periodeId: number) => {
    const response = await axiosServices.get<any>(`/spk/report/summary/${periodeId}`);
    return response.data;
  }
};

export default spkService;
