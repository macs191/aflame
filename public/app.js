/* ============================================================
   سيرفر الوحش 🐺 — Main Application Logic
   Version: 2.0 — Full Featured
   ============================================================ */

/* ---------- 1. FIREBASE ---------- */
const firebaseConfig = {
    apiKey:"AIzaSyC9cmh_bzA4ZeV8bYlbqaGrmIri2PUGx2A",
    authDomain:"voip17.firebaseapp.com",
    databaseURL:"https://voip17-default-rtdb.firebaseio.com",
    projectId:"voip17",
    storageBucket:"voip17.firebasestorage.app",
    messagingSenderId:"608379006778",
    appId:"1:608379006778:web:51fe8032d09fbd5b556a03",
    measurementId:"G-GZNJZLM701"
};
if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

/* ---------- 2. GLOBAL STATE ---------- */
const state = {
    currentUser: null,
    userData: null,
    authMode: 'login',
    videos: [],
    liveChannels: [],
    liveCategories: [],
    categories: [],
    sections: [],
    settings: {},
    ads: {},
    favorites: JSON.parse(localStorage.getItem('sw_favs') || '[]'),
    history: JSON.parse(localStorage.getItem('sw_history') || '[]'),
    watchlists: [],
    achievements: {},
    notifications: [],
    unreadNotifs: 0,
    vipStatus: null,
    currentPlayerItem: null,
    currentVideoEl: null,
    playerType: 'vod',
    hlsInstance: null,
    dashInstance: null,
    progressTimer: null,
    sleepTimer: null,
    searchQuery: '',
    theme: localStorage.getItem('sw_theme') || 'dark',
    autoPlayNext: localStorage.getItem('sw_autoplay') !== 'false',
    heroIndex: 0,
    heroTimer: null,
    activeTab: 'home',
    chatRoom: 'general',
    userListenerRef: null,
    vipListenerRef: null,
    notifListenerRef: null,
    ratingsListenerRef: null,
    commentsListenerRef: null
};

/* ---------- 3. UTILITIES ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const fmtDate = ts => ts ? new Date(ts).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const fmtRel = ts => {
    if (!ts) return '—';
    const d = Date.now() - ts, m = Math.floor(d / 60000), h = Math.floor(d / 3600000), dd = Math.floor(d / 86400000);
    if (m < 1) return 'الآن';
    if (m < 60) return `منذ ${m} دقيقة`;
    if (h < 24) return `منذ ${h} ساعة`;
    if (dd < 30) return `منذ ${dd} يوم`;
    return fmtDate(ts);
};
const getUserExp = u => u ? (u.vipExpireDate || u.expireAt || 0) : 0;
const getUserVip = u => {
    if (!u) return false;
    const exp = getUserExp(u);
    if (u.isVip === true && exp === 0) return true;
    return exp > Date.now();
};
const getUserBanned = u => !!(u && (u.isBanned || u.isBlocked));

function getUserLevel(u) {
    if (!u) return { key: 'new', label: 'زائر' };
    if (getUserVip(u)) return { key: 'vip', label: '👑 VIP' };
    const days = (Date.now() - (u.createdAt || Date.now())) / 86400000;
    if (days >= 365) return { key: 'gold', label: '🥇 ذهبي' };
    if (days >= 90) return { key: 'silver', label: '🥈 فضي' };
    if (days >= 30) return { key: 'bronze', label: '🥉 برونزي' };
    return { key: 'new', label: 'عضو جديد' };
}

/* ---------- 4. UI HELPERS ---------- */
function toast(msg, type = '', title = '') {
    const w = $('#toasts');
    if (!w) return;
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    const icon = type === 'ok' ? 'fa-circle-check' : type === 'err' ? 'fa-circle-exclamation' : type === 'warn' ? 'fa-triangle-exclamation' : 'fa-circle-info';
    t.innerHTML = `<div class="toast-i"><i class="fa-solid ${icon}"></i></div>
        <div class="toast-body">${title ? `<div class="toast-title">${esc(title)}</div>` : ''}<div class="toast-msg">${esc(msg)}</div></div>`;
    w.appendChild(t);
    setTimeout(() => {
        t.style.transition = 'opacity .3s, transform .3s';
        t.style.opacity = '0';
        t.style.transform = 'translateY(-12px)';
        setTimeout(() => t.remove(), 320);
    }, 3400);
}

function openModal(id) { const m = $('#' + id); if (m) m.classList.add('active'); }
function closeModal(id) { const m = $('#' + id); if (m) m.classList.remove('active'); }

let confirmResolver = null;
function askConfirm({ title = 'تأكيد', msg = 'هل أنت متأكد؟', okText = 'تأكيد', type = 'danger' } = {}) {
    return new Promise(res => {
        $('#cfTitle').textContent = title;
        $('#cfMsg').textContent = msg;
        $('#cfYes').textContent = okText;
        const icon = $('#cfIcon');
        icon.style.background = type === 'warn' ? 'rgba(245,158,11,.15)' : 'rgba(229,9,20,.15)';
        icon.style.color = type === 'warn' ? 'var(--warning)' : 'var(--accent)';
        openModal('confirmModal');
        confirmResolver = res;
    });
}

function hideLoader() {
    const l = $('#appLoader');
    if (l) { l.classList.add('hide'); setTimeout(() => l.remove(), 600); }
}

/* ---------- 5. THEME (Feature #1) ---------- */
function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    const btn = $('#themeBtn');
    if (btn) btn.innerHTML = state.theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
}
function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('sw_theme', state.theme);
    applyTheme();
    toast(state.theme === 'dark' ? '🌙 الوضع الليلي' : '☀️ الوضع النهاري', 'ok');
}

/* ---------- 6. NAV ACTIONS ---------- */
function renderNavActions() {
    const area = $('#navActions');
    if (!area) return;
    const themeBtn = `<button class="nav-icon-btn" id="themeBtn" title="الوضع"><i class="fa-solid fa-${state.theme === 'dark' ? 'sun' : 'moon'}"></i></button>`;

    if (state.currentUser && state.userData) {
        const isVip = getUserVip(state.userData);
        const isPending = state.vipStatus && state.vipStatus.status === 'pending';
        const tag = isVip ? '<span class="tag vip">👑 VIP</span>' : isPending ? '<span class="tag pending">مراجعة</span>' : '<span class="tag free">عادي</span>';
        const letter = (state.userData.name || '?').trim().charAt(0).toUpperCase();
        area.innerHTML = `${themeBtn}
            <button class="nav-icon-btn" id="notifBtn" title="الإشعارات">
                <i class="fa-solid fa-bell"></i>
                ${state.unreadNotifs > 0 ? `<span class="badge">${state.unreadNotifs}</span>` : ''}
            </button>
            <div class="user-chip" id="userChip">
                <div class="avatar">${esc(letter)}</div>
                <span class="name">${esc(state.userData.name || 'حسابي')}</span>
                ${tag}
            </div>`;
        $('#themeBtn').onclick = toggleTheme;
        $('#notifBtn').onclick = openNotifModal;
        $('#userChip').onclick = openProfileModal;
    } else {
        area.innerHTML = `${themeBtn}
            <button class="btn btn-outline sm" id="loginBtn"><i class="fa-solid fa-right-to-bracket"></i> دخول</button>
            <button class="btn btn-primary sm" id="registerBtn"><i class="fa-solid fa-user-plus"></i> جديد</button>`;
        $('#themeBtn').onclick = toggleTheme;
        $('#loginBtn').onclick = () => openAuthModal('login');
        $('#registerBtn').onclick = () => openAuthModal('register');
    }
}

