import axios from 'axios';
import { clearSession, getAccessToken, getRefreshToken, updateAccessToken } from './authSession';

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

// interceptor for http
axiosServices.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosServices.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = (error.config || {}) as CustomAxiosRequestConfig & { headers?: Record<string, string> };
        const responseStatus = error?.response?.status;
        const responseData = error?.response?.data;
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

        if (responseStatus === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = getRefreshToken();
            if (refreshToken) {
                try {
                    const response = await axios.post(`/api/proxy/auth/refresh`, {}, {
                        headers: { Authorization: `Bearer ${refreshToken}` },
                    });
                    if (response.data && response.data.access_token) {
                        const newToken = response.data.access_token;
                        updateAccessToken(newToken);
                        axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
                        originalRequest.headers = {
                            ...(originalRequest.headers || {}),
                            Authorization: `Bearer ${newToken}`,
                        };

                        return axiosServices(originalRequest as any);
                    }
                } catch (refreshError) {
                    clearSession();
                    window.location.href = '/auth/auth1/login';
                    return Promise.reject({ status: 401, message: 'Session expired. Please login again.' });
                }
            }

            clearSession();
            window.location.href = '/auth/auth1/login';
            return Promise.reject({ status: 401, message: 'Session expired. Please login again.' });
        }

        return Promise.reject(errorData);
    }
);

export default axiosServices;
