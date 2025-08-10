// api.js
const host = location.hostname;
const isLocal = (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local'));

export const API_BASE = isLocal
    ? 'https://api.goldenwin.vn/api'
    : 'https://api.goldenwin.vn/api';

export async function callApi(endpoint) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        console.error('API Error:', err);
        throw err;
    }
}