/* ---------- 7. AUTH STATE ---------- */
auth.onAuthStateChanged(user => {
    if (state.userListenerRef) { state.userListenerRef.off(); state.userListenerRef = null; }
    if (state.vipListenerRef) { state.vipListenerRef.off(); state.vipListenerRef = null; }
    if (state.notifListenerRef) { state.notifListenerRef.off(); state.notifListenerRef = null; }
    state.vipStatus = null;
    state.notifications = [];
    state.unreadNotifs = 0;

    if (user) {
        state.currentUser = user;
        state.userListenerRef = db.ref('users/' + user.uid);
        state.userListenerRef.on('value', snap => {
            state.userData = snap.val();
            if (!state.userData) {
                state.userListenerRef.set({
                    email: user.email, name: user.displayName || 'عضو جديد',
                    isBanned: false, isBlocked: false, isVip: false,
                    vipExpireDate: 0, expireAt: 0, createdAt: Date.now()
                });
                return;
            }
            if (getUserBanned(state.userData)) {
                openModal('bannedModal');
                closePlayer();
                renderNavActions();
                return;
            }
            closeModal('bannedModal');
            renderNavActions();
            updateGuestWarn();
            renderAll();
            renderHero();
        });

        state.vipListenerRef = db.ref('vipRequests').orderByChild('uid').equalTo(user.uid);
        state.vipListenerRef.on('value', snap => {
            let latest = null;
            if (snap.exists()) {
                snap.forEach(c => {
                    const r = { id: c.key, ...c.val() };
                    if (!latest || (r.createdAt || 0) > (latest.createdAt || 0)) latest = r;
                });
            }
            state.vipStatus = latest;
            renderNavActions();
        });

        state.notifListenerRef = db.ref('notifications/' + user.uid);
        state.notifListenerRef.on('value', snap => {
            const arr = [];
            if (snap.exists()) snap.forEach(c => arr.push({ id: c.key, ...c.val() }));
            arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            state.notifications = arr;
            state.unreadNotifs = arr.filter(n => !n.read).length;
            renderNavActions();
            renderNotifList();
        });

        db.ref('watchlists/' + user.uid).on('value', snap => {
            state.watchlists = [];
            if (snap.exists()) snap.forEach(c => state.watchlists.push({ id: c.key, ...c.val() }));
        });

        db.ref('achievements/' + user.uid).on('value', snap => {
            state.achievements = snap.val() || {};
            checkAchievements();
        });
    } else {
        state.currentUser = null;
        state.userData = null;
        state.watchlists = [];
        state.achievements = {};
        renderNavActions();
        updateGuestWarn();
        renderAll();
        renderHero();
    }
});

function updateGuestWarn() {
    const w = $('#guestWarn');
    if (!w) return;
    w.style.display = state.currentUser ? 'none' : 'flex';
}

function openAuthModal(mode = 'login') {
    state.authMode = mode;
    const isLogin = mode === 'login';
    $('#authTitle').textContent = isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد';
    $('#nameGroup').style.display = isLogin ? 'none' : 'block';
    $('#authSubmitBtn').textContent = isLogin ? 'دخول' : 'إنشاء حساب';
    $('#authToggleText').textContent = isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟';
    $('#authToggleBtn').textContent = isLogin ? 'إنشاء حساب جديد' : 'تسجيل الدخول';
    openModal('authModal');
}

function logout() {
    auth.signOut().then(() => { toast('تم تسجيل الخروج', 'ok'); closeModal('profileModal'); });
}

/* ---------- 8. DATA FETCHING ---------- */
function fetchAll() {
    db.ref('videos').on('value', snap => {
        state.videos = [];
        if (snap.exists()) snap.forEach(c => state.videos.push({ id: c.key, ...c.val() }));
        renderAll();
        renderHero();
    });

    db.ref('categories').on('value', snap => {
        state.categories = [];
        if (snap.exists()) snap.forEach(c => state.categories.push({ id: c.key, ...c.val() }));
    });

    db.ref('sections').on('value', snap => {
        state.sections = [];
        if (snap.exists()) {
            snap.forEach(c => {
                const s = { id: c.key, ...c.val() };
                if (s.active !== false) state.sections.push(s);
            });
            state.sections.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        renderDynamicSections();
    });

    db.ref('liveChannels').on('value', snap => {
        state.liveChannels = [];
        if (snap.exists()) snap.forEach(c => state.liveChannels.push({ id: c.key, ...c.val() }));
        renderLive();
    });

    db.ref('liveCategories').on('value', snap => {
        state.liveCategories = [];
        if (snap.exists()) snap.forEach(c => state.liveCategories.push({ id: c.key, ...c.val() }));
        renderLiveTabs();
    });

    db.ref('settings').on('value', snap => {
        state.settings = snap.val() || {};
        applySettings();
    });

    db.ref('ads').on('value', snap => {
        state.ads = snap.val() || {};
        renderAds();
    });
}

function applySettings() {
    const s = state.settings;
    if (s.siteName) {
        $('#brandText').innerHTML = esc(s.siteName).replace('الوحش', '<b>الوحش</b>') + ' 🐺';
        document.title = s.siteName + ' | منصة البث';
    }
    if (s.accentColor) document.documentElement.style.setProperty('--accent', s.accentColor);
    if (s.vipColor) document.documentElement.style.setProperty('--vip', s.vipColor);
    if (s.tickerText) {
        $('#tickerBar').classList.add('show');
        $('#tickerContent').textContent = s.tickerText;
    }
    if (s.popupBanner && !sessionStorage.getItem('popupDismissed')) {
        $('#popupBannerText').textContent = s.popupBanner;
        setTimeout(() => {
            openModal('popupBannerModal');
            sessionStorage.setItem('popupDismissed', '1');
        }, 2000);
    }
}

function renderAds() {
    const ads = state.ads;
    [['#adTop', ads.topBanner], ['#adMid', ads.midBanner], ['#adBottom', ads.bottomBanner]].forEach(([sel, html]) => {
        const el = $(sel);
        if (el && html) { el.innerHTML = html; el.classList.add('show'); }
    });
}

/* ---------- 9. HERO CAROUSEL (Feature #10) ---------- */
function renderHero() {
    const slider = $('#heroSlider');
    const dots = $('#heroDots');
    const section = $('#heroSection');
    if (!slider || !dots || !section) return;

    let featured = state.videos.filter(v => v.featured === true);
    if (featured.length === 0) featured = state.videos.filter(v => v.isVip).slice(0, 5);
    if (featured.length === 0) featured = state.videos.slice(0, 5);

    if (featured.length === 0) { section.classList.remove('show'); return; }

    section.classList.add('show');
    slider.innerHTML = featured.map((item, i) => {
        const bg = item.backdrop || item.image || item.poster || '';
        const bgStyle = bg ? `background-image:url('${esc(bg)}')` : '';
        return `
            <div class="hero-slide ${i === 0 ? 'active' : ''}" data-idx="${i}" style="${bgStyle}">
                <div class="hero-slide-content">
                    ${item.isVip ? '<div class="hero-slide-badge"><i class="fa-solid fa-crown"></i> محتوى VIP</div>' : '<div class="hero-slide-badge"><i class="fa-solid fa-fire"></i> محتوى مميز</div>'}
                    <h2>${esc(item.title)}</h2>
                    <div class="hero-slide-meta">
                        ${item.year ? `<span><i class="fa-solid fa-calendar"></i> ${item.year}</span>` : ''}
                        ${item.category ? `<span><i class="fa-solid fa-folder"></i> ${esc(item.category)}</span>` : ''}
                        ${item.ratingAvg ? `<span><i class="fa-solid fa-star" style="color:var(--vip)"></i> ${Number(item.ratingAvg).toFixed(1)}</span>` : ''}
                        <span><i class="fa-regular fa-eye"></i> ${item.views || 0}</span>
                    </div>
                    <p>${esc(item.description || 'شاهد الآن على سيرفر الوحش بأفضل جودة.')}</p>
                    <div class="hero-slide-actions">
                        <button class="btn btn-primary" onclick="openPlayer('${esc(item.id)}','vod')"><i class="fa-solid fa-play"></i> مشاهدة الآن</button>
                        <button class="btn btn-ghost" onclick="showItemDetails('${esc(item.id)}')"><i class="fa-solid fa-circle-info"></i> التفاصيل</button>
                    </div>
                </div>
            </div>`;
    }).join('');

    dots.innerHTML = featured.map((_, i) => `<button class="hero-dot ${i === 0 ? 'active' : ''}" data-idx="${i}"></button>`).join('');
    $$('.hero-dot').forEach(d => d.onclick = () => goHero(+d.dataset.idx));

    if (state.heroTimer) clearInterval(state.heroTimer);
    state.heroTimer = setInterval(() => goHero(state.heroIndex + 1), 7000);
}

function goHero(idx) {
    const slides = $$('.hero-slide');
    const dots = $$('.hero-dot');
    if (slides.length === 0) return;
    idx = ((idx % slides.length) + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('active', i === idx));
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    state.heroIndex = idx;
}

/* ---------- 10. MAIN RENDER ---------- */
function renderAll() {
    renderDynamicSections();
    renderContinueWatching();
    renderLive();
}

function renderDynamicSections() {
    const wrap = $('#dynamicSections');
    if (!wrap) return;

    if (state.sections.length === 0) {
        wrap.innerHTML = buildDefaultSections();
        attachRowHandlers();
        return;
    }

    wrap.innerHTML = state.sections.map(sec => {
        const items = getItemsForSection(sec);
        if (items.length === 0) return '';
        const cardClass = sec.style === 'landscape' ? 'landscape' : '';
        return `
            <section class="content-row" data-section="${esc(sec.id)}">
                <div class="row-header">
                    <div class="row-title">
                        <i class="fa-solid ${sec.icon || 'fa-film'}"></i>
                        <h2>${esc(sec.title || 'قسم')}</h2>
                    </div>
                    <button class="row-action" data-section-view="${esc(sec.id)}">
                        <span>عرض الكل</span><i class="fa-solid fa-chevron-left"></i>
                    </button>
                </div>
                <div class="row-scroll">
                    ${items.slice(0, 20).map(it => renderCard(it, 'row-card ' + cardClass)).join('')}
                </div>
            </section>`;
    }).join('');

    attachRowHandlers();
}

function buildDefaultSections() {
    const all = state.videos;
    return `
        <section class="content-row">
            <div class="row-header">
                <div class="row-title"><i class="fa-solid fa-fire"></i><h2>الأكثر مشاهدة</h2></div>
                <button class="row-action" onclick="showAllInRow('trending')"><span>عرض الكل</span><i class="fa-solid fa-chevron-left"></i></button>
            </div>
            <div class="row-scroll">
                ${all.slice().sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 20).map(it => renderCard(it, 'row-card')).join('')}
            </div>
        </section>
        <section class="content-row">
            <div class="row-header">
                <div class="row-title"><i class="fa-solid fa-clock"></i><h2>أحدث الإضافات</h2></div>
                <button class="row-action" onclick="showAllInRow('newest')"><span>عرض الكل</span><i class="fa-solid fa-chevron-left"></i></button>
            </div>
            <div class="row-scroll">
                ${all.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 20).map(it => renderCard(it, 'row-card')).join('')}
            </div>
        </section>
        <section class="content-row">
            <div class="row-header">
                <div class="row-title"><i class="fa-solid fa-crown" style="color:var(--vip)"></i><h2>محتوى VIP</h2></div>
                <button class="row-action" onclick="showAllInRow('vip')"><span>عرض الكل</span><i class="fa-solid fa-chevron-left"></i></button>
            </div>
            <div class="row-scroll">
                ${all.filter(v => v.isVip).slice(0, 20).map(it => renderCard(it, 'row-card')).join('') || '<p style="color:var(--text-2);padding:20px">لا يوجد محتوى VIP حالياً</p>'}
            </div>
        </section>`;
}

function getItemsForSection(sec) {
    let items = state.videos.slice();
    if (sec.filter === 'vip') items = items.filter(i => i.isVip);
    else if (sec.filter === 'free') items = items.filter(i => !i.isVip);

    if (sec.categories && Array.isArray(sec.categories) && sec.categories.length > 0) {
        items = items.filter(i => sec.categories.includes(i.category));
    }

    const sort = sec.sort || 'newest';
    if (sort === 'newest') items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    else if (sort === 'views') items.sort((a, b) => (b.views || 0) - (a.views || 0));
    else if (sort === 'rating') items.sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0));
    else if (sort === 'random') items.sort(() => Math.random() - .5);

    return items.slice(0, sec.limit || 20);
}

