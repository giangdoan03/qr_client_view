// Handlebars helpers
Handlebars.registerHelper("lowercase", function (str) {
    return (str || "").toLowerCase();
});

Handlebars.registerHelper("formatPrice", function (value) {
    const p = parseFloat(value || 0);
    return isNaN(p) ? '' : `${p.toLocaleString("vi-VN")} ₫`;
});

Handlebars.registerHelper("eq", (a, b) => a === b);
Handlebars.registerHelper("gt", (a, b) => a > b);
Handlebars.registerHelper("formatPrice", function (value) {
    const p = parseFloat(value || 0);
    return isNaN(p) ? '' : `${p.toLocaleString("vi-VN")} ₫`;
});
Handlebars.registerHelper('lowercase', str => (str || '').toLowerCase());

Handlebars.registerHelper("safeImage", function(val) {
    try {
        if (typeof val === 'string') return val;
        if (Array.isArray(val)) return val[0]?.url || '';
        return val?.url || '';
    } catch {
        return '';
    }
});

Handlebars.registerHelper('isPdf', url => /\.pdf([?#].*)?$/i.test(url || ''));
Handlebars.registerHelper('isImage', url => /\.(png|jpe?g|gif|webp|bmp|svg)([?#].*)?$/i.test(url || ''));
Handlebars.registerHelper('ext', url => {
    const u = (url || '').split('#')[0].split('?')[0];
    const m = u.match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toUpperCase() : 'FILE';
});

Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('inc', i => Number(i) + 1);


// Detect Hệ điều hành
function detectOS() {
    const ua = navigator.userAgent;
    if (ua.includes("Win")) return "Windows";
    if (ua.includes("Mac")) return "MacOS";
    if (ua.includes("Linux")) return "Linux";
    if (/Android/.test(ua)) return "Android";
    if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
    return "Không rõ";
}

// Detect Thiết bị
function detectDeviceType() {
    return /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
}

// Detect Trình duyệt
function detectBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    return "Khác";
}

// Lấy IP công cộng
async function getPublicIP() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        return data.ip;
    } catch (e) {
        console.error('IP fetch failed', e);
        return null;
    }
}

// Tạo mã tracking ngẫu nhiên
function generateTrackingCode(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Lấy ảnh đại diện ưu tiên
function extractImage(target) {
    const raw = target.avatar || target.logo || target.images || null;
    if (!raw) return null;

    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) return parsed[0]?.url || parsed[0];
        if (typeof parsed === 'object') return parsed.url || null;
        return parsed;
    } catch {
        return raw;
    }
}

// Gửi log scan QR
async function sendScanLog({ qr, target }) {
    try {
        const payload = {
            qr_id: qr.qr_id,
            tracking_code: generateTrackingCode(),
            target_id: target.id,
            target_type: qr.target_type,
            type: qr.target_type,
            qr_url: window.location.href,
            user_agent: navigator.userAgent,
            os: detectOS(),
            device_type: detectDeviceType(),
            browser: detectBrowser(),
            ip_address: await getPublicIP(),
            referer: document.referrer,
            country: 'VN',
            city: 'Hà Nội',
            latitude: null,
            longitude: null,
            phone_number: target.contact_phone || target.phone || null,
            qr_name: qr.qr_name,
            qr_type: qr.qr_type,
            object_name: target.name,
            object_image: extractImage(target),
            customer: 'Khách hàng #id_' + qr.user_id,
        };

        // chọn origin theo hostname hiện tại
        const host = location.hostname.toLowerCase();
        const isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
        const apiOrigin = isLocal ? `${location.protocol}//api.goldenwin.local` : 'https://api.goldenwin.vn';

        const res = await fetch(`${apiOrigin}/api/scan-history`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            // credentials: 'include', // bật nếu API dùng cookie/session
            body: JSON.stringify(payload),
        });


        const result = await res.json();
        console.log('Scan logged:', result);
    } catch (error) {
        console.error('Scan API failed:', error);
    }
}



