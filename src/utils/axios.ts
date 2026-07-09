import axios from 'axios';
import { clearSession } from './authSession';

interface CustomAxiosRequestConfig {
    _retry?: boolean;
    _skipAuthRefresh?: boolean;
}

interface ApiError {
    status: number;
    message: string;
    data?: unknown;
}

const axiosServices = axios.create({
    baseURL: '/api/proxy',
});

/**
 * Token (access_token) disimpan di HttpOnly cookie.
 * Middleware secara otomatis meng-inject token ke header Authorization.
 * Oleh karena itu, interceptor request TIDAK perlu mengatur header manual.
 */

// Interceptor response: handle 401 → refresh token → retry
axiosServices.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = (error.config || {}) as CustomAxiosRequestConfig & { headers?: Record<string, string> };
        const responseStatus = error?.response?.status;
        const responseData = error?.response?.data;

        // Global Handling for 409 Conflict - Relation Errors
        if (responseStatus === 409) {
            return Promise.reject({
                status: 409,
                message: responseData?.message || "Data ini tidak dapat dihapus atau diubah karena masih digunakan oleh modul lain (Konflik Relasi).",
                data: responseData
            });
        }

        // Global Handling for 403 Forbidden - Access Control
        if (responseStatus === 403) {
            return Promise.reject({
                status: 403,
                message: responseData?.message || "Anda tidak memiliki akses ke laman ini",
                data: responseData
            });
        }

        const errorData: ApiError = {
            status: responseStatus || 0,
            message:
                responseData?.message ||
                responseData?.detail ||
                (responseStatus === 401 ? 'Unauthorized' : responseStatus === 403 ? 'Forbidden' : responseStatus >= 500 ? 'Server Error' : error?.message || 'Network Error'),
            data: responseData,
        };

        if (originalRequest?._skipAuthRefresh) {
            return Promise.reject(errorData);
        }

        // ── Auto-refresh: panggil endpoint refresh saat 401 ──
        // Refresh token ada di HttpOnly cookie — browser otomatis kirim via cookie.
        // Middleware akan membaca cookie & meng-inject Authorization header.
        if (responseStatus === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshResponse = await axios.post(`/api/proxy/auth/refresh`, {});
                // Jika refresh berhasil (200), cookie access_token sudah diperbarui.
                // Retry request original — middleware akan inject token baru dari cookie.
                if (refreshResponse.status === 200) {
                    return axiosServices(originalRequest as any);
                }
            } catch {
                // Refresh gagal → session expired
            }

            clearSession();
            window.location.href = '/auth/auth1/login';
            return Promise.reject({ status: 401, message: 'Sesi Anda telah berakhir. Silakan masuk kembali.' });
        }

        return Promise.reject(errorData);
    }
);

export default axiosServices;