function attachRowHandlers() {
    $$('[data-section-view]').forEach(btn => btn.onclick = () => openSectionDetail(btn.dataset.sectionView));
}

/* ---------- 11. CARD RENDER ---------- */
function renderCard(item, extraClass = '') {
    const isFav = state.favorites.includes(item.id);
    const defaultImg = 'https://via.placeholder.com/400x580/141721/6b7280?text=' + encodeURIComponent(item.title || 'SW');
    const img = item.poster || item.image || item.thumbnail || defaultImg;
    const avg = item.ratingAvg ? Number(item.ratingAvg).toFixed(1) : null;

    return `
        <div class="card ${item.isVip ? 'is-vip' : ''} ${extraClass}" data-id="${esc(item.id)}">
            <button class="card-fav ${isFav ? 'active' : ''}" onclick="toggleFav(event,'${esc(item.id)}')" title="المفضلة">
                <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
            </button>
            <div class="card-thumb" onclick="openPlayer('${esc(item.id)}','vod')">
                <img src="${esc(img)}" alt="${esc(item.title)}" loading="lazy" onerror="this.src='${defaultImg}'">
                <div class="card-overlay"><div class="card-play"><i class="fa-solid fa-play"></i></div></div>
                ${item.isVip ? '<div class="card-badge vip"><i class="fa-solid fa-crown"></i> VIP</div>' : ''}
                ${item.isNew ? '<div class="card-badge new">جديد</div>' : ''}
                ${item.category ? `<div class="card-badge cat">${esc(item.category)}</div>` : ''}
                ${item.episode ? `<div class="card-badge episode">الحلقة ${esc(item.episode)}</div>` : ''}
            </div>
            <div class="card-info">
                <div class="card-title">${esc(item.title)}</div>
                <div class="card-meta">
                    <span><i class="fa-regular fa-eye"></i> ${item.views || 0}</span>
                    ${avg ? `<span class="card-rating"><i class="fa-solid fa-star"></i> ${avg}</span>` : `<span>${item.year || ''}</span>`}
                </div>
            </div>
        </div>`;
}

/* ---------- 12. CONTINUE WATCHING ---------- */
function renderContinueWatching() {
    const sec = $('#continueSection');
    const scroll = $('#continueScroll');
    if (!sec || !scroll) return;

    const list = state.history.filter(x => (x.progress || 0) < 95).slice(0, 12);
    if (list.length === 0) { sec.style.display = 'none'; return; }
    sec.style.display = 'block';
    scroll.innerHTML = list.map(item => `
        <div class="card row-card" onclick="openPlayer('${esc(item.id)}','vod')">
            <div class="card-thumb">
                <img src="${esc(item.image || 'https://via.placeholder.com/220x320')}" alt="${esc(item.title)}" onerror="this.src='https://via.placeholder.com/220x320'">
                <div class="card-progress"><div class="cp-fill" style="width:${item.progress || 0}%"></div></div>
                <button class="card-remove" onclick="removeFromHistory(event,'${esc(item.id)}')"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="card-info">
                <div class="card-title">${esc(item.title)}</div>
                <div class="card-meta"><span>${Math.round(item.progress || 0)}%</span></div>
            </div>
        </div>
    `).join('');
}

function removeFromHistory(e, id) {
    e.stopPropagation();
    state.history = state.history.filter(x => x.id !== id);
    localStorage.setItem('sw_history', JSON.stringify(state.history));
    renderContinueWatching();
}

/* ---------- 13. LIVE ---------- */
function renderLiveTabs() {
    const tabs = $('#liveTabs');
    if (!tabs) return;
    let html = '<button class="row-action" data-livetab="all"><span>الكل</span></button>';
    state.liveCategories.forEach(c => {
        if (c.name) html += `<button class="row-action" data-livetab="${esc(c.name)}"><span>${esc(c.name)}</span></button>`;
    });
    tabs.innerHTML = html;
}

function renderLive() {
    const grid = $('#liveGrid');
    if (!grid) return;
    grid.innerHTML = state.liveChannels.map(ch => {
        const name = ch.name || ch.title || 'قناة';
        const logo = ch.logo || ch.image || 'https://via.placeholder.com/300x168/0f1117/ef4444?text=' + encodeURIComponent(name);
        return `
            <div class="card landscape ${ch.isVip ? 'is-vip' : ''}" onclick="openPlayer('${esc(ch.id)}','live')">
                <div class="card-thumb">
                    <img src="${esc(logo)}" alt="${esc(name)}" loading="lazy">
                    <div class="card-badge live">مباشر</div>
                    ${ch.isVip ? '<div class="card-badge vip" style="top:8px;right:8px"><i class="fa-solid fa-crown"></i></div>' : ''}
                </div>
                <div class="card-info">
                    <div class="card-title">${esc(name)}</div>
                    <div class="card-meta"><span><i class="fa-solid fa-tv"></i> ${esc(ch.category || 'بث')}</span></div>
                </div>
            </div>`;
    }).join('');
}

