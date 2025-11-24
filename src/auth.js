import { getApiUrl } from './config/api';

export const refreshToken = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    try {
        const res = await fetch(`${getApiUrl()}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('authToken', data.access_token);
            return data.access_token;
        } else {
            // Refresh failed, clear session
            localStorage.removeItem('authToken');
            localStorage.removeItem('username');
            window.location.reload(); // Force reload to reset state
            return null;
        }
    } catch (err) {
        console.error("Token refresh failed:", err);
        return null;
    }
};

export const fetchWithAuth = async (url, options = {}) => {
    let token = localStorage.getItem('authToken');

    if (!token) {
        throw new Error("No auth token");
    }

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    let res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
        // Try to refresh
        token = await refreshToken();
        if (token) {
            // Retry with new token
            headers['Authorization'] = `Bearer ${token}`;
            res = await fetch(url, { ...options, headers });
        }
    }

    return res;
};
