import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('is_guest');

            // Try to auto-recover by creating a new guest session.
            // This handles expired guest tokens transparently.
            try {
                const { ensureSession } = await import('@/lib/session');
                await ensureSession();
                // Retry the original request once with the new token
                const token = localStorage.getItem('token');
                if (token) {
                    error.config.headers.Authorization = `Bearer ${token}`;
                    return api.request(error.config);
                }
            } catch {}

            // If recovery failed, send to login (only for real-auth failures)
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