/* ---------- 14. FAVORITES ---------- */
function toggleFav(e, id) {
    e.stopPropagation();
    const idx = state.favorites.indexOf(id);
    if (idx > -1) { state.favorites.splice(idx, 1); toast('تمت الإزالة من المفضلة', 'warn'); }
    else { state.favorites.push(id); toast('تمت الإضافة للمفضلة', 'ok'); checkAchievement('first_fav'); }
    localStorage.setItem('sw_favs', JSON.stringify(state.favorites));
    renderAll();
    renderHero();
    if (state.currentPlayerItem && state.currentPlayerItem.id === id) updatePlayerFavBtn();
}

/* ---------- 15. VIEW SWITCHER ---------- */
function setActiveView(view) {
    state.activeTab = view;
    $$('.nav-link').forEach(b => b.classList.toggle('active', b.dataset.nav === view));
    $$('.bn-item').forEach(b => b.classList.toggle('active', b.dataset.bn === view));

    const liveSection = $('#liveSection');
    const dyn = $('#dynamicSections');
    const cont = $('#continueSection');

    if (view === 'live') {
        if (dyn) dyn.style.display = 'none';
        if (cont) cont.style.display = 'none';
        if (liveSection) liveSection.style.display = 'block';
        $('#heroSection')?.classList.remove('show');
    } else {
        if (dyn) dyn.style.display = 'block';
        if (cont) cont.style.display = state.history.filter(x => (x.progress || 0) < 95).length ? 'block' : 'none';
        if (liveSection) liveSection.style.display = 'none';
        renderHero();
    }

    // Filter videos by category for movies/series/vip tabs
    if (view === 'movies' || view === 'series') {
        const filtered = state.videos.filter(v => (v.category || '').includes(view === 'movies' ? 'فيلم' : 'مسلسل'));
        if (filtered.length > 0) {
            $('#sectionDetailTitle').textContent = view === 'movies' ? 'أفلام' : 'مسلسلات';
            $('#sectionDetailCount').textContent = `${filtered.length} عنصر`;
            $('#sectionDetailGrid').innerHTML = filtered.map(it => renderCard(it)).join('');
            openModal('sectionModal');
        }
    } else if (view === 'vip') {
        const filtered = state.videos.filter(v => v.isVip);
        $('#sectionDetailTitle').textContent = 'محتوى VIP';
        $('#sectionDetailCount').textContent = `${filtered.length} عنصر`;
        $('#sectionDetailGrid').innerHTML = filtered.map(it => renderCard(it)).join('');
        openModal('sectionModal');
    }
}

/* ---------- 16. SEARCH (Feature #8) ---------- */
const performSearch = debounce(() => {
    const q = (state.searchQuery || '').trim().toLowerCase();
    if (!q) { renderAll(); renderHero(); closeModal('sectionModal'); return; }

    const results = state.videos.filter(v =>
        (v.title || '').toLowerCase().includes(q) ||
        (v.description || '').toLowerCase().includes(q) ||
        (v.category || '').toLowerCase().includes(q)
    );

    $('#sectionDetailTitle').textContent = `نتائج البحث: "${q}"`;
    $('#sectionDetailCount').textContent = `${results.length} نتيجة`;
    $('#sectionDetailGrid').innerHTML = results.length === 0
        ? `<div class="empty-state"><i class="fa-solid fa-search"></i><h3>لا توجد نتائج</h3><p>جرّب كلمة بحث أخرى</p></div>`
        : results.map(it => renderCard(it)).join('');
    openModal('sectionModal');
}, 500);

/* ---------- 17. PLAYER ---------- */
async function openPlayer(id, type = 'vod') {
    let item = null;
    if (type === 'live') item = state.liveChannels.find(c => c.id === id);
    else item = state.videos.find(v => v.id === id);

    if (!item) { toast('المحتوى غير موجود', 'err'); return; }

    if (!state.currentUser) {
        toast('سجل دخول للمشاهدة', 'warn', 'مطلوب تسجيل دخول');
        openAuthModal('login');
        return;
    }

    if (item.isVip && !getUserVip(state.userData)) {
        openSubModal();
        toast('هذا المحتوى لـ VIP فقط', 'warn');
        return;
    }

    state.currentPlayerItem = item;
    state.playerType = type;

    $('#playerTitle').textContent = item.title || item.name || 'عرض';
    $('#playerViews').textContent = (item.views || 0) + 1;
    $('#playerCategory').textContent = item.category || (type === 'live' ? 'بث مباشر' : 'عام');
    $('#playerDesc').textContent = item.description || 'لا يوجد وصف.';
    $('#playerBadges').innerHTML = item.isVip
        ? '<span class="card-badge vip" style="position:static;display:inline-flex"><i class="fa-solid fa-crown"></i> VIP</span>'
        : '';

    if (type === 'vod') {
        $('#ratingBlock').style.display = 'flex';
        $('.comments-block').style.display = 'block';
        setupRating(item.id);
        setupComments(item.id);
        db.ref('videos/' + id + '/views').transaction(v => (v || 0) + 1);
        const existing = state.history.find(h => h.id === id);
        const startAt = existing && existing.progress < 95 ? existing.currentTime : 0;
        saveHistory(item, startAt, 0);
    } else {
        $('#ratingBlock').style.display = 'none';
        $('.comments-block').style.display = 'none';
    }

    setupServers(item, type);
    $('#playerDlBtn').onclick = () => openDownloadModal(item.id);
    updatePlayerFavBtn();
    $('#playerShareBtn').onclick = () => shareItem(item, type);

    openModal('playerModal');

    if (type === 'vod') {
        const existing = state.history.find(h => h.id === id);
        if (existing && existing.currentTime > 0 && existing.progress < 95) {
            setTimeout(() => {
                if (state.currentVideoEl && state.currentVideoEl.duration) {
                    try { state.currentVideoEl.currentTime = existing.currentTime; } catch (e) { }
                }
            }, 1500);
        }
    }
}

function updatePlayerFavBtn() {
    const btn = $('#playerFavBtn');
    if (!btn || !state.currentPlayerItem) return;
    const isFav = state.favorites.includes(state.currentPlayerItem.id);
    btn.className = `btn ${isFav ? 'btn-vip' : 'btn-outline'}`;
    btn.innerHTML = `<i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i> ${isFav ? 'في المفضلة' : 'المفضلة'}`;
    btn.onclick = (e) => toggleFav(e, state.currentPlayerItem.id);
}

function setupServers(item, type) {
    const block = $('#serversBlock');
    const grid = $('#serversGrid');
    grid.innerHTML = '';

    let servers = [];
    if (Array.isArray(item.servers) && item.servers.length > 0) {
        servers = item.servers.filter(s => s && (s.url || s.link));
    } else if (item.url || item.streamUrl || item.link) {
        servers = [{ name: 'السيرفر الرئيسي', url: item.url || item.streamUrl || item.link, type: item.streamType || 'auto' }];
    }

    if (servers.length === 0) { block.style.display = 'none'; renderPlayer('', 'auto'); return; }

    block.style.display = 'block';
    servers.forEach((s, i) => {
        const btn = document.createElement('button');
        btn.className = 'server-btn' + (i === 0 ? ' active' : '');
        btn.textContent = s.name || `سيرفر ${i + 1}`;
        btn.onclick = () => {
            $$('#serversGrid .server-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderPlayer(s.url, s.type || 'auto');
        };
        grid.appendChild(btn);
    });

    renderPlayer(servers[0].url, servers[0].type || 'auto');
}

function renderPlayer(url, type = 'auto') {
    destroyPlayer();
    const container = $('#playerContainer');
    container.innerHTML = '';

    if (!url) {
        container.innerHTML = `<div class="player-error"><i class="fa-solid fa-triangle-exclamation"></i><p>الرابط غير متوفر</p></div>`;
        return;
    }
    const cleanUrl = String(url).trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
        container.innerHTML = `<div class="player-error"><i class="fa-solid fa-link-slash"></i><p>رابط غير صالح</p></div>`;
        return;
    }

    const isHls = cleanUrl.includes('.m3u8') || type === 'hls';
    const isDash = cleanUrl.includes('.mpd') || type === 'dash';
    const isVideo = cleanUrl.match(/\.(mp4|webm|ogg|mov|mkv)(\?.*)?$/i) || type === 'video';

    if (isHls) {
        const video = document.createElement('video');
        video.controls = true; video.autoplay = true; video.playsInline = true;
        video.style.cssText = 'width:100%;height:100%;';
        container.appendChild(video);
        state.currentVideoEl = video;
        attachToolbar(container, video);
        attachProgressSaver(video);

        if (typeof Hls !== 'undefined' && Hls.isSupported()) {
            state.hlsInstance = new Hls({ enableWorker: true });
            state.hlsInstance.loadSource(cleanUrl);
            state.hlsInstance.attachMedia(video);
            state.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => { }));
            state.hlsInstance.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) container.innerHTML = `<div class="player-error"><i class="fa-solid fa-circle-exclamation"></i><p>خطأ في تحميل HLS</p></div>`;
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = cleanUrl;
            video.play().catch(() => { });
        }
    } else if (isDash) {
        const video = document.createElement('video');
        video.controls = true; video.autoplay = true; video.playsInline = true;
        video.style.cssText = 'width:100%;height:100%;';
        container.appendChild(video);
        state.currentVideoEl = video;
        attachToolbar(container, video);
        attachProgressSaver(video);
        if (typeof dashjs !== 'undefined') {
            state.dashInstance = dashjs.MediaPlayer().create();
            state.dashInstance.initialize(video, cleanUrl, true);
        }
    } else if (isVideo) {
        const video = document.createElement('video');
        video.controls = true; video.autoplay = true; video.playsInline = true;
        video.src = cleanUrl;
        video.style.cssText = 'width:100%;height:100%;';
        container.appendChild(video);
        state.currentVideoEl = video;
        attachToolbar(container, video);
        attachProgressSaver(video);
        video.play().catch(() => { });
    } else {
        const iframe = document.createElement('iframe');
        iframe.src = cleanUrl;
        iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
        iframe.allowFullscreen = true;
        container.appendChild(iframe);
    }
}

