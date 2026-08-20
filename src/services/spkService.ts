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
  cr?: number;
}

export interface AhpWeightResult {
  id: number;
  weight: number;
  nama?: string;
}

export interface MooraDetailRow {
  kpiId: number;
  kpiNama?: string;
  nilaiAsli?: number;
  target?: number;
  achievement?: number;
  nilai_normalisasi?: number;
  nilai_terbobot?: number;
  bobot_ahp?: number;
  bobot_group?: number;
  bobot_global?: number;
  tipe?: string;
  yi?: number;
  rank?: number;
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
  // New camelCase fields for flattened response
  id?: number;
  nama?: string;
  totalScore?: number;
  nilai_akhir?: number;
  rank?: number;
  nik?: string;
  Status?: string;
  status?: string;
  divisi?: string;
  Divisi?: string;
  nilai_yi?: number;
  NilaiYi?: number;
  persentase_kpi?: number;
  PersentaseKPI?: number;
  achievement?: number;
  Achievement?: number;
  predikat?: string;
  Predikat?: string;
  lokasi?: string;
  Lokasi?: string;
  weight_ahp?: number;
  weight_group?: number;
  weight_global?: number;

  // Existing PascalCase fields
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
  Catatan?: any;
  catatan?: any;
  Karyawan: {
    Id: number;
    id?: number;
    Nik: string;
    nik?: string;
    Nama: string;
    name?: string;
    Jabatan: string;
    jabatan?: string;
    Divisi?: string;
    divisi?: string;
    DivisiId?: number;
    divisiId?: number;
    Lokasi?: string;
    lokasi?: string;
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
  getAhpGroupPerbandingan: async (periodeId: number) => {
    const response = await axiosServices.get<{ success: boolean; data: any }>(`/spk/ahp-group/perbandingan/${periodeId}`);
    return response.data;
  },

  saveAhpGroupPerbandingan: async (periodeId: number, comparisons: { id_a: number; id_b: number; nilai: number }[]) => {
    const response = await axiosServices.post<{ message: string; success: boolean }>(`/spk/ahp-group/perbandingan/${periodeId}`, {
      comparisons: comparisons.map(c => ({
        group_a_id: c.id_a,
        group_b_id: c.id_b,
        nilai: c.nilai
      }))
    });
    return response.data;
  },

  getAhpPerbandingan: async (periodeId: number, groupId?: number) => {
    const response = await axiosServices.get<any>(`/spk/ahp/perbandingan/${periodeId}`, {
      params: { group_id: groupId }
    });
    const rawList = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

    const data: AhpPerbandingan[] = rawList.map((item: any) => ({
      ...item,
      id: Number(item.id ?? 0),
      periodeId: Number(item.periodeId ?? item.PeriodeId ?? periodeId),
      kpiAId: Number(item.kpiAId ?? item.KpiAId ?? item.kpi_a_id ?? item.groupIdA ?? 0),
      kpiBId: Number(item.kpiBId ?? item.KpiBId ?? item.kpi_b_id ?? item.groupIdB ?? 0),
      nilai: Number(item.nilai ?? item.Nilai ?? 1),
    }));

    return {
      success: Boolean(response.data?.success ?? true),
      data,
    };
  },

  saveAhpPerbandingan: async (payload: { PeriodeId: number; KpiAId?: number; KpiBId?: number; GroupIdA?: number; GroupIdB?: number; Nilai: number }[]) => {
    const response = await axiosServices.post<{ message: string; success: boolean }>('/spk/ahp/perbandingan', payload);
    return response.data;
  },

  calculateAhpWeight: async (periodeId: number, groupId?: number) => {
    const response = await axiosServices.post<{ message?: string; data: any; success: boolean; consistency?: any }>(`/spk/ahp/calculate-weight/${periodeId}`, {
      group_id: groupId
    });
    return response.data;
  },

  // MOORA Endpoints
  saveMooraPenilaian: async (payload: { KaryawanId: number; KpiId: number; PeriodeId: number; Nilai: number }[]) => {
    const response = await axiosServices.post<{ message: string; success: boolean }>('/spk/moora/penilaian', payload);
    return response.data;
  },

  saveMooraRealisasi: async (payload: { KaryawanId: number; KpiId: number; PeriodeId: number; Realisasi: number }[]) => {
    const response = await axiosServices.post<{ message: string; success: boolean }>('/spk/moora/penilaian', payload);
    return response.data;
  },

  calculateMoora: async (periodeId: number) => {
    const response = await axiosServices.post<{ message: string; success: boolean }>(`/spk/moora/calculate/${periodeId}`);
    return response.data;
  },

  // Report Endpoints
  getReport: async (periodeId: number, page = 1, pageSize = 10, search = '', sort = '', filter = {}, groupId?: number) => {
    const response = await axiosServices.get<any>(`/spk/moora/hasil/${periodeId}`, {
      params: {
        page,
        pageSize,
        search,
        sort,
        filter: JSON.stringify(filter),
        group_id: groupId,
      }
    });

    const rawList = response.data.data || [];
    const meta = response.data.meta;

    const mapped: SpkReport[] = rawList.map((item: any): SpkReport => {
        // Prefer backend snapshot fields; only fall back to derived averages when snapshot is absent.
        const details = item.catatan?.details || [];
        const avgAchievement = details.length > 0
          ? details.reduce((sum: number, d: any) => sum + Number(d.achievement ?? d.Achievement ?? 0), 0) / details.length
          : 0;
        const computedAchievement = Number(
          item.achievement ??
          item.Achievement ??
          item.persentase_kpi ??
          item.PersentaseKPI ??
          (avgAchievement > 0 ? avgAchievement : 0)
        );

        // Derive predikat from achievement percentage
        const derivePredikat = (pct: number): string => {
          if (pct >= 90) return "Sangat Baik";
          if (pct >= 80) return "Baik";
          if (pct >= 70) return "Cukup";
          if (pct >= 60) return "Kurang";
          return "Sangat Kurang";
        };
        const computedPredikat = item.predikat ?? item.Predikat ?? (computedAchievement > 0 ? derivePredikat(computedAchievement) : "");

        return {
        id: Number(item.id ?? item.Id ?? item.karyawan_id ?? 0),
        rank: Number(item.rank ?? item.Ranking ?? item.ranking ?? 0),
        nama: item.nama || item.name || item.Karyawan?.Nama || item.Karyawan?.name || "Tanpa Nama",
        totalScore: Number(item.totalScore ?? item.nilai_akhir ?? item.NilaiSkala ?? item.nilai ?? 0),
        nilai_akhir: Number(item.nilai_akhir ?? item.totalScore ?? item.NilaiSkala ?? item.nilai ?? 0),
        nik: item.nik ?? item.Karyawan?.nik ?? item.Karyawan?.Nik ?? "-",
        divisi: item.divisi ?? item.Divisi ?? item.Karyawan?.Divisi ?? item.Karyawan?.divisi ?? item.nama_divisi ?? item.NamaDivisi ?? "",
        Divisi: item.Divisi ?? item.divisi ?? item.Karyawan?.Divisi ?? item.Karyawan?.divisi ?? item.nama_divisi ?? item.NamaDivisi ?? "",
        nilai_yi: Number(item.nilai_yi ?? item.NilaiYi ?? item.catatan?.yi ?? item.nilai_akhir ?? item.totalScore ?? 0),
        NilaiYi: Number(item.NilaiYi ?? item.nilai_yi ?? item.catatan?.yi ?? item.nilai_akhir ?? item.totalScore ?? 0),
        achievement: computedAchievement,
        Achievement: computedAchievement,
        persentase_kpi: computedAchievement,
        PersentaseKPI: computedAchievement,
        predikat: computedPredikat,
        Predikat: computedPredikat,
        lokasi: item.lokasi ?? item.Lokasi ?? item.Karyawan?.Lokasi ?? item.Karyawan?.lokasi ?? item.Karyawan?.lokasi_kerja ?? "",
        Lokasi: item.Lokasi ?? item.lokasi ?? item.Karyawan?.Lokasi ?? item.Karyawan?.lokasi ?? item.Karyawan?.lokasi_kerja ?? "",
        weight_ahp: Number(item.weight_ahp ?? item.weightAHP ?? item.BobotAhp ?? item.bobot_ahp ?? 0),
        weight_group: Number(item.weight_group ?? item.weightGroup ?? item.bobot_group ?? 0),
        weight_global: Number(item.weight_global ?? item.weightGlobal ?? item.bobot_global ?? 0),

        Id: Number(item.Id ?? item.id ?? item.karyawan_id ?? 0),
        PeriodeId: Number(item.PeriodeId ?? item.periodeId ?? periodeId),
        Periode: item.Periode ?? null,
        NilaiSkala: Number(item.NilaiSkala ?? item.nilai_skala ?? item.nilai ?? 0),
        NilaiOptimasi: Number(item.NilaiOptimasi ?? item.nilai_optimasi ?? 0),
        Ranking: Number(item.Ranking ?? item.ranking ?? 0),
        Status: item.Status ?? item.status ?? 'Draft',
        status: item.status ?? item.Status ?? 'Draft',
        Catatan: item.Catatan ?? item.catatan ?? '',
        catatan: item.catatan ?? item.Catatan ?? '',
        Karyawan: item.Karyawan
          ? {
              Id: Number(item.Karyawan.Id ?? item.Karyawan.id ?? 0),
              id: Number(item.Karyawan.id ?? item.Karyawan.Id ?? 0),
              Nik: item.Karyawan.Nik ?? item.Karyawan.nik ?? '',
              nik: item.Karyawan.nik ?? item.Karyawan.Nik ?? '',
              Nama: item.Karyawan.Nama ?? item.Karyawan.name ?? '',
              name: item.Karyawan.name ?? item.Karyawan.Nama ?? '',
              Jabatan: item.Karyawan.Jabatan ?? item.Karyawan.role ?? '',
              jabatan: item.Karyawan.jabatan ?? item.Karyawan.role ?? '',
              Divisi: item.Karyawan.Divisi ?? item.Karyawan.divisi ?? item.nama_divisi ?? item.NamaDivisi ?? '',
              divisi: item.Karyawan.divisi ?? item.Karyawan.Divisi ?? item.nama_divisi ?? item.NamaDivisi ?? '',
              DivisiId: Number(item.Karyawan.DivisiId ?? item.Karyawan.divisiId ?? item.Karyawan.departemen_id ?? 0),
              divisiId: Number(item.Karyawan.divisiId ?? item.Karyawan.DivisiId ?? item.Karyawan.departemen_id ?? 0),
              Lokasi: item.Karyawan.Lokasi ?? item.Karyawan.lokasi ?? item.Karyawan.lokasi_kerja ?? '',
              lokasi: item.Karyawan.lokasi ?? item.Karyawan.Lokasi ?? item.Karyawan.lokasi_kerja ?? '',
            }
          : {
              Id: Number(item.karyawan_id ?? item.id ?? 0),
              id: Number(item.karyawan_id ?? item.id ?? 0),
              Nik: item.nik ?? '',
              nik: item.nik ?? '',
              Nama: item.name ?? item.nama ?? '',
              name: item.name ?? item.nama ?? '',
              Jabatan: item.role ?? '',
              jabatan: item.role ?? '',
              Divisi: item.nama_divisi ?? item.NamaDivisi ?? '',
              divisi: item.nama_divisi ?? item.NamaDivisi ?? '',
              DivisiId: Number(item.departemen_id ?? item.DeptId ?? 0),
              divisiId: Number(item.departemen_id ?? item.DeptId ?? 0),
              Lokasi: item.lokasi_kerja ?? '',
              lokasi: item.lokasi_kerja ?? '',
            },
      };
      });

    return {
      success: true,
      message: 'Success',
      data: mapped,
      meta,
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
  },

  reviewMooraResult: async (id: number, catatan: { p: string; i: string; s: string }, status: 'Draft' | 'Pending' | 'Reviewed' = 'Reviewed') => {
    const response = await axiosServices.patch<{ message: string; success: boolean }>(`/spk/moora/hasil/${id}/review`, {
      status: status,
      Catatan: catatan
    });
    return response.data;
  },

  updateStatus: async (periodeId: number, status: 'locked' | 'draft' | 'open' | 'processed' | 'Final' | 'Draft') => {
    const normalized = String(status).toLowerCase();
    const response = await axiosServices.put<{ message: string; success: boolean }>(`/spk/periode/${periodeId}`, {
      Status: normalized === 'final' ? 'locked' : normalized
    });
    return response.data;
  },

  lockPeriode: async (periodeId: number) => {
    const response = await axiosServices.put<{ message: string; success: boolean }>(`/spk/periode/${periodeId}`, {
      Status: 'locked'
    });
    return response.data;
  },

  // Helper for file downloads to handle auth token
  downloadReport: async (url: string, filename: string) => {
    try {
      const response = await axiosServices.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'Accept': 'application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      // Check if the response is actually a JSON error message disguised as arraybuffer
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        const decoder = new TextDecoder('utf-8');
        const jsonStr = decoder.decode(response.data);
        const errorData = JSON.parse(jsonStr);
        throw new Error(errorData.message || 'Gagal mengunduh file');
      }

      const blob = new Blob([response.data], { 
        type: contentType || (filename.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') 
      });
      
      // Verification: If PDF is too small (e.g. < 500 bytes), it might be a corrupted text response
      if (filename.endsWith('.pdf') && blob.size < 500) {
        console.warn('Warning: Downloaded PDF is unusually small:', blob.size, 'bytes');
      }

      const blobUrl = window.URL.createObjectURL(blob);
      
      // If it's a PDF, we can try to open in new tab instead of just forced download
      if (filename.endsWith('.pdf')) {
        const newWindow = window.open(blobUrl, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          // Fallback to link download if popup blocked
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 5000); // Increased timeout to ensure browser finishes loading
    } catch (error: any) {
      console.error('Download Error:', error);
      // If error.data is an arraybuffer, decode it
      if (error.data instanceof ArrayBuffer) {
        const decoder = new TextDecoder('utf-8');
        const jsonStr = decoder.decode(error.data);
        const errorData = JSON.parse(jsonStr);
        alert(errorData.message || 'Gagal mengunduh file');
      } else {
        alert(error.message || 'Gagal mengunduh file');
      }
      throw error;
    }
  }
};

export default spkService;
