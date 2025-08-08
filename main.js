Handlebars.registerHelper("eq", (a, b) => a === b);
Handlebars.registerHelper("gt", (a, b) => a > b);

Handlebars.registerHelper("json", function (context) {
    return JSON.stringify(context, null, 2);
});

Handlebars.registerHelper("formatPrice", function (value) {
    const p = parseFloat(value || 0);
    return isNaN(p) ? '' : `${p.toLocaleString("vi-VN")} ₫`;
});

Handlebars.registerHelper('lowercase', function (str) {
    return (str || '').toLowerCase();
});

Handlebars.registerHelper("safeImage", val => {
    try {
        const parsed = typeof val === 'string' ? JSON.parse(val) : val;
        return Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
        return val;
    }
});

async function loadTemplate(id, url) {
    const res = await fetch(url);
    const tpl = await res.text();
    const script = document.createElement('script');
    script.id = id;
    script.type = 'text/x-handlebars-template';
    script.innerHTML = tpl;
    document.body.appendChild(script);
}

function formatVNDate(isoStr) {
    const date = new Date(isoStr);
    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour12: false,
        timeZone: 'Asia/Ho_Chi_Minh'
    });
}


(async () => {
    await renderQRPage(); // chỉ gọi khi template đã load xong
})();

function safeParse(val, fallback = {}) {
    try {
        return typeof val === 'string' ? JSON.parse(val) : (val || fallback);
    } catch {
        return fallback;
    }
}

function formatPrice(price) {
    const p = parseFloat(price || 0);
    return isNaN(p) ? '' : `${p.toLocaleString("vi-VN")} ₫`;
}

function initProductTabs() {
    const btnNew = document.getElementById('tab-new');
    const btnTop = document.getElementById('tab-top');
    const listNew = document.getElementById('list-new');
    const listTop = document.getElementById('list-top');

    if (!btnNew || !btnTop || !listNew || !listTop) return;

    btnNew.addEventListener('click', () => {
        listNew.classList.remove('hidden');
        listTop.classList.add('hidden');
        btnNew.classList.add('bg-white', 'text-orange-500', 'font-medium');
        btnTop.classList.remove('bg-white', 'text-orange-500', 'font-medium');
        btnTop.classList.add('text-gray-500');
    });

    btnTop.addEventListener('click', () => {
        listTop.classList.remove('hidden');
        listNew.classList.add('hidden');
        btnTop.classList.add('bg-white', 'text-orange-500', 'font-medium');
        btnNew.classList.remove('bg-white', 'text-orange-500', 'font-medium');
        btnNew.classList.add('text-gray-500');
    });
}