function attachToolbar(container, video) {
    const tb = document.createElement('div');
    tb.className = 'player-toolbar';
    tb.innerHTML = `
        <button class="player-tool" id="pipBtn" title="صورة داخل صورة"><i class="fa-solid fa-clone"></i></button>
        <button class="player-tool" id="speedBtn" title="السرعة"><i class="fa-solid fa-gauge-high"></i></button>
        <button class="player-tool" id="sleepBtn" title="مؤقت النوم"><i class="fa-solid fa-moon"></i></button>
    `;
    container.appendChild(tb);

    const speedMenu = document.createElement('div');
    speedMenu.className = 'speed-menu';
    [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].forEach(s => {
        const b = document.createElement('button');
        b.textContent = s + 'x';
        if (s === 1) b.classList.add('active');
        b.onclick = () => {
            video.playbackRate = s;
            speedMenu.querySelectorAll('button').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            speedMenu.classList.remove('show');
        };
        speedMenu.appendChild(b);
    });
    container.appendChild(speedMenu);

    tb.querySelector('#speedBtn').onclick = (e) => { e.stopPropagation(); speedMenu.classList.toggle('show'); };
    tb.querySelector('#pipBtn').onclick = async () => {
        try {
            if (document.pictureInPictureElement) await document.exitPictureInPicture();
            else if (video.requestPictureInPicture) await video.requestPictureInPicture();
        } catch (e) { toast('PiP غير مدعوم', 'warn'); }
    };
    tb.querySelector('#sleepBtn').onclick = () => showSleepTimerMenu(video);
    document.addEventListener('click', () => speedMenu.classList.remove('show'), { once: true });
}

/* ---------- 18. SLEEP TIMER (Feature #2) ---------- */
function showSleepTimerMenu(video) {
    const mins = prompt('مؤقت النوم (بالدقائق):\n0 = إلغاء', '30');
    if (mins === null) return;
    const m = parseInt(mins);
    if (state.sleepTimer) { clearTimeout(state.sleepTimer); state.sleepTimer = null; }
    if (!m || m <= 0) { toast('تم إلغاء مؤقت النوم', 'ok'); return; }
    state.sleepTimer = setTimeout(() => {
        if (state.currentVideoEl) state.currentVideoEl.pause();
        toast(`انتهى مؤقت النوم (${m} دقيقة)`, 'warn');
    }, m * 60000);
    toast(`⏰ سيتم إيقاف التشغيل بعد ${m} دقيقة`, 'ok');
}

function attachProgressSaver(video) {
    if (state.progressTimer) clearInterval(state.progressTimer);
    state.progressTimer = setInterval(() => {
        if (state.currentPlayerItem && video.currentTime > 5 && video.duration > 0 && !video.paused) {
            saveHistory(state.currentPlayerItem, video.currentTime, video.duration);
        }
    }, 8000);

    video.addEventListener('pause', () => {
        if (state.currentPlayerItem && video.duration > 0) saveHistory(state.currentPlayerItem, video.currentTime, video.duration);
    });

    /* Feature #3: Auto-play next episode */
    video.addEventListener('ended', () => {
        if (state.autoPlayNext && state.playerType === 'vod') playNextEpisode();
    });
}

function saveHistory(item, currentTime, duration) {
    const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
    state.history = state.history.filter(h => h.id !== item.id);
    state.history.unshift({
        id: item.id, title: item.title,
        image: item.poster || item.image || item.thumbnail,
        currentTime: currentTime || 0, duration: duration || 0,
        progress, time: Date.now()
    });
    if (state.history.length > 40) state.history.pop();
    localStorage.setItem('sw_history', JSON.stringify(state.history));
    renderContinueWatching();
    if (state.history.length >= 10) checkAchievement('ten_watches');
}

function destroyPlayer() {
    if (state.hlsInstance) { try { state.hlsInstance.destroy(); } catch (e) { } state.hlsInstance = null; }
    if (state.dashInstance) { try { state.dashInstance.reset(); } catch (e) { } state.dashInstance = null; }
    if (state.progressTimer) { clearInterval(state.progressTimer); state.progressTimer = null; }
    if (state.sleepTimer) { clearTimeout(state.sleepTimer); state.sleepTimer = null; }
    const c = $('#playerContainer');
    if (c) c.innerHTML = '';
    state.currentVideoEl = null;
}

function closePlayer() {
    if (state.currentVideoEl && state.currentPlayerItem && state.currentVideoEl.duration > 0) {
        saveHistory(state.currentPlayerItem, state.currentVideoEl.currentTime, state.currentVideoEl.duration);
    }
    if (state.currentVideoEl) {
        try { state.currentVideoEl.pause(); state.currentVideoEl.src = ''; } catch (e) { }
    }
    if (state.ratingsListenerRef) { state.ratingsListenerRef.off(); state.ratingsListenerRef = null; }
    if (state.commentsListenerRef) { state.commentsListenerRef.off(); state.commentsListenerRef = null; }
    destroyPlayer();
    closeModal('playerModal');
    state.currentPlayerItem = null;
}

/* ---------- 19. AUTO-PLAY NEXT EPISODE (Feature #3) ---------- */
function playNextEpisode() {
    const cur = state.currentPlayerItem;
    if (!cur || !cur.seriesId) return;
    const epNum = parseInt(cur.episode) || 0;
    const next = state.videos.find(v => v.seriesId === cur.seriesId && parseInt(v.episode) === epNum + 1);
    if (!next) { toast('لا توجد حلقة تالية', 'info'); return; }
    toast('⏭️ تشغيل الحلقة التالية...', 'ok');
    closePlayer();
    setTimeout(() => openPlayer(next.id, 'vod'), 800);
}

