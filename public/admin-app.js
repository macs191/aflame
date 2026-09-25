/* ============================================================
   سيرفر الوحش 🐺 — Admin App Part 1
   Core / Login / Navigation / Dashboard / Media / Users / Categories
   ============================================================ */

/* ---------- FIREBASE ---------- */
const firebaseConfig = {
    apiKey:"AIzaSyC9cmh_bzA4ZeV8bYlbqaGrmIri2PUGx2A",
    authDomain:"voip17.firebaseapp.com",
    databaseURL:"https://voip17-default-rtdb.firebaseio.com",
    projectId:"voip17",
    storageBucket:"voip17.firebasestorage.app",
    messagingSenderId:"608379006778",
    appId:"1:608379006778:web:51fe8032d09fbd5b556a03"
};
if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* ---------- GLOBAL HELPERS ---------- */
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const debounce = (fn,ms=220)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);};};
const fmtDate = ts => ts ? new Date(ts).toLocaleDateString('ar-EG',{year:'numeric',month:'short',day:'numeric'}) : '—';
const fmtTime = ts => ts ? new Date(ts).toLocaleString('ar-EG',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
const timeAgo = ts => {
    if(!ts) return '—';
    const d = Date.now() - ts;
    const m = Math.floor(d/60000);
    if(m < 1) return 'الآن';
    if(m < 60) return `منذ ${m} دقيقة`;
    const h = Math.floor(m/60);
    if(h < 24) return `منذ ${h} ساعة`;
    const days = Math.floor(h/24);
    if(days < 30) return `منذ ${days} يوم`;
    return fmtDate(ts);
};
const userExpire = u => (u && (u.vipExpireDate || u.expireAt || 0)) || 0;
const userIsBanned = u => !!(u && (u.isBanned === true || u.isBlocked === true));
const userIsVipNow = u => {
    if(!u) return false;
    const e = userExpire(u);
    if(e > 0) return e > Date.now();
    return u.isVip === true;
};

/* ---------- TOAST ---------- */
function toast(title,msg='',type='',dur=3500){
    const wrap = $('#toasts');
    if(!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    const icon = type==='ok'?'fa-circle-check':type==='err'?'fa-circle-exclamation':type==='warn'?'fa-triangle-exclamation':'fa-circle-info';
    el.innerHTML = `<div class="toast-i"><i class="fa-solid ${icon}"></i></div><div class="toast-body"><div class="toast-title">${esc(title)}</div>${msg?`<div class="toast-msg">${esc(msg)}</div>`:''}</div>`;
    wrap.appendChild(el);
    setTimeout(()=>{
        el.style.transition='opacity .3s, transform .3s';
        el.style.opacity='0';
        el.style.transform='translateY(-10px)';
        setTimeout(()=>el.remove(),320);
    },dur);
}

/* ---------- MODALS ---------- */
function openModal(id){
    const m = document.getElementById(id);
    if(!m) return;
    m.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeModal(id){
    const m = document.getElementById(id);
    if(!m) return;
    m.classList.remove('active');
    if(!$$('.modal.active').length) document.body.style.overflow = '';
}
let confirmResolver = null;
function askConfirm({title='تأكيد',msg='هل أنت متأكد؟',okText='تأكيد',type='red'}={}){
    return new Promise(res=>{
        $('#cfTitle').textContent = title;
        $('#cfMsg').textContent = msg;
        $('#cfYes').innerHTML = `<i class="fa-solid fa-check"></i> ${esc(okText)}`;
        const ib = $('#cfIcon');
        ib.className = 'mi';
        if(type === 'gold') ib.classList.add('gold');
        if(type === 'green') ib.classList.add('green');
        if(type === 'warn') ib.classList.add('warn');
        openModal('mConfirm');
        confirmResolver = res;
    });
}
$('#cfYes').addEventListener('click',()=>{
    closeModal('mConfirm');
    if(confirmResolver){ confirmResolver(true); confirmResolver = null; }
});
$('#mConfirm').addEventListener('click',e=>{
    if(e.target.id === 'mConfirm' && confirmResolver){
        confirmResolver(false);
        confirmResolver = null;
    }
});
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
$$('.modal').forEach(m=>m.addEventListener('click',e=>{
    if(e.target === m){
        if(m.id === 'mConfirm' && confirmResolver){
            confirmResolver(false);
            confirmResolver = null;
        }
        closeModal(m.id);
    }
}));
document.addEventListener('keydown',e=>{
    if(e.key === 'Escape'){
        const act = $$('.modal.active').pop();
        if(act){
            if(act.id === 'mConfirm' && confirmResolver){
                confirmResolver(false);
                confirmResolver = null;
            }
            closeModal(act.id);
        }
    }
});

/* ---------- LOGIN ---------- */
const DEFAULT_PIN = '171002';
let pinValue = '';
let failCount = parseInt(sessionStorage.getItem('adm_fails')||'0',10) || 0;
let lockUntil = parseInt(sessionStorage.getItem('adm_lock')||'0',10) || 0;
const isAuthed = ()=> sessionStorage.getItem('adm_authed') === '1';
const pinInput = $('#pinReal');
const pinWrap = $('#pinWrap');

/* هل الرمز يُخزَّن مُشفَّراً (SHA-256) مع رجوع آمن للسياقات غير الآمنة */
async function sha256(str){
    try{
        if(window.crypto && crypto.subtle && window.isSecureContext){
            const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
            return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
        }
    }catch(_){}
    let h = 5381;
    for(let i=0;i<str.length;i++) h = ((h<<5)+h) + str.charCodeAt(i);
    return 'fb' + (h>>>0).toString(16);
}

function setPinDisabled(disabled){
    if(pinInput) pinInput.disabled = disabled;
    const btn = $('#pinBtn');
    if(btn) btn.disabled = disabled;
}

function showLock(){
    const left = Math.ceil((lockUntil - Date.now())/1000);
    if(left <= 0){
        failCount = 0; lockUntil = 0;
        sessionStorage.removeItem('adm_fails'); sessionStorage.removeItem('adm_lock');
        setPinDisabled(false);
        const err = $('#pinErr'); if(err) err.textContent = '';
        renderPinDots();
        return;
    }
    setPinDisabled(true);
    const err = $('#pinErr');
    if(err) err.textContent = `🔒 محظور مؤقتاً، حاول بعد ${left} ثانية`;
    setTimeout(showLock, 1000);
}

function renderPinDots(){
    $$('#pinWrap .pin-dot').forEach((d,i)=>{
        d.classList.toggle('filled', i < pinValue.length);
        d.classList.toggle('active', i === pinValue.length && pinValue.length < 6);
        d.textContent = i < pinValue.length ? '●' : '';
    });
}
pinWrap.addEventListener('click', () => pinInput.focus());
$('#loginOverlay').addEventListener('click', e => {
    if(e.target.closest('button')) return;
    if(e.target.closest('input')) return;
    pinInput.focus();
});
pinInput.addEventListener('input', () => {
    pinValue = pinInput.value.replace(/\D/g,'').slice(0,6);
    pinInput.value = pinValue;
    renderPinDots();
    if(pinValue.length === 6) setTimeout(verifyPin, 200);
});
pinInput.addEventListener('paste', () => {
    setTimeout(() => {
        pinValue = pinInput.value.replace(/\D/g,'').slice(0,6);
        pinInput.value = pinValue;
        renderPinDots();
        if(pinValue.length === 6) setTimeout(verifyPin, 200);
    }, 10);
});
pinInput.addEventListener('keydown', e => { if(e.key === 'Enter') verifyPin(); });

async function verifyPin(){
    if(lockUntil > Date.now()){ showLock(); return; }
    $('#pinErr').textContent = '';
    let stored = {};
    try{
        const snap = await db.ref('adminPin').once('value');
        stored = snap.val() || {};
    }catch(_){}
    const enteredHash = await sha256(pinValue);
    let ok = false, migrate = false;
    if(stored && stored.hash){
        ok = enteredHash === stored.hash;
    }else if(stored && stored.pin){
        ok = pinValue === String(stored.pin);
        migrate = ok;
    }else{
        ok = enteredHash === await sha256(DEFAULT_PIN);
        migrate = ok;
    }
    if(ok){
        failCount = 0;
        sessionStorage.removeItem('adm_fails');
        sessionStorage.setItem('adm_authed','1');
        if(migrate){ try{ await db.ref('adminPin').set({hash:enteredHash, updatedAt:Date.now()}); }catch(_){} }
        $('#loginOverlay').classList.add('hidden');
        logActivity('تسجيل دخول للوحة');
        toast('مرحباً بك 👋','تم الدخول بنجاح','ok');
    }else{
        failCount++;
        sessionStorage.setItem('adm_fails', String(failCount));
        if(failCount >= 5){
            lockUntil = Date.now() + 30000;
            sessionStorage.setItem('adm_lock', String(lockUntil));
            pinValue = ''; pinInput.value = ''; renderPinDots(); showLock();
            return;
        }
        $('#pinErr').textContent = `❌ رمز غير صحيح (${failCount}/5)`;
        pinValue = '';
        pinInput.value = '';
        renderPinDots();
        pinInput.focus();
    }
}
$('#pinBtn').addEventListener('click', e => { e.stopPropagation(); verifyPin(); });
function bootLogin(){
    if(isAuthed()) $('#loginOverlay').classList.add('hidden');
    else{
        $('#loginOverlay').classList.remove('hidden');
        if(lockUntil > Date.now()) showLock();
        else setTimeout(() => pinInput.focus(), 300);
    }
    renderPinDots();
}
bootLogin();

/* قفل تلقائي عند عدم النشاط (30 دقيقة) */
let idleTimer = null;
function resetIdle(){
    if(!isAuthed()) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(()=>{ toast('قفل تلقائي بسبب عدم النشاط','','warn'); logout(); }, 30*60000);
}
['click','keydown','mousemove','touchstart','scroll'].forEach(ev=>document.addEventListener(ev, resetIdle, {passive:true}));
resetIdle();

function logout(){
    sessionStorage.removeItem('adm_authed');
    location.reload();
}
$('#btnLogout').addEventListener('click',async()=>{
    const ok = await askConfirm({title:'تسجيل الخروج',msg:'قفل اللوحة والخروج؟',okText:'خروج'});
    if(ok) logout();
});

/* ---------- NAVIGATION ---------- */
const secTitles = {
    dashboard:'لوحة القيادة',media:'إدارة المحتوى',add:'إضافة محتوى',
    sections:'إدارة الأقسام',live:'البث المباشر',matches:'المباريات',
    categories:'التصنيفات',users:'المستخدمون',viprequests:'طلبات VIP',
    comments:'التعليقات',ratings:'التقييمات',ads:'الإعلانات',
    notifications:'إشعارات',settings:'الإعدادات'
};
function go(sec){
    if(!secTitles[sec]) sec = 'dashboard';
    $$('.section').forEach(s=>s.classList.toggle('active', s.id === 'sec-'+sec));
    $$('.nav-item[data-sec]').forEach(b=>b.classList.toggle('active', b.dataset.sec === sec));
    $$('.bn-item[data-sec]').forEach(b=>b.classList.toggle('active', b.dataset.sec === sec));
    $('#topTitle').textContent = secTitles[sec];
    window.scrollTo({top:0,behavior:'smooth'});
    history.replaceState(null,'','#'+sec);
}
$$('[data-sec]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.sec)));
$$('[data-goto]').forEach(b=>b.addEventListener('click',()=>{
    go(b.dataset.goto);
    if(b.dataset.goto === 'add') setTimeout(()=>$('#addTitle')?.focus(),300);
}));
window.addEventListener('hashchange',()=>go(location.hash.replace('#','')));
go(location.hash.replace('#','') || 'dashboard');

/* ---------- FAB ---------- */
$('#fabMain').addEventListener('click',()=>$('#fabWrap').classList.toggle('open'));
$('#fabTop').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
$('#btnRefresh').addEventListener('click',()=>location.reload());
$('#btnBackup').addEventListener('click',()=>exportBackup());
$('#btnQuickBackup')?.addEventListener('click',()=>exportBackup());
$('#btnExportJSON')?.addEventListener('click',()=>exportBackup());

/* ---------- ACTIVITY LOG ---------- */
function logActivity(text){
    const list = JSON.parse(localStorage.getItem('adm_log')||'[]');
    list.unshift({t:Date.now(),text});
    localStorage.setItem('adm_log', JSON.stringify(list.slice(0,30)));
    renderActivity();
}
function renderActivity(){
    const list = JSON.parse(localStorage.getItem('adm_log')||'[]');
    const box = $('#activityList');
    if(!box) return;
    if(!list.length){
        box.innerHTML = `<div class="empty"><i class="fa-solid fa-clock"></i><p>لا توجد نشاطات بعد</p></div>`;
        return;
    }
    box.innerHTML = list.map(x=>`
        <div class="dl-row simple" style="align-items:center">
            <div class="dl-cell"><i class="fa-solid fa-circle-check" style="color:var(--success)"></i><span class="v">${esc(x.text)}</span></div>
            <div class="dl-cell"><span class="v" style="font-size:.7rem;color:var(--text-3)">${new Date(x.t).toLocaleString('ar-EG')}</span></div>
        </div>`).join('');
}
$('#btnClearLog')?.addEventListener('click',async()=>{
    const ok = await askConfirm({title:'مسح السجل',msg:'حذف كل النشاطات؟',okText:'مسح'});
    if(ok){localStorage.removeItem('adm_log');renderActivity();toast('تم المسح','','ok');}
});
renderActivity();

/* ---------- SERVER ROW BUILDER ---------- */
function serverRow(name='', val='', type='url'){
    const div = document.createElement('div');
    div.className = 'server-row';
    div.innerHTML = `
        <input class="srv-name" placeholder="اسم السيرفر" value="${esc(name)}">
        <select class="srv-type">
            <option value="url" ${type==='url'?'selected':''}>رابط</option>
            <option value="embed" ${type==='embed'?'selected':''}>كود HTML</option>
        </select>
        <input class="srv-val" placeholder="الرابط أو كود iframe" value="${esc(val)}">
        <button type="button" class="test-btn" title="اختبار"><i class="fa-solid fa-flask"></i></button>
        <button type="button" class="rm"><i class="fa-solid fa-trash"></i></button>`;
    div.querySelector('.rm').addEventListener('click',()=>div.remove());
    div.querySelector('.test-btn').addEventListener('click', (e)=>{
        const val = div.querySelector('.srv-val').value.trim();
        if(!val){ toast('أدخل الرابط أولاً','','warn'); return; }
        testServerUrl(val, e.currentTarget);
    });
    return div;
}
function collectServers(sel){
    const out = [];
    $$(sel + ' .server-row').forEach(r=>{
        const name = r.querySelector('.srv-name').value.trim();
        const type = r.querySelector('.srv-type').value;
        const val = r.querySelector('.srv-val').value.trim();
        if(!name || !val) return;
        out.push(type === 'embed' ? {name, script: val} : {name, url: val});
    });
    return out;
}
function fillServers(sel, servers){
    const box = document.querySelector(sel);
    if(!box) return;
    box.innerHTML = '';
    (servers||[]).forEach(s=>{
        const val = s.url || s.script || '';
        const type = (s.script) ? 'embed' : 'url';
        box.appendChild(serverRow(s.name || 'سيرفر', val, type));
    });
    if(box.children.length === 0) box.appendChild(serverRow('سيرفر رئيسي'));
}
$('#addServerBtn')?.addEventListener('click',()=>$('#addServers').appendChild(serverRow()));
$('#editAddServer')?.addEventListener('click',()=>$('#editServers').appendChild(serverRow()));
if($('#addServers')) $('#addServers').appendChild(serverRow('سيرفر رئيسي'));
fillServers('#editServers',[]);

/* ---------- TEST SERVER URL ---------- */
async function testServerUrl(url, btnEl){
    if(!url) return;
    if(btnEl) btnEl.classList.add('testing');
    $('#testResultUrl').textContent = url;
    $('#testResultBody').innerHTML = '<div style="text-align:center;padding:20px"><p style="color:var(--text-3);font-size:.8rem">جاري الاختبار...</p></div>';
    openModal('mTestResult');

    const start = performance.now();
    let result = {};
    const isM3U8 = /\.m3u8(\?|$)/i.test(url);
    const isMPD = /\.mpd(\?|$)/i.test(url);
    const isVideo = /\.(mp4|mkv|webm|mov|ts|flv|m4v)(\?|$)/i.test(url);
    result.type = isM3U8 ? 'HLS (m3u8)' : isMPD ? 'DASH (mpd)' : isVideo ? 'Video File' : 'Embed/Iframe/HTML';
    result.protocol = url.startsWith('https://') ? 'HTTPS' : url.startsWith('http://') ? 'HTTP' : 'Other';
    result.domain = (()=>{ try { return new URL(url).hostname; } catch(e){ return '—'; } })();

    try{
        const ctrl = new AbortController();
        const timer = setTimeout(()=>ctrl.abort(), 8000);
        const res = await fetch(url, { method:'HEAD', mode:'no-cors', signal: ctrl.signal, cache:'no-store' });
        clearTimeout(timer);
        const elapsed = Math.round(performance.now() - start);
        result.status = res.status === 0 ? 'OK (opaque)' : res.status;
        result.latency = elapsed + ' ms';
        result.reachable = true;
    }catch(err){
        const elapsed = Math.round(performance.now() - start);
        result.reachable = false;
        result.latency = elapsed + ' ms';
        result.error = err.name === 'AbortError' ? 'انتهت مهلة الاتصال (8 ثواني)' : err.message;
    }

    if(btnEl) btnEl.classList.remove('testing');

    const reachText = result.reachable ? '✓ الرابط قابل للوصول' : '✗ تعذّر الوصول';
    $('#testResultBody').innerHTML = `
        <div style="margin-bottom:12px">
            <div style="font-size:.85rem;font-weight:800;color:${result.reachable?'var(--success)':'var(--danger)'}">${reachText}</div>
        </div>
        <div style="display:grid;gap:6px;font-size:.8rem">
            <div><span style="color:var(--text-3)">النوع:</span> <span style="color:var(--info);font-weight:800">${esc(result.type)}</span></div>
            <div><span style="color:var(--text-3)">النطاق:</span> ${esc(result.domain)}</div>
            <div><span style="color:var(--text-3)">البروتوكول:</span> ${esc(result.protocol)}</div>
            <div><span style="color:var(--text-3)">زمن الاستجابة:</span> ${esc(result.latency)}</div>
            ${result.status ? `<div><span style="color:var(--text-3)">Status:</span> ${esc(result.status)}</div>`:''}
            ${result.error ? `<div style="color:var(--danger);margin-top:6px">${esc(result.error)}</div>`:''}
        </div>
        <div style="margin-top:10px">
            <a href="${esc(url)}" target="_blank" class="btn ghost sm" style="width:100%;justify-content:center">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> فتح الرابط
            </a>
        </div>`;
}
window.testServerUrl = testServerUrl;

/* ---------- COPY BUTTONS ---------- */
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.copy-btn[data-copy-target]');
    if(!btn) return;
    const target = document.getElementById(btn.dataset.copyTarget);
    if(!target || !target.value){ toast('لا يوجد محتوى','','warn'); return; }
    try{
        await navigator.clipboard.writeText(target.value);
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(()=>{ btn.innerHTML = orig; }, 1500);
    }catch(err){
        target.select();
        document.execCommand('copy');
        toast('تم النسخ','','ok');
    }
});

/* ---------- THEME ---------- */
(function initTheme(){
    const saved = localStorage.getItem('adm_theme');
    if(saved === 'light') document.body.classList.add('light-theme');
    updateThemeIcon();
})();
function updateThemeIcon(){
    const btn = $('#btnThemeToggle');
    if(!btn) return;
    const isLight = document.body.classList.contains('light-theme');
    btn.innerHTML = `<i class="fa-solid fa-${isLight?'sun':'moon'}"></i>`;
}
$('#btnThemeToggle')?.addEventListener('click', ()=>{
    document.body.classList.toggle('light-theme');
    localStorage.setItem('adm_theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
    updateThemeIcon();
});

/* ---------- NOTIFICATIONS BELL ---------- */
$('#btnNotifications')?.addEventListener('click', ()=>{
    renderNotifications();
    openModal('mNotifications');
});
function renderNotifications(){
    const box = $('#notifList');
    if(!box) return;
    const items = [];
    const pending = (window.__allVipRequests||[]).filter(r=>r.status === 'pending');
    pending.slice(0,10).forEach(r=>{
        items.push({
            icon:'fa-crown',
            color:'var(--vip)',
            title:`طلب VIP من ${r.name || r.email || 'مستخدم'}`,
            sub: timeAgo(r.createdAt)
        });
    });
    const recentUsers = (window.__allUsers||[]).filter(u => u.createdAt && (Date.now() - u.createdAt) < 86400000);
    recentUsers.slice(0,5).forEach(u=>{
        items.push({
            icon:'fa-user-plus',
            color:'var(--info)',
            title:`مستخدم جديد: ${u.name || u.email}`,
            sub: timeAgo(u.createdAt)
        });
    });
    if(!items.length){
        box.innerHTML = `<div class="empty"><i class="fa-solid fa-bell-slash"></i><p>لا توجد إشعارات</p></div>`;
        return;
    }
    box.innerHTML = items.map(i=>`
        <div class="dl-row simple" style="align-items:center">
            <div class="dl-cell"><i class="fa-solid ${i.icon}" style="color:${i.color}"></i><span class="v">${esc(i.title)}</span></div>
            <div class="dl-cell"><span class="v" style="font-size:.7rem;color:var(--text-3)">${esc(i.sub)}</span></div>
        </div>`).join('');
}
$('#btnClearNotifs')?.addEventListener('click', ()=>{
    closeModal('mNotifications');
    toast('تم','','ok');
});

/* ---------- PREVIEW LINK ---------- */
(function(){
    const link = $('#previewLink');
    if(link){
        const basePath = location.pathname.substring(0, location.pathname.lastIndexOf('/') + 1);
        link.href = basePath + 'index.html';
    }
})();

/* ============================================================
   CATEGORIES (VOD)
   ============================================================ */
const DEFAULT_CATS = ['أفلام','مسلسلات','رياضة','عام'];
function loadCategories(){
    db.ref('categories').on('value', snap=>{
        const addSel = $('#addCategory');
        const editSel = $('#editCategory');
        const secCatSel = $('#sectionCategories');
        if(addSel) addSel.innerHTML = '';
        if(editSel) editSel.innerHTML = '';
        if(secCatSel) secCatSel.innerHTML = '';

        if(!snap.exists()){
            DEFAULT_CATS.forEach(c=>db.ref('categories').push({name:c,type:'عام',createdAt:Date.now()}));
            return;
        }
        const rows = [];
        snap.forEach(c=>rows.push({id:c.key,...c.val()}));

        rows.forEach(r=>{
            if(addSel) addSel.add(new Option(r.name, r.name));
            if(editSel) editSel.add(new Option(r.name, r.name));
            if(secCatSel) secCatSel.add(new Option(r.name, r.name));
        });

        const box = $('#catList');
        if(box){
            box.innerHTML = rows.map(r=>`
                <div class="dl-row simple" style="align-items:center">
                    <div class="dl-cell"><i class="fa-solid fa-folder" style="color:var(--accent)"></i><span class="v">${esc(r.name)}</span></div>
                    <div class="dl-cell"><span class="badge ${r.type==='VIP'?'vip':''}">${esc(r.type||'عام')}</span></div>
                    <div class="dl-actions">
                        <button class="btn ghost sm" onclick="editCat('${esc(r.id)}','${esc(r.name)}','${esc(r.type||'عام')}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn red sm" onclick="delCat('${esc(r.id)}','${esc(r.name)}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>`).join('') || `<div class="empty"><i class="fa-solid fa-folder-open"></i><p>لا توجد تصنيفات</p></div>`;
        }
    });
}
$('#addCategoryForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const name = $('#newCategoryName').value.trim();
    const type = $('#newCategoryType').value;
    if(!name) return;
    try{
        await db.ref('categories').push({name,type,createdAt:Date.now()});
        $('#newCategoryName').value = '';
        logActivity(`إضافة تصنيف: ${name}`);
        toast('تم الإضافة',name,'ok');
    }catch(err){ toast('خطأ',err.message,'err'); }
});
function editCat(id,name,type){
    $('#catId').value = id;
    $('#catName').value = name;
    $('#catType').value = type;
    openModal('mCat');
}
$('#catForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const id = $('#catId').value;
    try{
        await db.ref('categories/'+id).update({name:$('#catName').value.trim(),type:$('#catType').value});
        closeModal('mCat');
        logActivity('تعديل تصنيف');
        toast('تم الحفظ','','ok');
    }catch(err){ toast('خطأ',err.message,'err'); }
});
async function delCat(id,name){
    const ok = await askConfirm({title:'حذف تصنيف',msg:`حذف "${name}"؟`,okText:'حذف'});
    if(!ok) return;
    await db.ref('categories/'+id).remove();
    logActivity(`حذف تصنيف: ${name}`);
    toast('تم الحذف',name,'ok');
}
window.editCat = editCat;
window.delCat = delCat;

/* ============================================================
   MEDIA (VOD)
   ============================================================ */
let allItems = [];

function resetAddForm(){
    $('#addForm').reset();
    $('#addServers').innerHTML = '';
    $('#addServers').appendChild(serverRow('سيرفر رئيسي'));
}
window.resetAddForm = resetAddForm;

$('#addForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const btn = $('#btnSubmitAdd');
    btn.disabled = true;
    const oldHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';
    const data = {
        title: $('#addTitle').value.trim(),
        category: $('#addCategory').value,
        isVip: $('#addIsVip').value === 'true',
        thumbnailUrl: $('#addThumbnail').value.trim(),
        description: $('#addDescription').value.trim(),
        servers: collectServers('#addServers'),
        downloadUrl: $('#addDownloadUrl').value.trim(),
        adDownloadUrl: $('#addAdDownloadUrl').value.trim(),
        views: 0,
        createdAt: Date.now()
    };
    try{
        await db.ref('videos').push(data);
        logActivity(`إضافة محتوى: ${data.title}`);
        toast('تم النشر',data.title,'ok');
        resetAddForm();
        go('media');
    }catch(err){
        toast('خطأ',err.message,'err');
    }finally{
        btn.disabled = false;
        btn.innerHTML = oldHTML;
    }
});

