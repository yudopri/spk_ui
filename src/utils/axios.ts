import axios from 'axios';

const axiosServices = axios.create({
    baseURL: '/api/proxy',
});

// interceptor for http
axiosServices.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
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
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_HOST}/api/Auth/refresh`, {
                        refreshToken: refreshToken
                    });
                    if (response.data.success) {
                        localStorage.setItem('token', response.data.data.token);
                        localStorage.setItem('refreshToken', response.data.data.refreshToken);
                        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;
                        return axiosServices(originalRequest);
                    }
                } catch (refreshError) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/auth/auth1/login';
                }
            }
        }
        return Promise.reject((error.response && error.response.data) || 'Wrong Services');
    }
);

export default axiosServices;