/* ---------- 20. RATINGS ---------- */
function setupRating(itemId) {
    const starsEl = $('#rbStars');
    const avgEl = $('#rbAvg');
    starsEl.querySelectorAll('i').forEach(i => i.className = 'fa-solid fa-star');

    if (state.ratingsListenerRef) state.ratingsListenerRef.off();
    state.ratingsListenerRef = db.ref('ratings/' + itemId);
    state.ratingsListenerRef.on('value', snap => {
        let count = 0, sum = 0, myVal = 0;
        if (snap.exists()) {
            snap.forEach(c => {
                const v = Number(c.val().value) || 0;
                if (v > 0) { count++; sum += v; }
                if (state.currentUser && c.key === state.currentUser.uid) myVal = v;
            });
        }
        if (count > 0) {
            const avg = sum / count;
            avgEl.innerHTML = `<strong>${avg.toFixed(1)}</strong> / 5 • ${count} تقييم`;
            starsEl.querySelectorAll('i').forEach(i => i.classList.toggle('active', Number(i.dataset.v) <= Math.round(avg)));
        } else {
            avgEl.textContent = 'لا توجد تقييمات';
            starsEl.querySelectorAll('i').forEach(i => i.classList.remove('active'));
        }
        if (myVal > 0) starsEl.querySelectorAll('i').forEach(i => { if (Number(i.dataset.v) === myVal) i.classList.add('active'); });
    });

    starsEl.querySelectorAll('i').forEach(star => {
        star.onclick = async () => {
            if (!state.currentUser) { toast('سجل دخول للتقييم', 'warn'); openAuthModal('login'); return; }
            const val = Number(star.dataset.v);
            try {
                await db.ref(`ratings/${itemId}/${state.currentUser.uid}`).set({ value: val, ts: Date.now() });
                const snap = await db.ref('ratings/' + itemId).once('value');
                let c = 0, s = 0;
                snap.forEach(x => { const v = Number(x.val().value) || 0; if (v > 0) { c++; s += v; } });
                if (c > 0) {
                    db.ref('videos/' + itemId + '/ratingAvg').set((s / c).toFixed(2));
                    db.ref('videos/' + itemId + '/ratingCount').set(c);
                }
                toast(`قيّمت بـ ${val} نجوم ⭐`, 'ok');
                checkAchievement('first_rating');
            } catch (e) { toast('فشل التقييم', 'err'); }
        };
        star.onmouseenter = () => starsEl.querySelectorAll('i').forEach(i => { if (Number(i.dataset.v) <= Number(star.dataset.v)) i.classList.add('hover'); });
        star.onmouseleave = () => starsEl.querySelectorAll('i').forEach(i => i.classList.remove('hover'));
    });
}

/* ---------- 21. COMMENTS ---------- */
function setupComments(itemId) {
    const listEl = $('#commentsList');
    const countEl = $('#commentsCount');
    listEl.innerHTML = '<div class="status-box"><div class="spinner"></div></div>';

    if (state.commentsListenerRef) state.commentsListenerRef.off();
    state.commentsListenerRef = db.ref('comments/' + itemId).limitToLast(80);
    state.commentsListenerRef.on('value', snap => {
        const arr = [];
        if (snap.exists()) snap.forEach(c => arr.push({ id: c.key, ...c.val() }));
        arr.sort((a, b) => (b.ts || 0) - (a.ts || 0));
        countEl.textContent = arr.length;
        if (arr.length === 0) {
            listEl.innerHTML = '<div class="status-box"><i class="fa-regular fa-comment empty-icon"></i><p>كن أول من يعلّق</p></div>';
            return;
        }
        listEl.innerHTML = arr.map(c => {
            const isOwner = state.currentUser && c.uid === state.currentUser.uid;
            const letter = (c.name || '?').trim().charAt(0).toUpperCase();
            return `<div class="comment-item">
                <div class="ci-avatar">${esc(letter)}</div>
                <div class="ci-body">
                    <div class="ci-head">
                        <span class="ci-name">${esc(c.name || 'مستخدم')}</span>
                        ${c.isVip ? '<span class="ci-vip">👑 VIP</span>' : ''}
                        <span class="ci-time">${fmtRel(c.ts)}</span>
                        ${isOwner ? `<button class="ci-del" onclick="deleteComment('${esc(itemId)}','${esc(c.id)}')"><i class="fa-solid fa-trash"></i></button>` : ''}
                    </div>
                    <div class="ci-text">${esc(c.text)}</div>
                </div>
            </div>`;
        }).join('');
    });
}

async function sendComment() {
    if (!state.currentUser) { toast('سجل دخول للتعليق', 'warn'); openAuthModal('login'); return; }
    if (!state.currentPlayerItem) return;
    const input = $('#commentInput');
    const text = input.value.trim();
    if (!text) return;
    if (text.length > 300) { toast('التعليق طويل جداً', 'warn'); return; }
    input.value = '';
    try {
        await db.ref('comments/' + state.currentPlayerItem.id).push({
            uid: state.currentUser.uid,
            name: state.userData ? state.userData.name : 'مستخدم',
            isVip: getUserVip(state.userData),
            text, ts: Date.now()
        });
        checkAchievement('first_comment');
    } catch (e) { toast('فشل إرسال التعليق', 'err'); }
}

async function deleteComment(itemId, commentId) {
    const ok = await askConfirm({ title: 'حذف', msg: 'حذف تعليقك؟' });
    if (ok) { await db.ref(`comments/${itemId}/${commentId}`).remove(); toast('تم الحذف', 'ok'); }
}

/* ---------- 22. DOWNLOAD ---------- */
function openDownloadModal(id) {
    const item = state.videos.find(v => v.id === id);
    if (!item) { toast('غير موجود', 'err'); return; }
    if (!state.currentUser) { toast('سجل دخول للتحميل', 'warn'); openAuthModal('login'); return; }

    const url = item.downloadUrl || item.url || '';
    const card = $('#dlModalCard');
    card.innerHTML = `
        <button class="modal-close" data-close="dlModal"><i class="fa-solid fa-xmark"></i></button>
        <div class="dl-hero">
            <div class="dl-icon"><i class="fa-solid fa-download"></i></div>
            <h3>تحميل: ${esc(item.title)}</h3>
            <p>اختر وسيلة التحميل</p>
        </div>
        <div class="dl-options">
            <button class="dl-opt vip" id="dlVip">
                <div class="dl-opt-icon"><i class="fa-solid fa-bolt"></i></div>
                <div class="dl-opt-text">
                    <div class="dl-opt-title">تحميل فوري VIP</div>
                    <div class="dl-opt-sub">بدون انتظار - روابط سريعة</div>
                </div>
            </button>
            <button class="dl-opt free" id="dlFree">
                <div class="dl-opt-icon"><i class="fa-solid fa-hourglass-half"></i></div>
                <div class="dl-opt-text">
                    <div class="dl-opt-title">تحميل مجاني (15 ثانية)</div>
                    <div class="dl-opt-sub">رابط عادي مع إعلان</div>
                </div>
            </button>
        </div>
        <div id="dlTimerArea"></div>`;

    $('#dlVip').onclick = () => {
        if (!getUserVip(state.userData)) { openSubModal(); toast('متاح لـ VIP فقط', 'warn'); return; }
        if (!url) { toast('رابط التحميل غير متوفر', 'err'); return; }
        toast('جاري التحميل...', 'ok');
        window.open(url, '_blank');
    };
    $('#dlFree').onclick = () => startFreeDownload(url);
    card.querySelector('[data-close]').onclick = () => closeModal('dlModal');

    openModal('dlModal');
}

function startFreeDownload(url) {
    if (!url) { toast('رابط غير متوفر', 'err'); return; }
    const area = $('#dlTimerArea');
    let sec = 15;
    area.innerHTML = `
        <div class="countdown-wrap">
            <div class="countdown-circle" id="cdCircle"><span class="countdown-num" id="cdNum">15</span></div>
            <p class="countdown-txt">جاري تحضير الرابط...</p>
        </div>
        <button class="dl-ready-btn" id="dlReady"><i class="fa-solid fa-cloud-arrow-down"></i> اضغط للتحميل</button>`;
    $('#dlReady').onclick = () => window.open(url, '_blank');
    const timer = setInterval(() => {
        sec--;
        const num = $('#cdNum'), circ = $('#cdCircle');
        if (num) num.textContent = sec;
        if (circ) circ.style.setProperty('--progress', `${((15 - sec) / 15) * 100}%`);
        if (sec <= 0) {
            clearInterval(timer);
            const b = $('#dlReady');
            if (b) b.classList.add('show');
            toast('الرابط جاهز', 'ok');
        }
    }, 1000);
}

/* ---------- 23. SHARE (Feature #7) ---------- */
async function shareItem(item, type) {
    const url = location.origin + location.pathname + `#${type === 'live' ? 'live' : 'watch'}=${item.id}`;
    const shareData = {
        title: item.title || item.name,
        text: `شاهد "${item.title || item.name}" على سيرفر الوحش 🐺`,
        url
    };
    try {
        if (navigator.share) await navigator.share(shareData);
        else { await navigator.clipboard.writeText(url); toast('تم نسخ الرابط', 'ok'); }
    } catch (e) { }
}