function loadMedia(){
    db.ref('videos').on('value', snap=>{
        allItems = [];
        snap.forEach(c=>allItems.push({id:c.key,...c.val()}));
        const total = allItems.length;
        const vip = allItems.filter(i=>i.isVip).length;
        const totalViews = allItems.reduce((s,i)=>s+(i.views||0),0);
        $('#statTotalVideos').textContent = total.toLocaleString('ar-EG');
        $('#statVipVideos').textContent = vip.toLocaleString('ar-EG');
        $('#statTotalViews').textContent = totalViews.toLocaleString('ar-EG');
        renderMedia();
        renderTopViewedChart();
    });
}

function renderMedia(){
    const q = ($('#qMedia').value||'').toLowerCase().trim();
    const f = $('#filterVip').value;
    const box = $('#mediaList');
    if(!box) return;
    let list = allItems.filter(i=>{
        if(f === 'vip' && !i.isVip) return false;
        if(f === 'free' && i.isVip) return false;
        if(f === 'dl' && !(i.downloadUrl || i.adDownloadUrl)) return false;
        if(q){
            const t = (i.title||'').toLowerCase();
            const c = (i.category||'').toLowerCase();
            if(!t.includes(q) && !c.includes(q)) return false;
        }
        return true;
    });
    if(!list.length){
        box.innerHTML = `<div class="empty"><i class="fa-solid fa-film"></i><p>لا يوجد محتوى مطابق</p></div>`;
        return;
    }
    if((localStorage.getItem('admin_media_view')||'list')==='grid'){
        box.innerHTML = adminCardGrid(list,'media');
        return;
    }
    box.innerHTML = list.map(i=>{
        const hasDl = !!(i.downloadUrl || i.adDownloadUrl);
        return `
        <div class="dl-row">
            <img class="dl-thumb" src="${esc(i.thumbnailUrl||'https://via.placeholder.com/160x90/1f1f1f/ffffff?text=Media')}" onerror="this.src='https://via.placeholder.com/160x90/1f1f1f/ffffff?text=Media'">
            <div class="dl-cell"><span class="k">العنوان</span><span class="v">${esc(i.title||'بدون عنوان')}</span></div>
            <div class="dl-cell"><span class="k">التصنيف</span><span class="badge">${esc(i.category||'عام')}</span></div>
            <div class="dl-cell"><span class="k">النوع</span>${i.isVip?'<span class="badge vip"><i class="fa-solid fa-crown"></i> VIP</span>':'<span class="badge">مجاني</span>'}</div>
            <div class="dl-cell"><span class="k">التحميل</span>${hasDl?'<span class="badge ok"><i class="fa-solid fa-download"></i> متاح</span>':'<span class="badge exp">—</span>'}</div>
            <div class="dl-cell"><span class="k">مشاهدات</span><span class="v"><i class="fa-regular fa-eye"></i> ${(i.views||0).toLocaleString('ar-EG')}</span></div>
            <div class="dl-actions">
                <button class="btn ghost sm" onclick="editItem('${esc(i.id)}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn red sm" onclick="delItem('${esc(i.id)}','${esc(i.title||'')}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');
}
$('#qMedia')?.addEventListener('input',debounce(renderMedia,220));
$('#filterVip')?.addEventListener('change',renderMedia);

function adminCardGrid(list, kind){
    const btn=(fn,id,title,icon,color)=>`<button class="btn ${color} sm" onclick="${fn}('${esc(id)}'${fn==='delItem'||fn==='delLiveChannel'?`,'${esc(title)}'`:''})"><i class="fa-solid ${icon}"></i></button>`;
    return `<div class="admin-grid">`+list.map(i=>{
        const title=i.title||i.name||'بدون عنوان';
        const img=kind==='live'?(i.logo||i.image||i.poster):(i.thumbnailUrl||i.image||i.thumbnail||i.poster);
        const ph='https://via.placeholder.com/300x450/141826/6b7280?text='+encodeURIComponent(title);
        const vip=!!i.isVip;
        const meta = kind==='live'
            ? `<i class="fa-solid fa-tv"></i> ${esc(i.category||'بث')}`
            : `<i class="fa-regular fa-eye"></i> ${(i.views||0).toLocaleString('ar-EG')}`;
        const edit=kind==='live'?`editLiveChannel`:`editItem`;
        const del=kind==='live'?`delLiveChannel`:`delItem`;
        return `<div class="admin-grid-card ${vip?'is-vip':''} ${kind}">
            <div class="agc-thumb">
                <img src="${esc(img||ph)}" alt="" loading="lazy" onerror="this.src='${ph}'">
                ${vip?'<span class="agc-badge vip"><i class="fa-solid fa-crown"></i> VIP</span>':'<span class="agc-badge free">مجاني</span>'}
            </div>
            <div class="agc-body">
                <div class="agc-title" title="${esc(title)}">${esc(title)}</div>
                <div class="agc-meta">${meta}</div>
            </div>
            <div class="agc-actions">
                ${btn(edit,i.id,title,'fa-pen','ghost')}
                ${btn(del,i.id,title,'fa-trash','red')}
            </div>
        </div>`;
    }).join('')+`</div>`;
}
window.adminCardGrid = adminCardGrid;

function initViewToggles(){
    document.querySelectorAll('.view-toggle').forEach(t=>{
        const key=t.dataset.key;
        const render=t.dataset.render;
        const saved=localStorage.getItem(key)||'list';
        t.querySelectorAll('.vt-btn').forEach(b=>{
            b.classList.toggle('active',b.dataset.view===saved);
            b.onclick=()=>{
                t.querySelectorAll('.vt-btn').forEach(x=>x.classList.remove('active'));
                b.classList.add('active');
                localStorage.setItem(key,b.dataset.view);
                if(window[render]) window[render]();
            };
        });
    });
}
window.initViewToggles = initViewToggles;

async function editItem(id){
    const snap = await db.ref('videos/'+id).once('value');
    if(!snap.exists()) return toast('غير موجود','','err');
    const item = snap.val();
    $('#editId').value = id;
    $('#editTitle').value = item.title || '';
    $('#editCategory').value = item.category || 'عام';
    $('#editIsVip').value = item.isVip ? 'true' : 'false';
    $('#editThumbnail').value = item.thumbnailUrl || '';
    $('#editDescription').value = item.description || '';
    $('#editDownloadUrl').value = item.downloadUrl || '';
    $('#editAdDownloadUrl').value = item.adDownloadUrl || '';
    fillServers('#editServers', item.servers || []);
    openModal('mEdit');
}
window.editItem = editItem;

$('#editForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const id = $('#editId').value;
    try{
        await db.ref('videos/'+id).update({
            title: $('#editTitle').value.trim(),
            category: $('#editCategory').value,
            isVip: $('#editIsVip').value === 'true',
            thumbnailUrl: $('#editThumbnail').value.trim(),
            description: $('#editDescription').value.trim(),
            servers: collectServers('#editServers'),
            downloadUrl: $('#editDownloadUrl').value.trim(),
            adDownloadUrl: $('#editAdDownloadUrl').value.trim()
        });
        closeModal('mEdit');
        logActivity('تعديل محتوى');
        toast('تم الحفظ','','ok');
    }catch(err){ toast('خطأ',err.message,'err'); }
});
async function delItem(id,title){
    const ok = await askConfirm({title:'حذف المحتوى',msg:`سيتم حذف "${title}" نهائياً.`,okText:'حذف'});
    if(!ok) return;
    await db.ref('videos/'+id).remove();
    logActivity(`حذف محتوى: ${title}`);
    toast('تم الحذف',title,'ok');
}
window.delItem = delItem;

/* ---------- TOP VIEWED CHART ---------- */
function renderTopViewedChart(){
    const canvas = $('#topViewedChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width || 800;
    const H = 220;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,W,H);

    const top = [...allItems].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,10);
    const legend = $('#topViewedLegend');
    if(!top.length){
        ctx.fillStyle = '#64748b';
        ctx.font = '600 13px Cairo, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('لا توجد بيانات', W/2, H/2);
        if(legend) legend.innerHTML = '';
        return;
    }

    const maxVal = Math.max(...top.map(i=>i.views||0)) || 1;
    const padding = {t:14, r:14, b:14, l:14};
    const gap = 6;
    const barW = (W - padding.l - padding.r - gap*(top.length-1)) / top.length;

    ctx.strokeStyle = 'rgba(255,255,255,.05)';
    ctx.lineWidth = 1;
    for(let i=0; i<=4; i++){
        const y = padding.t + (H - padding.t - padding.b) * (i/4);
        ctx.beginPath();
        ctx.moveTo(padding.l, y);
        ctx.lineTo(W - padding.r, y);
        ctx.stroke();
    }

    const colors = ['#ff0b37','#ff4d6d','#f59e0b','#fbbf24','#06b6d4','#10b981','#8b5cf6','#ec4899','#14b8a6','#eab308'];
    top.forEach((item, i) => {
        const val = item.views||0;
        const barH = ((H - padding.t - padding.b) * val) / maxVal;
        const x = padding.l + i*(barW + gap);
        const y = H - padding.b - barH;
        const g = ctx.createLinearGradient(0, y, 0, H - padding.b);
        g.addColorStop(0, colors[i % colors.length]);
        g.addColorStop(1, colors[i % colors.length] + '22');
        ctx.fillStyle = g;
        const r = Math.min(6, barW/2, barH/2);
        ctx.beginPath();
        ctx.moveTo(x, H - padding.b);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.lineTo(x + barW - r, y);
        ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
        ctx.lineTo(x + barW, H - padding.b);
        ctx.closePath();
        ctx.fill();
        if(barW > 30){
            ctx.fillStyle = '#f1f5f9';
            ctx.font = '700 10px Cairo, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(val, x + barW/2, y - 4);
        }
    });

    if(legend){
        legend.innerHTML = top.slice(0,5).map((it,i)=>`
            <div class="lg-item">
                <span class="lg-dot" style="background:${colors[i % colors.length]}"></span>
                <span class="lg-text">${esc(it.title||'بدون عنوان')}</span>
                <span class="lg-val">${(it.views||0).toLocaleString('ar-EG')}</span>
            </div>`).join('');
    }
}
window.addEventListener('resize', debounce(renderTopViewedChart, 300));

/* ============================================================
   USERS
   ============================================================ */
let allUsers = [];

function loadUsers(){
    db.ref('users').on('value', snap=>{
        allUsers = [];
        snap.forEach(c=>allUsers.push({id:c.key,...c.val()}));
        window.__allUsers = allUsers;
        $('#statTotalUsers').textContent = allUsers.length.toLocaleString('ar-EG');
        renderUsers();
        fillNotifUserSelect();
    });
}

function fillNotifUserSelect(){
    const sel = $('#notifTargetUser');
    if(!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="all">📢 جميع المستخدمين</option>';
    allUsers.forEach(u=>{
        sel.add(new Option(`${u.name||'مستخدم'} (${u.email||''})`, u.id));
    });
    if(cur) sel.value = cur;
}

function renderUsers(){
    const q = ($('#qUser').value||'').toLowerCase().trim();
    const f = $('#filterUserStatus').value;
    const now = Date.now();
    const box = $('#usersList');
    if(!box) return;
    let list = allUsers.filter(u=>{
        if(q){
            const n = (u.name||'').toLowerCase();
            const e = (u.email||'').toLowerCase();
            if(!n.includes(q) && !e.includes(q)) return false;
        }
        const banned = userIsBanned(u);
        const vip = userIsVipNow(u);
        const exp = userExpire(u);
        if(f === 'vip' && !vip) return false;
        if(f === 'blocked' && !banned) return false;
        if(f === 'expired' && !(exp > 0 && exp <= now)) return false;
        return true;
    });
    if(!list.length){
        box.innerHTML = `<div class="empty"><i class="fa-solid fa-users"></i><p>لا يوجد مستخدمون</p></div>`;
        return;
    }
    box.innerHTML = list.map(u=>{
        const vip = userIsVipNow(u);
        const banned = userIsBanned(u);
        const exp = userExpire(u);
        let days = '—', statusBadge;
        if(banned) statusBadge = `<span class="badge block"><i class="fa-solid fa-ban"></i> محظور</span>`;
        else if(exp > 0 && exp <= now) statusBadge = `<span class="badge exp">منتهي</span>`;
        else statusBadge = `<span class="badge ok"><i class="fa-solid fa-circle-check"></i> نشط</span>`;
        if(exp > 0){
            const diff = Math.ceil((exp - now) / 86400000);
            days = diff > 0 ? diff + ' يوم' : 'منتهي';
        }
        return `
        <div class="dl-row">
            <div class="dl-cell"><span class="k">الاسم</span><span class="v">${esc(u.name||'مستخدم')}</span></div>
            <div class="dl-cell"><span class="k">البريد</span><span class="v" style="font-size:.78rem;color:var(--text-2)">${esc(u.email||'—')}</span></div>
            <div class="dl-cell"><span class="k">النوع</span>${vip?'<span class="badge vip"><i class="fa-solid fa-crown"></i> VIP</span>':'<span class="badge">عادي</span>'}</div>
            <div class="dl-cell"><span class="k">الانتهاء</span><span class="v">${exp?fmtDate(exp):'—'}</span></div>
            <div class="dl-cell"><span class="k">المتبقي</span><span class="v">${days}</span></div>
            <div class="dl-cell"><span class="k">الحالة</span>${statusBadge}</div>
            <div class="dl-actions">
                <button class="btn ghost sm" onclick="editUser('${esc(u.id)}')"><i class="fa-solid fa-user-pen"></i></button>
                <button class="btn ${banned?'green':'gold'} sm" onclick="toggleBan('${esc(u.id)}',${!banned})"><i class="fa-solid ${banned?'fa-lock-open':'fa-ban'}"></i></button>
                <button class="btn red sm" onclick="delUser('${esc(u.id)}','${esc(u.name||'')}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');
}
$('#qUser')?.addEventListener('input',debounce(renderUsers,220));
$('#filterUserStatus')?.addEventListener('change',renderUsers);
$('#btnNewUser')?.addEventListener('click',()=>openUserModal());

function openUserModal(){
    $('#userForm').reset();
    $('#userId').value = '';
    $('#userModalTitle').textContent = 'مستخدم جديد';
    openModal('mUser');
}
async function editUser(id){
    const snap = await db.ref('users/'+id).once('value');
    if(!snap.exists()) return toast('غير موجود','','err');
    const u = snap.val();
    $('#userId').value = id;
    $('#userName').value = u.name || '';
    $('#userEmail').value = u.email || '';
    $('#userPassword').value = u.password || '';
    $('#userIsVip').value = userIsVipNow(u) ? 'true' : 'false';
    $('#userModalTitle').textContent = 'تعديل المستخدم';
    openModal('mUser');
}
window.editUser = editUser;

$('#userForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const id = $('#userId').value;
    const name = $('#userName').value.trim();
    const email = $('#userEmail').value.trim();
    const password = $('#userPassword').value.trim();
    const isVip = $('#userIsVip').value === 'true';
    const val = parseInt($('#subValue').value) || 1;
    const unit = $('#subUnit').value;
    let addMs = 0;
    if(unit === 'days') addMs = val * 86400000;
    else if(unit === 'months') addMs = val * 30 * 86400000;
    else if(unit === 'years') addMs = val * 365 * 86400000;
    const now = Date.now();
    let baseTime = now;
    if(id){
        const snap = await db.ref('users/'+id).once('value');
        const prev = snap.val() || {};
        const prevExp = userExpire(prev);
        if(prevExp > now) baseTime = prevExp;
    }
    const expireAt = baseTime + addMs;
    const payload = {name, email, password, isVip, expireAt, vipExpireDate: expireAt, updatedAt: now};
    try{
        if(id) await db.ref('users/'+id).update(payload);
        else await db.ref('users').push({...payload, isBlocked:false, isBanned:false, createdAt:now});
        closeModal('mUser');
        logActivity(id?`تعديل مستخدم: ${name}`:`إضافة مستخدم: ${name}`);
        toast('تم الحفظ', name, 'ok');
    }catch(err){ toast('خطأ',err.message,'err'); }
});
async function toggleBan(id, status){
    await db.ref('users/'+id).update({isBlocked:status, isBanned:status});
    logActivity(status?'حظر مستخدم':'إلغاء حظر مستخدم');
    toast(status?'تم الحظر':'تم إلغاء الحظر','','ok');
}
window.toggleBan = toggleBan;
async function delUser(id,name){
    const ok = await askConfirm({title:'حذف حساب',msg:`حذف "${name}"؟`,okText:'حذف'});
    if(!ok) return;
    await db.ref('users/'+id).remove();
    logActivity(`حذف مستخدم: ${name}`);
    toast('تم الحذف',name,'ok');
}
window.delUser = delUser;

/* ---------- EXPORT CSV USERS ---------- */
$('#btnExportUsersCSV')?.addEventListener('click', () => {
    if(!allUsers.length){ toast('لا يوجد مستخدمون','','warn'); return; }
    const headers = ['ID','الاسم','البريد','النوع','تاريخ الانتهاء','محظور','تاريخ التسجيل'];
    const rows = allUsers.map(u => [
        u.id,
        (u.name||'').replace(/"/g,'""'),
        (u.email||'').replace(/"/g,'""'),
        userIsVipNow(u) ? 'VIP' : 'عادي',
        userExpire(u) ? new Date(userExpire(u)).toISOString().slice(0,10) : '',
        userIsBanned(u) ? 'نعم' : 'لا',
        u.createdAt ? new Date(u.createdAt).toISOString().slice(0,10) : ''
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('تم التصدير', `${allUsers.length} مستخدم`,'ok');
});

/* ---------- EXPORT CSV MEDIA ---------- */
$('#btnExportMediaCSV')?.addEventListener('click', () => {
    if(!allItems.length){ toast('لا يوجد محتوى','','warn'); return; }
    const headers = ['ID','العنوان','التصنيف','VIP','المشاهدات','عدد السيرفرات','رابط VIP','رابط مجاني'];
    const rows = allItems.map(i => [
        i.id,
        (i.title||'').replace(/"/g,'""'),
        (i.category||'').replace(/"/g,'""'),
        i.isVip ? 'نعم' : 'لا',
        i.views||0,
        (i.servers||[]).length,
        i.downloadUrl||'',
        i.adDownloadUrl||''
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `media_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('تم التصدير', `${allItems.length} عنصر`,'ok');
});

/* ---------- EXPORT BACKUP ---------- */
async function exportBackup(){
    try{
        toast('جاري التحضير','','');
        const snap = await db.ref().once('value');
        const data = JSON.stringify(snap.val()||{}, null, 2);
        const blob = new Blob([data], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin_backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        logActivity('تصدير نسخة احتياطية');
        toast('تم التصدير','','ok');
    }catch(err){ toast('خطأ',err.message,'err'); }
}
window.exportBackup = exportBackup;

$('#btnImportJSON')?.addEventListener('click',()=>$('#jsonFileInput').click());
$('#jsonFileInput')?.addEventListener('change', async e=>{
    const f = e.target.files[0];
    if(!f) return;
    const ok = await askConfirm({title:'استيراد نسخة',msg:'سيتم دمج البيانات مع الحالية. متابعة؟',okText:'استيراد',type:'gold'});
    if(!ok){ e.target.value = ''; return; }
    try{
        const text = await f.text();
        const data = JSON.parse(text);
        await db.ref().update(data);
        logActivity('استيراد نسخة احتياطية');
        toast('تم الاستيراد','','ok');
    }catch(err){ toast('خطأ',err.message,'err'); }
    e.target.value = '';
});

/* ---------- CHANGE PIN ---------- */
$('#btnChangePin')?.addEventListener('click',()=>{ $('#pinForm').reset(); openModal('mPin'); });
$('#pinForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const oldP = $('#pinOld').value.trim();
    const newP = $('#pinNew').value.trim();
    if(!/^\d{4,6}$/.test(newP)) return toast('خطأ','يجب أن يكون 4-6 أرقام','err');
    let stored = {};
    try{ const snap = await db.ref('adminPin').once('value'); stored = snap.val() || {}; }catch(_){}
    let oldOk = false;
    const oldHash = await sha256(oldP);
    if(stored && stored.hash) oldOk = oldHash === stored.hash;
    else if(stored && stored.pin) oldOk = oldP === String(stored.pin);
    else oldOk = oldHash === await sha256(DEFAULT_PIN);
    if(!oldOk) return toast('خطأ','الرمز الحالي غير صحيح','err');
    try{
        await db.ref('adminPin').set({hash:await sha256(newP), updatedAt:Date.now()});
        closeModal('mPin');
        logActivity('تغيير رمز الدخول');
        toast('تم التغيير','','ok');
    }catch(err){ toast('خطأ',err.message,'err'); }
});

/* ---------- QUICK BUTTONS ---------- */
$('#statPendingRequestsCard')?.addEventListener('click', () => go('viprequests'));

/* ---------- EXPOSE ---------- */
window.go = go;
window.toast = toast;
window.openModal = openModal;
window.closeModal = closeModal;
window.askConfirm = askConfirm;
window.logActivity = logActivity;
