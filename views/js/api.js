const isLocal = ['localhost', '127.0.0.1', 'info.goldenwin.vn', 'qrcode.goldenwin.vn'].includes(location.hostname);
const API_BASE = isLocal
    ? 'http://api.goldenwin.vn/api'
    : 'http://api.goldenwin.vn/api';

/**
 * Gọi API GET với đường dẫn tương đối (relative)
 * @param {string} endpoint - Ví dụ: /qr-codes/detail/abc123
 * @returns {Promise<any>} - Trả về JSON hoặc ném lỗi
 */
async function callApi(endpoint) {
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