/* ---------- 24. PROFILE ---------- */
function openProfileModal() {
    if (!state.userData) return;
    const u = state.userData;
    const lvl = getUserLevel(u);
    const isVip = getUserVip(u);
    const exp = getUserExp(u);

    $('#profileAvatar').textContent = (u.name || '?').trim().charAt(0).toUpperCase();
    $('#profileName').textContent = u.name || 'مستخدم';
    $('#profileEmail').textContent = u.email || '---';
    $('#profileLevelWrap').innerHTML = `<span class="tag ${isVip ? 'vip' : 'free'}">${lvl.label}</span>`;

    $('#profileSubStatus').textContent = isVip ? 'VIP' : 'عادي';
    $('#profileExpireDate').textContent = exp ? fmtDate(exp) : '—';
    if (isVip && exp > 0) {
        const days = Math.ceil((exp - Date.now()) / 86400000);
        $('#profileDaysLeft').textContent = days + ' يوم';
    } else {
        $('#profileDaysLeft').textContent = isVip ? 'دائم' : '0';
    }
    $('#profileFavCount').textContent = state.favorites.length;

    const box = $('#profileVipStatus');
    if (state.vipStatus && state.vipStatus.status === 'pending') {
        box.innerHTML = `<div class="vip-status-card pending">
            <div class="vsc-icon"><i class="fa-solid fa-hourglass-half"></i></div>
            <div><div class="vsc-title">طلب VIP قيد المراجعة</div>
            <div class="vsc-sub">سيتم التفعيل قريباً</div></div>
        </div>`;
    } else box.innerHTML = '';

    openModal('profileModal');
}

/* ---------- 25. VIP MODAL ---------- */
function openSubModal() {
    const box = $('#subModalStatusBox');
    if (state.vipStatus && state.vipStatus.status === 'pending') {
        box.innerHTML = `<div class="vip-status-card pending">
            <div class="vsc-icon"><i class="fa-solid fa-hourglass-half"></i></div>
            <div><div class="vsc-title">طلبك قيد المراجعة</div>
            <div class="vsc-sub">تم الإرسال للإدارة</div></div>
        </div>`;
    } else box.innerHTML = '';
    openModal('subModal');
}

async function requestVip() {
    const num = state.settings.whatsappNumber || '201000000000';
    const msg = encodeURIComponent(`مرحباً، أريد الاشتراك في VIP.\nالبريد: ${state.currentUser?.email || '—'}`);
    if (state.currentUser) {
        try {
            await db.ref('vipRequests').push({
                uid: state.currentUser.uid,
                email: state.currentUser.email,
                name: state.userData?.name || '',
                status: 'pending',
                createdAt: Date.now()
            });
            toast('تم تسجيل طلبك', 'ok');
        } catch (e) { console.error(e); }
    }
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
}

/* ---------- 26. NOTIFICATIONS ---------- */
function renderNotifList() {
    const list = $('#notifList');
    if (!list) return;
    if (state.notifications.length === 0) {
        list.innerHTML = '<div class="status-box"><i class="fa-solid fa-bell-slash empty-icon"></i><p>لا توجد إشعارات</p></div>';
        return;
    }
    list.innerHTML = state.notifications.map(n => `
        <div class="notif-item">
            <div class="ni-icon"><i class="fa-solid ${n.type === 'vip' ? 'fa-crown' : n.type === 'banned' ? 'fa-ban' : 'fa-bell'}"></i></div>
            <div class="ni-body">
                <div class="ni-title">${esc(n.title || 'إشعار')}</div>
                <div class="ni-text">${esc(n.text || '')}</div>
                <div class="ni-time">${fmtRel(n.createdAt)}</div>
            </div>
        </div>
    `).join('');
}

function openNotifModal() {
    openModal('notifModal');
    if (state.currentUser) {
        db.ref('notifications/' + state.currentUser.uid).once('value').then(snap => {
            if (snap.exists()) {
                const updates = {};
                snap.forEach(c => { if (!c.val().read) updates[c.key + '/read'] = true; });
                if (Object.keys(updates).length) db.ref('notifications/' + state.currentUser.uid).update(updates);
            }
        });
    }
}