async function renderQRPage() {
    const qrId = window.location.pathname.split("/").filter(Boolean)[0];
    const infoEl = document.getElementById("info");

    if (!qrId) {
        infoEl.innerHTML = `<p class="text-center p-4">Không tìm thấy mã QR</p>`;
        return;
    }

    const isLocal =
        ['localhost', '127.0.0.1', 'info.goldenwin.local', 'qrcode.goldenwin.local'].includes(window.location.hostname);

    const API_BASE = isLocal
        ? 'http://api.goldenwin.local/api'
        : 'https://api-qrcode.labit365.com/api';

    console.log('API_BASE', API_BASE)

    try {
        const res = await fetch(`${API_BASE}/qr-codes/detail/${qrId}`);
        const data = await res.json();

        if (!data.qr || !data.target) {
            infoEl.innerHTML = `<p class="text-center p-4">QR không tồn tại hoặc không có dữ liệu.</p>`;
            return;
        }

        const {qr, target} = data;

        // 👉 Làm sạch dữ liệu event nếu là sự kiện

        const images = Array.isArray(target.images)
            ? target.images.map(img => typeof img === 'string' ? img : img?.url)
            : [];

        // Lấy template phù hợp
        let templateId;
        switch (qr.target_type) {
            case 'product':
                templateId = 'product';
                break;
            case 'store':
                templateId = 'store';
                break;
            case 'event':
                templateId = 'event';
                break;
            case 'person':
                templateId = 'person';
                break;
            case 'company':
                templateId = 'company';
                break;
            case 'business':
                templateId = 'business';
                break;
            case 'text':
                templateId = 'text';
                break;
            default:
                templateId = 'product';
        }

        if (!document.getElementById(templateId)) {
            const templatePath = `/views/${templateId}.html`;
            await loadTemplate(templateId, templatePath);
        }


        // const productRes = await fetch(`${API_BASE}/products`);
        // const productData = await productRes.json();
        // const allProducts = Array.isArray(productData.data) ? productData.data : [];
        //
        // const displaySettings = safeParse(target.display_settings, {});

        // 1. Sản phẩm mới nhất
        // Dùng dữ liệu trả sẵn từ backend nếu có
        const getProductImage = (p) => {
            const images = Array.isArray(p.images) ? p.images : [];

            const cover = images.find(img => img?.isCover);
            if (cover?.url) return cover.url;

            if (images[0]?.url) return images[0].url;

            if (Array.isArray(p.avatar)) return p.avatar[0] || '';
            return typeof p.avatar === 'string' ? p.avatar : '';
        };

        // Trong phần xử lý selectedProducts (giữ nguyên map structure)
        target.selectedProducts = Array.isArray(target.selectedProducts)
            ? target.selectedProducts.map(p => ({
                ...p,
                image: getProductImage(p)
            }))
            : [];
        target.topProducts = Array.isArray(target.topProducts)
            ? target.topProducts.map(p => ({
                ...p,
                image: safeParse(p.avatar, [])[0] || '',
                count: 'top'
            }))
            : [];


        // 3. Công ty liên quan (trả về từ API)
        target.relatedBusinesses = Array.isArray(target.selectedCompanies)
            ? target.selectedCompanies.map(c => ({
                logo: safeParse(c.logo, [])[0] || '', // ✔ parse JSON nếu là chuỗi mảng
                name: c.name,
                phone: c.phone
            }))
            : [];


        const rawLinks = safeParse(target.display_settings, {}).productLinks || [];
        const productLinks = rawLinks.filter(link => link.url?.trim());

        const templateEl = document.getElementById(templateId);
        if (!templateEl) {
            setTimeout(renderQRPage, 100);
            return;
        }

        const template = Handlebars.compile(templateEl.innerHTML);
        const context = {
            qr,
            product: target,
            business: target, // ✅ Thêm dòng này để template business hoạt động
            images,
            attributes: safeParse(target.attributes, []),
            productLinks,
            price: formatPrice(target.price),
        };

        // 👇 Nếu là person thì bổ sung person_detail
        if (qr.target_type === 'person') {
            context.person = {
                ...target.person_detail,
                selectedProducts: target.selectedProducts,
                selectedCompanies: target.selectedCompanies,
                selectedStores: target.selectedStores,
            };
        }

        // Nếu là event
        if (qr.target_type === 'event') {
            const eventDetail = target.event_detail || target;
            eventDetail.description = safeParse(eventDetail.description, []).map(d => {
                const title = (d.title || '').trim();
                const raw = (d.content || '').trim();

                // Kiểm tra xem nội dung có chứa các thực thể HTML không
                const hasEscapedTags = /&lt;|&gt;|&quot;|&#39;|&amp;/.test(raw);
                let content = raw;

                if (hasEscapedTags) {
                    const textarea = document.createElement('textarea');
                    textarea.innerHTML = raw;
                    content = textarea.value; // giải mã các thực thể HTML
                }

                return {
                    title,
                    content
                };
            }).filter(d => d.title || d.content.replace(/<p><br\s*\/?><\/p>/gi, '').trim());


            eventDetail.ticket_options = safeParse(eventDetail.ticket_options, []);
            eventDetail.social_links = safeParse(eventDetail.social_links, []);
            eventDetail.images = safeParse(eventDetail.images, []).map(img => typeof img === 'string' ? img : img.url);
            eventDetail.video = safeParse(eventDetail.video, []).map(v => {
                const url = (v.url || '').trim();
                const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
                const videoId = match ? match[1] : null;
                const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : url;

                return {
                    ...v,
                    embedUrl
                };
            });


            // Render template
            const context = {
                qr,
                event: {
                    ...eventDetail,
                    selectedProducts: target.selectedProducts || [],
                    selectedCompanies: target.selectedCompanies || [],
                    selectedStores: target.selectedStores || [],
                    start_time: formatVNDate(eventDetail.start_time),
                    end_time: formatVNDate(eventDetail.end_time),
                },
                price: formatPrice(eventDetail.price),
                images: Array.isArray(eventDetail.images) ? eventDetail.images : []
            };

            infoEl.innerHTML = template(context);
            return;
        }


        infoEl.innerHTML = template(context);


        // 👉 Gọi sau khi đã gắn vào DOM
        initProductTabs();

        // ✅ Swiper ảnh chính
        requestAnimationFrame(() => {
            new Swiper(".imageProductAvatarSwiper", {
                slidesPerView: 1,
                height: 240,
                pagination: {
                    el: ".imageProductAvatarSwiper .swiper-pagination",
                    clickable: true,
                },
            });
        });
        // ✅ Swiper sản phẩm liên quan
        requestAnimationFrame(() => {
            new Swiper(".relatedProductsSwiper", {
                slidesPerView: 2.1,
                spaceBetween: 16,
                pagination: {
                    el: ".relatedProductsSwiper .swiper-pagination",
                    clickable: true,
                },
            });

            // ✅ Swiper công ty liên quan
            new Swiper(".relatedCompaniesSwiper", {
                slidesPerView: 1.3,
                spaceBetween: 16,
                pagination: {
                    el: ".relatedCompaniesSwiper .swiper-pagination",
                    clickable: true,
                },
            });
        });

        requestAnimationFrame(() => {
            new Swiper(".mySwiperNew", {
                slidesPerView: 2.1,
                spaceBetween: 16,
                pagination: {
                    el: ".mySwiperNew .swiper-pagination",
                    clickable: true,
                },
            });

            // ✅ Swiper công ty liên quan
            new Swiper(".mySwiperTop", {
                slidesPerView: 1.3,
                spaceBetween: 16,
                pagination: {
                    el: ".mySwiperTop .swiper-pagination",
                    clickable: true,
                },
            });
        });

        // Sau khi infoEl.innerHTML = template(...) hoàn tất

        requestAnimationFrame(() => {
            // ✅ Slider sản phẩm liên quan
            new Swiper(".swiper-selected-products", {
                slidesPerView: 2.1,
                spaceBetween: 16,
                pagination: {
                    el: ".swiper-selected-products .swiper-pagination",
                    clickable: true,
                },
            });

            // ✅ Slider công ty liên quan
            new Swiper(".swiper-selected-companies", {
                slidesPerView: 1.3,
                spaceBetween: 16,
                pagination: {
                    el: ".swiper-selected-companies .swiper-pagination",
                    clickable: true,
                },
            });

            // ✅ Slider cửa hàng liên quan
            new Swiper(".swiper-selected-stores", {
                slidesPerView: 1.3,
                spaceBetween: 16,
                pagination: {
                    el: ".swiper-selected-stores .swiper-pagination",
                    clickable: true,
                },
            });

            // ✅ Slider cửa hàng liên quan
            new Swiper(".swiper-selected-products_company", {
                slidesPerView: 1.3,
                spaceBetween: 16,
                pagination: {
                    el: ".swiper-selected-products_company .swiper-pagination",
                    clickable: true,
                },
            });
        });


    } catch (err) {
        infoEl.innerHTML = `<p class="text-center p-4">Lỗi kết nối máy chủ</p>`;
        console.error(err);
    }
}
