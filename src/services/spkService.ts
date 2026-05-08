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
  },

  updateStatus: async (periodeId: number, status: 'Final' | 'Draft') => {
    // Sesuai instruksi backend spkController.js:198-203, kirim field "Status" ke endpoint periode
    const response = await axiosServices.put<{ message: string; success: boolean }>(`/spk/periode/${periodeId}`, {
      Status: status
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