/* ---------- 27. HISTORY MODAL ---------- */
function openHistoryModal() {
    const list = $('#historyList');
    if (state.history.length === 0) {
        list.innerHTML = '<div class="status-box"><i class="fa-solid fa-clock empty-icon"></i><p>السجل فارغ</p></div>';
    } else {
        list.innerHTML = state.history.map(it => `
            <div class="history-item">
                <div class="hi-thumb"><img src="${esc(it.image || 'https://via.placeholder.com/80x50')}" alt=""></div>
                <div class="hi-body">
                    <div class="hi-title">${esc(it.title)}</div>
                    <div class="hi-time">${fmtRel(it.time)} • ${Math.round(it.progress || 0)}%</div>
                </div>
                <div class="hi-actions">
                    <button class="hi-btn" onclick="closeModal('historyModal');openPlayer('${esc(it.id)}','vod')"><i class="fa-solid fa-play"></i></button>
                    <button class="hi-btn danger" onclick="removeHistoryItem('${esc(it.id)}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    }
    openModal('historyModal');
}

function removeHistoryItem(id) {
    state.history = state.history.filter(h => h.id !== id);
    localStorage.setItem('sw_history', JSON.stringify(state.history));
    openHistoryModal();
    renderContinueWatching();
}

async function clearAllHistory() {
    const ok = await askConfirm({ title: 'مسح السجل', msg: 'مسح كل السجل؟' });
    if (ok) {
        state.history = [];
        localStorage.removeItem('sw_history');
        openHistoryModal();
        renderContinueWatching();
        toast('تم مسح السجل', 'ok');
    }
}

/* ---------- 28. SECTION DETAIL ---------- */
function openSectionDetail(secId) {
    const sec = state.sections.find(s => s.id === secId);
    if (!sec) return;
    const items = getItemsForSection(sec);
    $('#sectionDetailTitle').textContent = sec.title || 'قسم';
    $('#sectionDetailCount').textContent = `${items.length} عنصر`;
    $('#sectionDetailGrid').innerHTML = items.map(it => renderCard(it)).join('');
    openModal('sectionModal');
}

function showAllInRow(type) {
    let items = state.videos.slice();
    let title = 'الكل';
    if (type === 'trending') { items.sort((a, b) => (b.views || 0) - (a.views || 0)); title = 'الأكثر مشاهدة'; }
    else if (type === 'newest') { items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); title = 'أحدث الإضافات'; }
    else if (type === 'vip') { items = items.filter(i => i.isVip); title = 'محتوى VIP'; }
    $('#sectionDetailTitle').textContent = title;
    $('#sectionDetailCount').textContent = `${items.length} عنصر`;
    $('#sectionDetailGrid').innerHTML = items.map(it => renderCard(it)).join('');
    openModal('sectionModal');
}

function showItemDetails(id) {
    const item = state.videos.find(v => v.id === id);
    if (!item) return;
    $('#sectionDetailTitle').textContent = item.title;
    $('#sectionDetailCount').textContent = item.category || '';
    $('#sectionDetailGrid').innerHTML = `<div style="grid-column:1/-1">${renderCard(item)}</div>`;
    openModal('sectionModal');
}

/* ---------- 29. ACHIEVEMENTS (Feature #4) ---------- */
const ACHIEVEMENTS = {
    first_fav: { title: 'المفضلة الأولى', icon: 'fa-heart', desc: 'أضفت أول عنصر للمفضلة' },
    first_rating: { title: 'أول تقييم', icon: 'fa-star', desc: 'قيّمت محتوى لأول مرة' },
    ten_watches: { title: 'مشاهد نشيط', icon: 'fa-eye', desc: 'شاهدت 10 محتويات' },
    vip_member: { title: 'عضو VIP', icon: 'fa-crown', desc: 'أصبحت عضو VIP' },
    first_comment: { title: 'صوتك مسموع', icon: 'fa-comment', desc: 'علّقت لأول مرة' }
};

function checkAchievement(key) {
    if (!state.currentUser || !ACHIEVEMENTS[key]) return;
    db.ref(`achievements/${state.currentUser.uid}/${key}`).once('value').then(snap => {
        if (!snap.exists()) {
            db.ref(`achievements/${state.currentUser.uid}/${key}`).set({ unlockedAt: Date.now() });
            toast(`🏆 إنجاز جديد: ${ACHIEVEMENTS[key].title}`, 'ok');
        }
    });
}

function checkAchievements() {
    if (!state.achievements || !state.userData) return;
    if (getUserVip(state.userData)) checkAchievement('vip_member');
    if (state.history.length >= 10) checkAchievement('ten_watches');
}

/* ---------- 30. LIVE CHAT (Feature #5) ---------- */
function setupLiveChat() {
    const chat = $('#liveChatMessages');
    if (!chat) return;
    const roomRef = db.ref('chat/' + state.chatRoom).limitToLast(50);
    roomRef.on('child_added', snap => appendChatMessage(snap.val()));
}

function appendChatMessage(msg) {
    const chat = $('#liveChatMessages');
    if (!chat) return;
    const isMine = state.currentUser && msg.uid === state.currentUser.uid;
    const el = document.createElement('div');
    el.className = 'chat-msg' + (isMine ? ' mine' : '');
    el.innerHTML = `<strong>${esc(msg.name)}:</strong> <span>${esc(msg.text)}</span>`;
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
}

async function sendChatMessage() {
    if (!state.currentUser) { toast('سجل دخول للدردشة', 'warn'); return; }
    const input = $('#chatInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    await db.ref('chat/' + state.chatRoom).push({
        uid: state.currentUser.uid,
        name: state.userData?.name || 'مستخدم',
        text, ts: Date.now()
    });
}

/* ---------- 31. WATCHLISTS (Feature #6) ---------- */
async function createWatchlist(name) {
    if (!state.currentUser || !name) return;
    const ref = db.ref('watchlists/' + state.currentUser.uid).push();
    await ref.set({ name, items: [], createdAt: Date.now() });
    toast('تم إنشاء القائمة', 'ok');
}

async function addToWatchlist(listId, itemId) {
    if (!state.currentUser) return;
    const ref = db.ref(`watchlists/${state.currentUser.uid}/${listId}/items`);
    const snap = await ref.once('value');
    const items = snap.val() || [];
    if (!items.includes(itemId)) {
        items.push(itemId);
        await ref.set(items);
        toast('تمت الإضافة للقائمة', 'ok');
    }
}

/* ---------- 32. EVENT HANDLERS ---------- */
function initEventHandlers() {
    $$('.nav-link').forEach(b => b.onclick = () => setActiveView(b.dataset.nav));
    $$('.bn-item').forEach(b => b.onclick = () => {
        const bn = b.dataset.bn;
        if (bn === 'search') { $('#mobileSearch').classList.toggle('open'); setTimeout(() => $('#mobileSearchInput')?.focus(), 100); }
        else if (bn === 'profile') { state.currentUser ? openProfileModal() : openAuthModal('login'); }
        else setActiveView(bn);
    });

    const si = $('#searchInput');
    const msi = $('#mobileSearchInput');
    if (si) si.oninput = (e) => { state.searchQuery = e.target.value; $('#searchClear').classList.toggle('show', !!e.target.value); performSearch(); };
    if (msi) msi.oninput = (e) => { state.searchQuery = e.target.value; performSearch(); };
    $('#searchClear')?.addEventListener('click', () => { si.value = ''; state.searchQuery = ''; $('#searchClear').classList.remove('show'); renderAll(); renderHero(); closeModal('sectionModal'); });
    $('#mobileSearchClear')?.addEventListener('click', () => { msi.value = ''; state.searchQuery = ''; renderAll(); renderHero(); closeModal('sectionModal'); });

    $('#authForm')?.addEventListener('submit', handleAuthSubmit);
    $('#authToggleBtn')?.addEventListener('click', e => { e.preventDefault(); openAuthModal(state.authMode === 'login' ? 'register' : 'login'); });
    $('#forgotPassLink')?.addEventListener('click', handleForgotPass);
    $('#btnRequestVip')?.addEventListener('click', requestVip);
    $('#openHistoryBtn')?.addEventListener('click', openHistoryModal);
    $('#commentSendBtn')?.addEventListener('click', sendComment);
    $('#commentInput')?.addEventListener('keypress', e => { if (e.key === 'Enter') sendComment(); });

    $('#cfYes')?.addEventListener('click', () => { closeModal('confirmModal'); if (confirmResolver) { confirmResolver(true); confirmResolver = null; } });
    $('#cfNo')?.addEventListener('click', () => { closeModal('confirmModal'); if (confirmResolver) { confirmResolver(false); confirmResolver = null; } });

    $$('[data-close]').forEach(b => b.onclick = () => closeModal(b.dataset.close));
    $$('.modal').forEach(m => {
        m.addEventListener('click', e => {
            if (e.target === m) { if (m.id === 'playerModal') closePlayer(); else m.classList.remove('active'); }
        });
    });

    document.addEventListener('keydown', handleKeyboard);
    window.addEventListener('scroll', () => { $('#mainNavbar')?.classList.toggle('scrolled', window.scrollY > 30); });

    handleUrlHash();
    window.addEventListener('hashchange', handleUrlHash);

    const y = $('#yearSpan');
    if (y) y.textContent = new Date().getFullYear();

    setupLiveChat();
    $('#chatSendBtn')?.addEventListener('click', sendChatMessage);
    $('#chatInput')?.addEventListener('keypress', e => { if (e.key === 'Enter') sendChatMessage(); });
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = $('#authEmail').value.trim();
    const pass = $('#authPassword').value;
    const name = $('#authName').value.trim();
    const btn = $('#authSubmitBtn');
    btn.disabled = true;

    try {
        if (state.authMode === 'login') {
            await auth.signInWithEmailAndPassword(email, pass);
            toast('تم تسجيل الدخول ✅', 'ok');
        } else {
            if (!name) { toast('أدخل اسمك', 'warn'); btn.disabled = false; return; }
            const res = await auth.createUserWithEmailAndPassword(email, pass);
            await res.user.updateProfile({ displayName: name });
            await db.ref('users/' + res.user.uid).set({
                email, name,
                isBanned: false, isBlocked: false, isVip: false,
                vipExpireDate: 0, expireAt: 0, createdAt: Date.now()
            });
            await db.ref('notifications/' + res.user.uid).push({
                title: 'أهلاً بك في سيرفر الوحش 🐺',
                text: 'استمتع بمشاهدة المحتوى. ترقّ إلى VIP لفتح كل المميز!',
                type: 'welcome', read: false, createdAt: Date.now()
            });
            toast('تم إنشاء الحساب ✅', 'ok');
        }
        closeModal('authModal');
        $('#authForm').reset();
    } catch (err) {
        toast(err.message, 'err', 'خطأ');
    } finally { btn.disabled = false; }
}

async function handleForgotPass(e) {
    e.preventDefault();
    const email = $('#authEmail').value.trim();
    if (!email) { toast('اكتب بريدك أولاً', 'warn'); return; }
    try { await auth.sendPasswordResetEmail(email); toast('تم إرسال رابط إعادة الضبط', 'ok'); }
    catch (err) { toast(err.message, 'err'); }
}

function handleKeyboard(e) {
    if (!$('#playerModal')?.classList.contains('active') || !state.currentVideoEl) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const v = state.currentVideoEl;
    switch (e.key) {
        case ' ': e.preventDefault(); v.paused ? v.play() : v.pause(); break;
        case 'ArrowRight': v.currentTime += 5; break;
        case 'ArrowLeft': v.currentTime -= 5; break;
        case 'ArrowUp': e.preventDefault(); v.volume = Math.min(1, v.volume + .1); break;
        case 'ArrowDown': e.preventDefault(); v.volume = Math.max(0, v.volume - .1); break;
        case 'm': case 'M': v.muted = !v.muted; break;
        case 'f': case 'F': document.fullscreenElement ? document.exitFullscreen?.() : v.requestFullscreen?.(); break;
    }
}

function handleUrlHash() {
    const hash = location.hash;
    if (hash.startsWith('#watch=')) {
        const id = hash.replace('#watch=', '');
        setTimeout(() => openPlayer(id, 'vod'), 900);
    } else if (hash.startsWith('#live=')) {
        const id = hash.replace('#live=', '');
        setTimeout(() => openPlayer(id, 'live'), 900);
    }
}

function openPage(page) { toast('سيتم إضافة صفحة "' + page + '" قريباً', 'info'); }
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); setActiveView('home'); }

/* ---------- 33. BOOT ---------- */
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    renderNavActions();
    updateGuestWarn();
    initEventHandlers();
    fetchAll();
    renderContinueWatching();
    setTimeout(hideLoader, 1200);
});
