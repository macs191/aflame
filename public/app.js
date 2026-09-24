/* ============================================================
   سيرفر الوحش 🐺 — Main Application v4.0
   Features: AI Voice • Sports Matches • Full Player • VIP
   ============================================================ */

/* ---------- 1. FIREBASE ---------- */
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
const auth = firebase.auth();

/* ---------- 2. STATE ---------- */
const state = {
    currentUser:null, userData:null, authMode:'login',
    videos:[], categories:[], sections:[], liveChannels:[], liveCategories:[],
    matches:[], matchCategories:[],
    settings:{}, ads:{},
    favorites: JSON.parse(localStorage.getItem('sw_favs')||'[]'),
    history: JSON.parse(localStorage.getItem('sw_history')||'[]'),
    achievements:{}, notifications:[], unreadNotifs:0,
    vipStatus:null, watchlists:[],
    currentItem:null, currentVideoEl:null, playerType:'vod',
    hls:null, dash:null, progressTimer:null, sleepTimer:null,
    searchQuery:'', theme: localStorage.getItem('sw_theme')||'dark',
    autoPlay: localStorage.getItem('sw_autoplay')!=='false',
    heroIndex:0, heroTimer:null, activeView:'home',
    activeLiveTab:'all', activeMatchTab:'all',
    userRef:null, vipRef:null, notifRef:null, ratingRef:null, commentRef:null,
    voiceRecognition:null, voiceActive:false,
    parentalPin: localStorage.getItem('sw_pin')||null,
    downloadQueue: JSON.parse(localStorage.getItem('sw_dlq')||'[]')
};

/* ---------- 3. UTILS ---------- */
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const debounce = (fn,ms=300)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);}};
const fmtDate = ts => ts?new Date(ts).toLocaleDateString('ar-EG',{year:'numeric',month:'short',day:'numeric'}):'—';
const fmtTime = ts => ts?new Date(ts).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}):'—';
const fmtRel = ts => {
    if(!ts) return '—';
    const d=Date.now()-ts, m=Math.floor(d/60000), h=Math.floor(d/3600000), dd=Math.floor(d/86400000);
    if(m<1) return 'الآن';
    if(m<60) return `منذ ${m} دقيقة`;
    if(h<24) return `منذ ${h} ساعة`;
    if(dd<30) return `منذ ${dd} يوم`;
    return fmtDate(ts);
};
const isVip = u => { if(!u) return false; const e=u.vipExpireDate||u.expireAt||0; return u.isVip===true && e===0 || e>Date.now(); };
const isBanned = u => !!(u && (u.isBanned||u.isBlocked));
const getUserLevel = u => {
    if(!u) return {key:'new',label:'زائر'};
    if(isVip(u)) return {key:'vip',label:'👑 VIP'};
    const d=(Date.now()-(u.createdAt||Date.now()))/86400000;
    if(d>=365) return {key:'gold',label:'🥇 ذهبي'};
    if(d>=90) return {key:'silver',label:'🥈 فضي'};
    if(d>=30) return {key:'bronze',label:'🥉 برونزي'};
    return {key:'new',label:'عضو جديد'};
};
const normalize = s => String(s||'').toLowerCase().replace(/[أإآا]/g,'ا').replace(/[ىي]/g,'ي').replace(/[ةه]/g,'ه').replace(/[\u064B-\u065F]/g,'').trim();

/* ---------- 4. UI HELPERS ---------- */
function toast(msg,type='',title=''){
    const w=$('#toasts'); if(!w) return;
    const t=document.createElement('div');
    t.className='toast '+type;
    const icons={ok:'fa-circle-check',err:'fa-circle-exclamation',warn:'fa-triangle-exclamation'};
    const ic=icons[type]||'fa-circle-info';
    t.innerHTML=`<div class="toast-i"><i class="fa-solid ${ic}"></i></div>
        <div class="toast-body">${title?`<div class="toast-title">${esc(title)}</div>`:''}<div class="toast-msg">${esc(msg)}</div></div>`;
    w.appendChild(t);
    setTimeout(()=>{t.style.transition='opacity .3s,transform .3s';t.style.opacity='0';t.style.transform='translateY(-12px)';setTimeout(()=>t.remove(),320);},3400);
}
function openModal(id){const m=$('#'+id);if(m)m.classList.add('active');}
function closeModal(id){const m=$('#'+id);if(m)m.classList.remove('active');}
let confirmResolver=null;
function askConfirm({title='تأكيد',msg='هل أنت متأكد؟',ok='تأكيد',type='danger'}={}){
    return new Promise(res=>{
        $('#cfTitle').textContent=title;
        $('#cfMsg').textContent=msg;
        $('#cfYes').textContent=ok;
        const ic=$('#cfIcon');
        ic.style.background=type==='warn'?'rgba(245,158,11,.15)':'rgba(229,9,20,.15)';
        ic.style.color=type==='warn'?'var(--warning)':'var(--accent)';
        openModal('confirmModal');
        confirmResolver=res;
    });
}
function hideLoader(){const l=$('#appLoader');if(l){l.classList.add('hide');setTimeout(()=>l.remove(),600);}}

/* ---------- 5. THEME ---------- */
function applyTheme(){
    document.documentElement.setAttribute('data-theme',state.theme);
    const b=$('#themeBtn');
    if(b) b.innerHTML=`<i class="fa-solid fa-${state.theme==='dark'?'sun':'moon'}"></i>`;
}
function toggleTheme(){
    state.theme=state.theme==='dark'?'light':'dark';
    localStorage.setItem('sw_theme',state.theme);
    applyTheme();
    toast(state.theme==='dark'?'🌙 الوضع الليلي':'☀️ الوضع النهاري','ok');
}

/* ---------- 6. NAV ACTIONS ---------- */
function renderNavActions(){
    const a=$('#navActions'); if(!a) return;
    const themeBtn=`<button class="nav-icon-btn" id="themeBtn" title="الوضع"><i class="fa-solid fa-${state.theme==='dark'?'sun':'moon'}"></i></button>`;

    if(state.currentUser && state.userData){
        const vip=isVip(state.userData);
        const pending=state.vipStatus && state.vipStatus.status==='pending';
        const tag=vip?'<span class="tag vip">👑 VIP</span>':pending?'<span class="tag pending">مراجعة</span>':'<span class="tag free">عادي</span>';
        const letter=(state.userData.name||'?').trim().charAt(0).toUpperCase();
        a.innerHTML=`${themeBtn}
            <button class="nav-icon-btn" id="notifBtn" title="الإشعارات"><i class="fa-solid fa-bell"></i>${state.unreadNotifs>0?`<span class="badge">${state.unreadNotifs}</span>`:''}</button>
            <div class="user-chip" id="userChip">
                <div class="avatar">${esc(letter)}</div>
                <span class="name">${esc(state.userData.name||'حسابي')}</span>
                ${tag}
            </div>`;
        $('#themeBtn').onclick=toggleTheme;
        $('#notifBtn').onclick=openNotifModal;
        $('#userChip').onclick=openProfileModal;
    }else{
        a.innerHTML=`${themeBtn}
            <button class="btn btn-outline sm" id="loginBtn"><i class="fa-solid fa-right-to-bracket"></i> دخول</button>
            <button class="btn btn-primary sm" id="registerBtn"><i class="fa-solid fa-user-plus"></i> جديد</button>`;
        $('#themeBtn').onclick=toggleTheme;
        $('#loginBtn').onclick=()=>openAuthModal('login');
        $('#registerBtn').onclick=()=>openAuthModal('register');
    }
}

/* ---------- 7. AUTH ---------- */
auth.onAuthStateChanged(user=>{
    if(state.userRef){state.userRef.off();state.userRef=null;}
    if(state.vipRef){state.vipRef.off();state.vipRef=null;}
    if(state.notifRef){state.notifRef.off();state.notifRef=null;}
    state.vipStatus=null; state.notifications=[]; state.unreadNotifs=0;

    if(user){
        state.currentUser=user;
        state.userRef=db.ref('users/'+user.uid);
        state.userRef.on('value',snap=>{
            state.userData=snap.val();
            if(!state.userData){
                state.userRef.set({
                    email:user.email,name:user.displayName||'عضو جديد',
                    isBanned:false,isBlocked:false,isVip:false,
                    vipExpireDate:0,expireAt:0,createdAt:Date.now()
                });
                return;
            }
            if(isBanned(state.userData)){openModal('bannedModal');closePlayer();renderNavActions();return;}
            closeModal('bannedModal');
            renderNavActions(); updateGuestWarn(); renderAll(); renderHero();
        });

        state.vipRef=db.ref('vipRequests').orderByChild('uid').equalTo(user.uid);
        state.vipRef.on('value',snap=>{
            let latest=null;
            if(snap.exists()){
                snap.forEach(c=>{
                    const r={id:c.key,...c.val()};
                    if(!latest || (r.createdAt||0)>(latest.createdAt||0)) latest=r;
                });
            }
            state.vipStatus=latest;
            renderNavActions();
        });

        state.notifRef=db.ref('notifications/'+user.uid);
        state.notifRef.on('value',snap=>{
            const arr=[];
            if(snap.exists()) snap.forEach(c=>arr.push({id:c.key,...c.val()}));
            arr.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
            state.notifications=arr;
            state.unreadNotifs=arr.filter(n=>!n.read).length;
            renderNavActions(); renderNotifList();
        });

        db.ref('achievements/'+user.uid).on('value',snap=>{
            state.achievements=snap.val()||{};
            checkAchievement('vip_member');
        });

        db.ref('watchlists/'+user.uid).on('value',snap=>{
            state.watchlists=[];
            if(snap.exists()) snap.forEach(c=>state.watchlists.push({id:c.key,...c.val()}));
        });
    }else{
        state.currentUser=null; state.userData=null; state.achievements={};
        renderNavActions(); updateGuestWarn(); renderAll(); renderHero();
    }
});

function updateGuestWarn(){
    const w=$('#guestWarn');
    if(w) w.style.display=state.currentUser?'none':'flex';
}

function openAuthModal(mode='login'){
    state.authMode=mode;
    const l=mode==='login';
    $('#authTitle').textContent=l?'تسجيل الدخول':'إنشاء حساب جديد';
    $('#nameGroup').style.display=l?'none':'block';
    $('#authSubmitBtn').textContent=l?'دخول':'إنشاء حساب';
    $('#authToggleText').textContent=l?'ليس لديك حساب؟':'لديك حساب بالفعل؟';
    $('#authToggleBtn').textContent=l?'إنشاء حساب':'تسجيل الدخول';
    openModal('authModal');
}

async function handleAuthSubmit(e){
    e.preventDefault();
    const email=$('#authEmail').value.trim();
    const pass=$('#authPassword').value;
    const name=$('#authName').value.trim();
    const btn=$('#authSubmitBtn');
    btn.disabled=true;
    try{
        if(state.authMode==='login'){
            await auth.signInWithEmailAndPassword(email,pass);
            toast('تم تسجيل الدخول ✅','ok');
        }else{
            if(!name){toast('أدخل اسمك','warn');btn.disabled=false;return;}
            const res=await auth.createUserWithEmailAndPassword(email,pass);
            await res.user.updateProfile({displayName:name});
            await db.ref('users/'+res.user.uid).set({
                email,name,isBanned:false,isBlocked:false,isVip:false,
                vipExpireDate:0,expireAt:0,createdAt:Date.now()
            });
            await db.ref('notifications/'+res.user.uid).push({
                title:'أهلاً بك في سيرفر الوحش 🐺',
                text:'استمتع بالمشاهدة. ترقّ VIP لفتح كل المميز!',
                type:'welcome',read:false,createdAt:Date.now()
            });
            toast('تم إنشاء الحساب ✅','ok');
        }
        closeModal('authModal');
        $('#authForm').reset();
    }catch(err){
        toast(err.message,'err','خطأ');
    }finally{btn.disabled=false;}
}

async function handleForgotPass(e){
    e.preventDefault();
    const email=$('#authEmail').value.trim();
    if(!email){toast('اكتب بريدك أولاً','warn');return;}
    try{await auth.sendPasswordResetEmail(email);toast('تم إرسال الرابط','ok');}
    catch(err){toast(err.message,'err');}
}

function logout(){
    auth.signOut().then(()=>{toast('تم تسجيل الخروج','ok');closeModal('profileModal');});
}

/* ---------- 8. DATA FETCH ---------- */
function fetchAll(){
    db.ref('videos').on('value',snap=>{
        state.videos=[];
        if(snap.exists()) snap.forEach(c=>state.videos.push({id:c.key,...c.val()}));
        renderAll(); renderHero();
    });
    db.ref('categories').on('value',snap=>{
        state.categories=[];
        if(snap.exists()) snap.forEach(c=>state.categories.push({id:c.key,...c.val()}));
    });
    db.ref('sections').on('value',snap=>{
        state.sections=[];
        if(snap.exists()){
            snap.forEach(c=>{
                const s={id:c.key,...c.val()};
                if(s.active!==false) state.sections.push(s);
            });
            state.sections.sort((a,b)=>(a.order||0)-(b.order||0));
        }
        renderDynamicSections();
    });
    db.ref('liveChannels').on('value',snap=>{
        state.liveChannels=[];
        if(snap.exists()) snap.forEach(c=>state.liveChannels.push({id:c.key,...c.val()}));
        renderLive();
    });
    db.ref('liveCategories').on('value',snap=>{
        state.liveCategories=[];
        if(snap.exists()) snap.forEach(c=>state.liveCategories.push({id:c.key,...c.val()}));
        renderLiveTabs();
    });
    db.ref('matches').on('value',snap=>{
        state.matches=[];
        if(snap.exists()) snap.forEach(c=>state.matches.push({id:c.key,...c.val()}));
        renderMatches();
    });
    db.ref('matchCategories').on('value',snap=>{
        state.matchCategories=[];
        if(snap.exists()) snap.forEach(c=>state.matchCategories.push({id:c.key,...c.val()}));
        renderMatchTabs();
    });
    db.ref('settings').on('value',snap=>{
        state.settings=snap.val()||{};
        applySettings();
    });
    db.ref('ads').on('value',snap=>{
        state.ads=snap.val()||{};
        renderAds();
    });
}

function applySettings(){
    const s=state.settings;
    if(s.siteName){
        const bt=$('#brandText');
        if(bt) bt.innerHTML=esc(s.siteName).replace('الوحش','<b>الوحش</b>')+' 🐺';
        document.title=s.siteName+' | منصة البث';
    }
    if(s.accentColor) document.documentElement.style.setProperty('--accent',s.accentColor);
    if(s.vipColor) document.documentElement.style.setProperty('--vip',s.vipColor);
    if(s.tickerText){
        $('#tickerBar').classList.add('show');
        $('#tickerContent').textContent=s.tickerText;
    }
    if(s.popupBanner && !sessionStorage.getItem('popupDismissed')){
        $('#popupBannerText').textContent=s.popupBanner;
        setTimeout(()=>{openModal('popupBannerModal');sessionStorage.setItem('popupDismissed','1');},2000);
    }
}

function renderAds(){
    const ads=state.ads;
    [['#adTop',ads.topBanner],['#adMid',ads.midBanner],['#adBottom',ads.bottomBanner]].forEach(([sel,html])=>{
        const el=$(sel);
        if(el&&html){el.innerHTML=html;el.classList.add('show');}
    });
}

/* ---------- 9. HERO ---------- */
function renderHero(){
    const sl=$('#heroSlider'), dots=$('#heroDots'), sec=$('#heroSection');
    if(!sl||!dots||!sec) return;

    let featured=state.videos.filter(v=>v.featured===true);
    if(featured.length===0) featured=state.videos.filter(v=>v.isVip).slice(0,5);
    if(featured.length===0) featured=state.videos.slice(0,5);
    if(featured.length===0){sec.classList.remove('show');return;}

    sec.classList.add('show');
    sl.innerHTML=featured.map((it,i)=>{
        const bg=it.backdrop||it.image||it.poster||'';
        const style=bg?`background-image:url('${esc(bg)}')`:'';
        return `<div class="hero-slide ${i===0?'active':''}" data-i="${i}" style="${style}">
            <div class="hero-slide-content">
                <div class="hero-slide-badge">
                    <i class="fa-solid fa-${it.isVip?'crown':'fire'}"></i>
                    ${it.isVip?'محتوى VIP':'محتوى مميز'}
                </div>
                <h2>${esc(it.title||'')}</h2>
                <div class="hero-slide-meta">
                    ${it.year?`<span><i class="fa-solid fa-calendar"></i> ${it.year}</span>`:''}
                    ${it.category?`<span><i class="fa-solid fa-folder"></i> ${esc(it.category)}</span>`:''}
                    ${it.ratingAvg?`<span><i class="fa-solid fa-star" style="color:var(--vip)"></i> ${Number(it.ratingAvg).toFixed(1)}</span>`:''}
                    <span><i class="fa-regular fa-eye"></i> ${it.views||0}</span>
                </div>
                <p>${esc(it.description||'شاهد الآن على سيرفر الوحش بأفضل جودة.')}</p>
                <div class="hero-slide-actions">
                    <button class="btn btn-primary" onclick="openPlayer('${esc(it.id)}','vod')"><i class="fa-solid fa-play"></i> مشاهدة</button>
                    <button class="btn btn-outline" onclick="showItemDetails('${esc(it.id)}')"><i class="fa-solid fa-circle-info"></i> التفاصيل</button>
                </div>
            </div>
        </div>`;
    }).join('');

    dots.innerHTML=featured.map((_,i)=>`<button class="hero-dot ${i===0?'active':''}" data-i="${i}"></button>`).join('');
    $$('.hero-dot').forEach(d=>d.onclick=()=>goHero(+d.dataset.i));

    if(state.heroTimer) clearInterval(state.heroTimer);
    state.heroTimer=setInterval(()=>goHero(state.heroIndex+1),7000);
}

function goHero(i){
    const sl=$$('.hero-slide'), dots=$$('.hero-dot');
    if(!sl.length) return;
    i=((i%sl.length)+sl.length)%sl.length;
    sl.forEach((s,idx)=>s.classList.toggle('active',idx===i));
    dots.forEach((d,idx)=>d.classList.toggle('active',idx===i));
    state.heroIndex=i;
}

/* ---------- 10. RENDER MAIN ---------- */
function renderAll(){
    renderDynamicSections();
    renderLive();
    renderMatches();
}

function renderDynamicSections(){
    const w=$('#dynamicSections'); if(!w) return;

    if(state.sections.length===0){
        w.innerHTML=buildDefaultSections();
        return;
    }
    w.innerHTML=state.sections.map(s=>{
        const items=getItemsForSection(s);
        if(items.length===0) return '';
        const cls=s.style==='landscape'?'landscape':'';
        return `<section class="content-row" data-sec="${esc(s.id)}">
            <div class="row-header">
                <div class="row-title"><i class="fa-solid ${s.icon||'fa-film'}"></i><h2>${esc(s.title||'قسم')}</h2></div>
                <button class="row-action" onclick="openSectionDetail('${esc(s.id)}')"><span>الكل</span><i class="fa-solid fa-chevron-left"></i></button>
            </div>
            <div class="row-scroll">
                ${items.slice(0,20).map(it=>renderCard(it,'row-card '+cls)).join('')}
            </div>
        </section>`;
    }).join('');
}

function buildDefaultSections(){
    const v=state.videos;
    const trending=v.slice().sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,20);
    const newest=v.slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).slice(0,20);
    const vips=v.filter(i=>i.isVip).slice(0,20);

    return `
        ${trending.length?`<section class="content-row">
            <div class="row-header"><div class="row-title"><i class="fa-solid fa-fire"></i><h2>الأكثر مشاهدة</h2></div>
            <button class="row-action" onclick="showAllInRow('trending')"><span>الكل</span><i class="fa-solid fa-chevron-left"></i></button></div>
            <div class="row-scroll">${trending.map(it=>renderCard(it,'row-card')).join('')}</div>
        </section>`:''}
        ${newest.length?`<section class="content-row">
            <div class="row-header"><div class="row-title"><i class="fa-solid fa-clock"></i><h2>أحدث الإضافات</h2></div>
            <button class="row-action" onclick="showAllInRow('newest')"><span>الكل</span><i class="fa-solid fa-chevron-left"></i></button></div>
            <div class="row-scroll">${newest.map(it=>renderCard(it,'row-card')).join('')}</div>
        </section>`:''}
        ${vips.length?`<section class="content-row">
            <div class="row-header"><div class="row-title"><i class="fa-solid fa-crown" style="color:var(--vip)"></i><h2>محتوى VIP</h2></div>
            <button class="row-action" onclick="showAllInRow('vip')"><span>الكل</span><i class="fa-solid fa-chevron-left"></i></button></div>
            <div class="row-scroll">${vips.map(it=>renderCard(it,'row-card')).join('')}</div>
        </section>`:''}`;
}

function getItemsForSection(s){
    let items=state.videos.slice();
    if(s.filter==='vip') items=items.filter(i=>i.isVip);
    else if(s.filter==='free') items=items.filter(i=>!i.isVip);
    if(Array.isArray(s.categories)&&s.categories.length>0) items=items.filter(i=>s.categories.includes(i.category));
    const sort=s.sort||'newest';
    if(sort==='newest') items.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    else if(sort==='views') items.sort((a,b)=>(b.views||0)-(a.views||0));
    else if(sort==='rating') items.sort((a,b)=>(b.ratingAvg||0)-(a.ratingAvg||0));
    else if(sort==='random') items.sort(()=>Math.random()-.5);
    return items.slice(0,s.limit||20);
}

/* ---------- 11. CARD ---------- */
function renderCard(item,extra=''){
    const isFav=state.favorites.includes(item.id);
    const ph='https://via.placeholder.com/400x580/141721/6b7280?text='+encodeURIComponent(item.title||'SW');
    const img=item.poster||item.image||item.thumbnail||ph;
    const avg=item.ratingAvg?Number(item.ratingAvg).toFixed(1):null;

    return `<div class="card ${item.isVip?'is-vip':''} ${extra}" data-id="${esc(item.id)}">
        <button class="card-fav ${isFav?'active':''}" onclick="toggleFav(event,'${esc(item.id)}')">
            <i class="fa-${isFav?'solid':'regular'} fa-heart"></i>
        </button>
        <div class="card-thumb" onclick="openPlayer('${esc(item.id)}','vod')">
            <img src="${esc(img)}" alt="${esc(item.title)}" loading="lazy" onerror="this.src='${ph}'">
            <div class="card-overlay"><div class="card-play"><i class="fa-solid fa-play"></i></div></div>
            ${item.isVip?'<div class="card-badge vip"><i class="fa-solid fa-crown"></i> VIP</div>':''}
            ${item.isNew?'<div class="card-badge new">جديد</div>':''}
            ${item.category?`<div class="card-badge cat">${esc(item.category)}</div>`:''}
            ${item.episode?`<div class="card-badge episode">حلقة ${esc(item.episode)}</div>`:''}
        </div>
        <div class="card-info">
            <div class="card-title">${esc(item.title)}</div>
            <div class="card-meta">
                <span><i class="fa-regular fa-eye"></i> ${item.views||0}</span>
                ${avg?`<span class="card-rating"><i class="fa-solid fa-star"></i> ${avg}</span>`:`<span>${item.year||''}</span>`}
            </div>
        </div>
    </div>`;
}

/* ---------- 12. LIVE ---------- */
function renderLiveTabs(){
    const t=$('#liveTabs'); if(!t) return;
    let h='<button class="row-action active" data-lt="all">الكل</button>';
    state.liveCategories.forEach(c=>{if(c.name) h+=`<button class="row-action" data-lt="${esc(c.name)}">${esc(c.name)}</button>`;});
    t.innerHTML=h;
    $$('#liveTabs .row-action').forEach(b=>b.onclick=()=>{
        $$('#liveTabs .row-action').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        state.activeLiveTab=b.dataset.lt;
        renderLive();
    });
}

function renderLive(){
    const g=$('#liveGrid'); if(!g) return;
    let ch=state.liveChannels.slice();
    if(state.activeLiveTab!=='all') ch=ch.filter(c=>c.category===state.activeLiveTab);
    if(ch.length===0){g.innerHTML='<div class="empty-state"><i class="fa-solid fa-tower-broadcast"></i><h3>لا توجد قنوات</h3></div>';return;}
    g.innerHTML=ch.map(c=>{
        const name=c.name||c.title||'قناة';
        const logo=c.logo||c.image||'https://via.placeholder.com/300x168/0f1117/ef4444?text='+encodeURIComponent(name);
        return `<div class="card landscape ${c.isVip?'is-vip':''}" onclick="openPlayer('${esc(c.id)}','live')">
            <div class="card-thumb">
                <img src="${esc(logo)}" alt="${esc(name)}" loading="lazy">
                <div class="card-badge live">مباشر</div>
                ${c.isVip?'<div class="card-badge vip"><i class="fa-solid fa-crown"></i></div>':''}
            </div>
            <div class="card-info">
                <div class="card-title">${esc(name)}</div>
                <div class="card-meta"><span><i class="fa-solid fa-tv"></i> ${esc(c.category||'بث')}</span></div>
            </div>
        </div>`;
    }).join('');
}

/* ---------- 13. MATCHES (Sports) ---------- */
function renderMatchTabs(){
    const t=$('#matchTabs'); if(!t) return;
    let h='<button class="row-action active" data-mt="all">الكل</button>';
    let h2='<button class="row-action active" data-mt="live">مباشر</button><button class="row-action" data-mt="upcoming">قادمة</button><button class="row-action" data-mt="finished">منتهية</button>';
    state.matchCategories.forEach(c=>{if(c.name) h2+=`<button class="row-action" data-mt="${esc(c.name)}">${esc(c.name)}</button>`;});
    t.innerHTML=h2;
    $$('#matchTabs .row-action').forEach(b=>b.onclick=()=>{
        $$('#matchTabs .row-action').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        state.activeMatchTab=b.dataset.mt;
        renderMatches();
    });
}

function renderMatches(){
    const g=$('#matchGrid'); if(!g) return;
    let m=state.matches.slice();
    if(state.activeMatchTab==='live') m=m.filter(x=>x.status==='live');
    else if(state.activeMatchTab==='upcoming') m=m.filter(x=>x.status==='upcoming'||!x.status);
    else if(state.activeMatchTab==='finished') m=m.filter(x=>x.status==='finished');
    else if(state.activeMatchTab!=='all') m=m.filter(x=>x.category===state.activeMatchTab);

    if(m.length===0){g.innerHTML='<div class="empty-state"><i class="fa-solid fa-futbol"></i><h3>لا توجد مباريات</h3></div>';return;}

    g.innerHTML=m.map(mt=>{
        const live=mt.status==='live';
        const fin=mt.status==='finished';
        const badge=live?'<div class="match-live-badge"><span class="dot"></span> مباشر الآن</div>':
                     fin?'<div class="match-badge" style="background:var(--text-3)">انتهت</div>':
                     `<div class="match-badge">${mt.time||mt.date||'قريباً'}</div>`;
        return `<div class="match-card ${mt.isVip?'is-vip':''}" onclick="openPlayer('${esc(mt.id)}','match')">
            <div class="match-head">
                ${badge}
                ${mt.isVip?'<div class="card-badge vip" style="position:relative;top:0;right:0"><i class="fa-solid fa-crown"></i> VIP</div>':''}
            </div>
            <div class="match-teams">
                <div class="team">
                    <img src="${esc(mt.team1Logo||'https://via.placeholder.com/60')}" alt="" onerror="this.src='https://via.placeholder.com/60'">
                    <span>${esc(mt.team1||'فريق 1')}</span>
                </div>
                <div class="match-vs">
                    <div class="vs">VS</div>
                    ${mt.score1!==undefined?`<div class="match-score">${esc(mt.score1)} - ${esc(mt.score2||0)}</div>`:''}
                </div>
                <div class="team">
                    <img src="${esc(mt.team2Logo||'https://via.placeholder.com/60')}" alt="" onerror="this.src='https://via.placeholder.com/60'">
                    <span>${esc(mt.team2||'فريق 2')}</span>
                </div>
            </div>
            <div class="match-info">
                <span><i class="fa-solid fa-trophy"></i> ${esc(mt.league||mt.category||'')}</span>
                <span><i class="fa-solid fa-tv"></i> ${esc(mt.channel||'')}</span>
            </div>
        </div>`;
    }).join('');
}

/* ---------- 14. FAVORITES ---------- */
function toggleFav(e,id){
    if(e) e.stopPropagation();
    const i=state.favorites.indexOf(id);
    if(i>-1){state.favorites.splice(i,1);toast('تمت الإزالة','warn');}
    else{state.favorites.push(id);toast('تمت الإضافة للمفضلة','ok');checkAchievement('first_fav');}
    localStorage.setItem('sw_favs',JSON.stringify(state.favorites));
    renderAll(); renderHero();
    if(state.currentItem && state.currentItem.id===id) updatePlayerFavBtn();
}

/* ---------- 15. VIEW SWITCHER ---------- */
function setActiveView(v){
    state.activeView=v;
    $$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.nav===v));
    $$('.bn-item').forEach(b=>b.classList.toggle('active',b.dataset.bn===v));

    const live=$('#liveSection'), match=$('#matchSection'), dyn=$('#dynamicSections');

    if(v==='live'){
        if(dyn)dyn.style.display='none';
        if(match)match.style.display='none';
        if(live)live.style.display='block';
        $('#heroSection')?.classList.remove('show');
    }else if(v==='matches'){
        if(dyn)dyn.style.display='none';
        if(live)live.style.display='none';
        if(match)match.style.display='block';
        $('#heroSection')?.classList.remove('show');
    }else if(v==='movies'||v==='series'||v==='vip'){
        if(dyn)dyn.style.display='block';
        if(live)live.style.display='none';
        if(match)match.style.display='none';
        renderHero();
        let filtered=state.videos.slice();
        let title='';
        if(v==='movies'){filtered=filtered.filter(x=>(x.category||'').includes('فيلم')||(x.type||'')==='movie');title='أفلام';}
        else if(v==='series'){filtered=filtered.filter(x=>(x.category||'').includes('مسلسل')||(x.type||'')==='series');title='مسلسلات';}
        else if(v==='vip'){filtered=filtered.filter(x=>x.isVip);title='محتوى VIP';}
        if(filtered.length===0){toast('لا يوجد محتوى في هذا القسم','info');return;}
        $('#sectionDetailTitle').textContent=title;
        $('#sectionDetailCount').textContent=filtered.length+' عنصر';
        $('#sectionDetailGrid').innerHTML=filtered.map(it=>renderCard(it)).join('');
        openModal('sectionModal');
    }else{
        if(dyn)dyn.style.display='block';
        if(live)live.style.display='none';
        if(match)match.style.display='none';
        renderHero();
    }
}

/* ---------- 16. SEARCH ---------- */
const performSearch = debounce(()=>{
    const q=state.searchQuery.trim();
    if(!q){renderAll();renderHero();closeModal('sectionModal');return;}
    const nq=normalize(q);
    const results=state.videos.filter(v=>
        normalize(v.title).includes(nq) ||
        normalize(v.description).includes(nq) ||
        normalize(v.category).includes(nq)
    );
    $('#sectionDetailTitle').textContent=`نتائج: "${q}"`;
    $('#sectionDetailCount').textContent=results.length+' نتيجة';
    $('#sectionDetailGrid').innerHTML=results.length===0
        ?'<div class="empty-state"><i class="fa-solid fa-search"></i><h3>لا توجد نتائج</h3><p>جرّب كلمة أخرى</p></div>'
        :results.map(it=>renderCard(it)).join('');
    openModal('sectionModal');
},500);

/* ---------- 17. PLAYER ---------- */
async function openPlayer(id,type='vod'){
    let item=null;
    if(type==='live') item=state.liveChannels.find(c=>c.id===id);
    else if(type==='match') item=state.matches.find(m=>m.id===id);
    else item=state.videos.find(v=>v.id===id);

    if(!item){toast('المحتوى غير موجود','err');return;}
    if(!state.currentUser){toast('سجل دخول للمشاهدة','warn');openAuthModal('login');return;}
    if(item.isVip && !isVip(state.userData)){openSubModal();toast('هذا المحتوى لـ VIP','warn');return;}

    state.currentItem=item;
    state.playerType=type;

    const title=item.title||`${item.team1||''} vs ${item.team2||''}`||item.name||'عرض';
    $('#ppTitle').textContent=title;
    $('#ppTitleBig').textContent=title;
    $('#ppViews').textContent=(item.views||0)+1;
    $('#ppCategory').innerHTML=`<i class="fa-solid fa-folder"></i> ${esc(item.category||(type==='live'?'بث مباشر':type==='match'?'مباراة':'عام'))}`;
    $('#ppYear').textContent=item.year?'📅 '+item.year:'';
    $('#ppBadges').innerHTML=item.isVip?'<span class="card-badge vip" style="position:static;display:inline-flex"><i class="fa-solid fa-crown"></i> VIP</span>':'';

    // Show/hide blocks based on type
    const isVod=type==='vod';
    $('#ratingBlock').style.display=isVod?'flex':'none';
    document.querySelector('.comments-block').style.display=isVod?'block':'none';
    $('#downloadsBlock').style.display=isVod?'block':'none';

    // Description
    $('#ppDesc').textContent=item.description||'لا يوجد وصف.';
    $('#ppDesc').style.display=item.description?'block':'none';

    if(isVod){
        setupRating(item.id);
        setupComments(item.id);
        db.ref('videos/'+id+'/views').transaction(v=>(v||0)+1);
        const h=state.history.find(x=>x.id===id);
        saveHistory(item, h&&h.progress<95?h.currentTime:0, 0);
    }

    // Servers
    setupServers(item);

    // Download buttons
    setupDownloadButtons(item);

    // Actions
    $('#ppFavBtn').onclick=(e)=>toggleFav(e,item.id);
    $('#ppShareBtn').onclick=()=>shareCurrent();
    $('#ppAddListBtn').onclick=()=>addToWatchlistUI(item.id);

    updatePlayerFavBtn();

    // Show page
    $('#playerPage').classList.add('active');
    document.body.style.overflow='hidden';

    // Restore position after video loads
    if(isVod){
        const h=state.history.find(x=>x.id===id);
        if(h&&h.currentTime>0&&h.progress<95){
            setTimeout(()=>{
                if(state.currentVideoEl&&state.currentVideoEl.duration){
                    try{state.currentVideoEl.currentTime=h.currentTime;}catch(e){}
                }
            },1800);
        }
    }

    // Update URL hash
    history.replaceState(null,'',`#${type==='live'?'live':type==='match'?'match':'watch'}=${id}`);
}

function updatePlayerFavBtn(){
    const b=$('#ppFavBtn'); if(!b||!state.currentItem) return;
    const f=state.favorites.includes(state.currentItem.id);
    b.className=`btn ${f?'btn-vip':'btn-outline'}`;
    b.innerHTML=`<i class="fa-${f?'solid':'regular'} fa-heart"></i> ${f?'في المفضلة':'المفضلة'}`;
}

function setupServers(item){
    const block=$('#serversBlock'), grid=$('#serversGrid');
    grid.innerHTML='';

    let servers=[];
    if(Array.isArray(item.servers)&&item.servers.length>0) servers=item.servers.filter(s=>s&&(s.url||s.link));
    else if(item.url||item.streamUrl||item.link) servers=[{name:'السيرفر الرئيسي',url:item.url||item.streamUrl||item.link,type:item.streamType||'auto'}];

    if(servers.length===0){
        if(block) block.style.display='none';
        renderPlayer('','auto');
        return;
    }
    if(block) block.style.display='block';
    servers.forEach((s,i)=>{
        const b=document.createElement('button');
        b.className='server-btn'+(i===0?' active':'');
        b.textContent=s.name||`سيرفر ${i+1}`;
        b.onclick=()=>{
            $$('#serversGrid .server-btn').forEach(x=>x.classList.remove('active'));
            b.classList.add('active');
            renderPlayer(s.url,s.type||'auto');
        };
        grid.appendChild(b);
    });
    renderPlayer(servers[0].url,servers[0].type||'auto');
}

function renderPlayer(url,type='auto'){
    destroyPlayer();
    const c=$('#playerContainer'); c.innerHTML='';

    if(!url){
        c.innerHTML='<div class="player-error"><i class="fa-solid fa-triangle-exclamation"></i><p>الرابط غير متوفر</p></div>';
        return;
    }
    const u=String(url).trim();
    if(!/^https?:\/\//i.test(u)){
        c.innerHTML='<div class="player-error"><i class="fa-solid fa-link-slash"></i><p>رابط غير صالح</p></div>';
        return;
    }

    const isHls=u.includes('.m3u8')||type==='hls';
    const isDash=u.includes('.mpd')||type==='dash';
    const isVid=u.match(/\.(mp4|webm|ogg|mov|mkv)(\?.*)?$/i)||type==='video';

    if(isHls){
        const v=document.createElement('video');
        v.controls=true; v.autoplay=true; v.playsInline=true;
        v.style.cssText='width:100%;height:100%;background:#000;';
        c.appendChild(v);
        state.currentVideoEl=v;
        attachToolbar(c,v); attachProgressSaver(v);
        if(typeof Hls!=='undefined'&&Hls.isSupported()){
            state.hls=new Hls({enableWorker:true});
            state.hls.loadSource(u);
            state.hls.attachMedia(v);
            state.hls.on(Hls.Events.MANIFEST_PARSED,()=>v.play().catch(()=>{}));
            state.hls.on(Hls.Events.ERROR,(_,d)=>{if(d.fatal)c.innerHTML='<div class="player-error"><i class="fa-solid fa-circle-exclamation"></i><p>خطأ في HLS</p></div>';});
        }else if(v.canPlayType('application/vnd.apple.mpegurl')){
            v.src=u; v.play().catch(()=>{});
        }
    }else if(isDash){
        const v=document.createElement('video');
        v.controls=true; v.autoplay=true; v.playsInline=true;
        v.style.cssText='width:100%;height:100%;background:#000;';
        c.appendChild(v);
        state.currentVideoEl=v;
        attachToolbar(c,v); attachProgressSaver(v);
        if(typeof dashjs!=='undefined'){
            state.dash=dashjs.MediaPlayer().create();
            state.dash.initialize(v,u,true);
        }
    }else if(isVid){
        const v=document.createElement('video');
        v.controls=true; v.autoplay=true; v.playsInline=true;
        v.src=u; v.style.cssText='width:100%;height:100%;background:#000;';
        c.appendChild(v);
        state.currentVideoEl=v;
        attachToolbar(c,v); attachProgressSaver(v);
        v.play().catch(()=>{});
    }else{
        const f=document.createElement('iframe');
        f.src=u;
        f.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';
        f.allowFullscreen=true;
        c.appendChild(f);
    }
}

function attachToolbar(container,video){
    const tb=document.createElement('div');
    tb.className='player-toolbar';
    tb.innerHTML=`
        <button class="player-tool" id="pipBtn" title="صورة داخل صورة"><i class="fa-solid fa-clone"></i></button>
        <button class="player-tool" id="speedBtn" title="السرعة"><i class="fa-solid fa-gauge-high"></i></button>
        <button class="player-tool" id="sleepBtn" title="مؤقت النوم"><i class="fa-solid fa-moon"></i></button>
        <button class="player-tool" id="shotBtn" title="لقطة شاشة"><i class="fa-solid fa-camera"></i></button>`;
    container.appendChild(tb);

    const sm=document.createElement('div');
    sm.className='speed-menu';
    [0.5,0.75,1,1.25,1.5,1.75,2].forEach(s=>{
        const b=document.createElement('button');
        b.textContent=s+'x';
        if(s===1)b.classList.add('active');
        b.onclick=()=>{
            video.playbackRate=s;
            sm.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
            b.classList.add('active');
            sm.classList.remove('show');
        };
        sm.appendChild(b);
    });
    container.appendChild(sm);

    tb.querySelector('#speedBtn').onclick=e=>{e.stopPropagation();sm.classList.toggle('show');};

    tb.querySelector('#pipBtn').onclick=async()=>{
        try{
            if(document.pictureInPictureElement) await document.exitPictureInPicture();
            else if(video.requestPictureInPicture) await video.requestPictureInPicture();
        }catch(e){toast('PiP غير مدعوم','warn');}
    };

    tb.querySelector('#sleepBtn').onclick=()=>showSleepTimer(video);
    tb.querySelector('#shotBtn').onclick=()=>captureScreenshot(video);

    document.addEventListener('click',()=>sm.classList.remove('show'),{once:true});
}

function attachProgressSaver(video){
    if(state.progressTimer) clearInterval(state.progressTimer);
    state.progressTimer=setInterval(()=>{
        if(state.currentItem&&video.currentTime>5&&video.duration>0&&!video.paused){
            saveHistory(state.currentItem,video.currentTime,video.duration);
        }
    },8000);

    video.addEventListener('pause',()=>{
        if(state.currentItem&&video.duration>0) saveHistory(state.currentItem,video.currentTime,video.duration);
    });

    video.addEventListener('ended',()=>{
        if(state.autoPlay && state.playerType==='vod') playNextEpisode();
    });
}

function showSleepTimer(video){
    const mins=prompt('مؤقت النوم (دقائق):\n0 = إلغاء','30');
    if(mins===null) return;
    const m=parseInt(mins);
    if(state.sleepTimer){clearTimeout(state.sleepTimer);state.sleepTimer=null;}
    if(!m||m<=0){toast('تم إلغاء المؤقت','ok');return;}
    state.sleepTimer=setTimeout(()=>{
        if(state.currentVideoEl) state.currentVideoEl.pause();
        toast(`انتهى مؤقت النوم (${m} دقيقة)`,'warn');
    },m*60000);
    toast(`⏰ سيتم الإيقاف بعد ${m} دقيقة`,'ok');
}

function captureScreenshot(video){
    try{
        const c=document.createElement('canvas');
        c.width=video.videoWidth; c.height=video.videoHeight;
        c.getContext('2d').drawImage(video,0,0);
        c.toBlob(b=>{
            const u=URL.createObjectURL(b);
            const a=document.createElement('a');
            a.href=u; a.download=`screenshot-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(u);
            toast('تم حفظ اللقطة','ok');
        });
    }catch(e){toast('فشل اللقطة','err');}
}

function saveHistory(item,ct,dur){
    const p=dur>0?Math.min(100,(ct/dur)*100):0;
    state.history=state.history.filter(h=>h.id!==item.id);
    state.history.unshift({
        id:item.id,title:item.title||item.name,
        image:item.poster||item.image||item.thumbnail,
        currentTime:ct||0,duration:dur||0,progress:p,time:Date.now()
    });
    if(state.history.length>40) state.history.pop();
    localStorage.setItem('sw_history',JSON.stringify(state.history));
    if(state.history.length>=10) checkAchievement('ten_watches');
}

function destroyPlayer(){
    if(state.hls){try{state.hls.destroy();}catch(e){}state.hls=null;}
    if(state.dash){try{state.dash.reset();}catch(e){}state.dash=null;}
    if(state.progressTimer){clearInterval(state.progressTimer);state.progressTimer=null;}
    if(state.sleepTimer){clearTimeout(state.sleepTimer);state.sleepTimer=null;}
    const c=$('#playerContainer'); if(c) c.innerHTML='';
    state.currentVideoEl=null;
}

function closePlayer(){
    if(state.currentVideoEl&&state.currentItem&&state.currentVideoEl.duration>0){
        saveHistory(state.currentItem,state.currentVideoEl.currentTime,state.currentVideoEl.duration);
    }
    if(state.currentVideoEl){try{state.currentVideoEl.pause();state.currentVideoEl.src='';}catch(e){}}
    if(state.ratingRef){state.ratingRef.off();state.ratingRef=null;}
    if(state.commentRef){state.commentRef.off();state.commentRef=null;}
    destroyPlayer();
    $('#playerPage').classList.remove('active');
    document.body.style.overflow='';
    state.currentItem=null;
    history.replaceState(null,'',location.pathname);
}

function playNextEpisode(){
    const c=state.currentItem;
    if(!c||!c.seriesId) return;
    const ep=parseInt(c.episode)||0;
    const next=state.videos.find(v=>v.seriesId===c.seriesId&&parseInt(v.episode)===ep+1);
    if(!next){toast('لا توجد حلقة تالية','info');return;}
    toast('⏭️ الحلقة التالية...','ok');
    closePlayer();
    setTimeout(()=>openPlayer(next.id,'vod'),700);
}

function shareCurrent(){
    if(!state.currentItem) return;
    const t=state.currentItem.title||state.currentItem.name;
    const url=location.origin+location.pathname+`#${state.playerType==='live'?'live':state.playerType==='match'?'match':'watch'}=${state.currentItem.id}`;
    const data={title:t,text:`شاهد "${t}" على سيرفر الوحش 🐺`,url};
    if(navigator.share){navigator.share(data).catch(()=>{});}
    else{navigator.clipboard.writeText(url);toast('تم نسخ الرابط','ok');}
}

/* ---------- 18. DOWNLOAD BUTTONS ---------- */
function setupDownloadButtons(item){
    const fast=$('#dlFastBtn'), free=$('#dlAdsBtn');
    const fastUrl=item.downloadFast||item.downloadUrl||'';
    const adsUrl=item.downloadAds||item.downloadNormal||item.url||'';

    if(fast){
        fast.onclick=()=>{
            if(!isVip(state.userData)){openSubModal();toast('التحميل المباشر لـ VIP','warn');return;}
            if(!fastUrl){toast('رابط VIP غير متوفر','err');return;}
            toast('⚡ جاري التحميل...','ok');
            window.open(fastUrl,'_blank');
        };
    }
    if(free){
        free.onclick=()=>{
            if(!adsUrl){toast('رابط التحميل غير متوفر','err');return;}
            openFreeDownloadModal(item,adsUrl);
        };
    }
}

function openFreeDownloadModal(item,url){
    const card=$('#dlModalCard');
    card.innerHTML=`
        <button class="modal-close" data-close="dlModal"><i class="fa-solid fa-xmark"></i></button>
        <div class="dl-hero">
            <div class="dl-icon"><i class="fa-solid fa-cloud-arrow-down"></i></div>
            <h3>تحميل: ${esc(item.title||'')}</h3>
            <p>سيبدأ التحميل بعد انتهاء الإعلان</p>
        </div>
        <div id="adContainer" class="ad-slot show" style="margin:14px 0;min-height:180px">${state.ads.downloadAd||'<div style="color:var(--text-3);padding:40px">مساحة إعلانية</div>'}</div>
        <div id="dlTimerArea"></div>`;
    card.querySelector('[data-close]').onclick=()=>closeModal('dlModal');
    openModal('dlModal');
    startFreeDownload(url);
}

function startFreeDownload(url){
    const area=$('#dlTimerArea');
    if(!area) return;
    let sec=15;
    area.innerHTML=`
        <div class="countdown-wrap">
            <div class="countdown-circle" id="cdCircle"><span class="countdown-num" id="cdNum">15</span></div>
            <p class="countdown-txt">جاري تحضير الرابط...</p>
        </div>
        <button class="dl-ready-btn" id="dlReady"><i class="fa-solid fa-cloud-arrow-down"></i> اضغط للتحميل</button>`;
    const b=$('#dlReady');
    b.onclick=()=>{
        window.open(url,'_blank');
        closeModal('dlModal');
    };
    const t=setInterval(()=>{
        sec--;
        const n=$('#cdNum'), c=$('#cdCircle');
        if(n) n.textContent=sec;
        if(c) c.style.setProperty('--progress',((15-sec)/15*100)+'%');
        if(sec<=0){
            clearInterval(t);
            if(b) b.classList.add('show');
            toast('الرابط جاهز','ok');
        }
    },1000);
}

/* ---------- 19. RATINGS ---------- */
function setupRating(id){
    const s=$('#rbStars'), a=$('#rbAvg');
    if(!s) return;
    s.querySelectorAll('i').forEach(i=>i.className='fa-solid fa-star');
    if(state.ratingRef) state.ratingRef.off();
    state.ratingRef=db.ref('ratings/'+id);
    state.ratingRef.on('value',snap=>{
        let c=0,sum=0,my=0;
        if(snap.exists()) snap.forEach(x=>{
            const v=Number(x.val().value)||0;
            if(v>0){c++;sum+=v;}
            if(state.currentUser&&x.key===state.currentUser.uid) my=v;
        });
        if(c>0){
            const avg=sum/c;
            a.innerHTML=`<strong>${avg.toFixed(1)}</strong> / 5 • ${c} تقييم`;
            s.querySelectorAll('i').forEach(i=>i.classList.toggle('active',Number(i.dataset.v)<=Math.round(avg)));
        }else{a.textContent='لا توجد تقييمات';s.querySelectorAll('i').forEach(i=>i.classList.remove('active'));}
        if(my>0) s.querySelectorAll('i').forEach(i=>{if(Number(i.dataset.v)===my)i.classList.add('active');});
    });
    s.querySelectorAll('i').forEach(st=>{
        st.onclick=async()=>{
            if(!state.currentUser){toast('سجل دخول','warn');return;}
            const v=Number(st.dataset.v);
            try{
                await db.ref(`ratings/${id}/${state.currentUser.uid}`).set({value:v,ts:Date.now()});
                const sn=await db.ref('ratings/'+id).once('value');
                let cc=0,ss=0;
                sn.forEach(x=>{const vv=Number(x.val().value)||0;if(vv>0){cc++;ss+=vv;}});
                if(cc>0){
                    db.ref('videos/'+id+'/ratingAvg').set((ss/cc).toFixed(2));
                    db.ref('videos/'+id+'/ratingCount').set(cc);
                }
                toast(`قيّمت بـ ${v} نجوم ⭐`,'ok');
                checkAchievement('first_rating');
            }catch(e){toast('فشل التقييم','err');}
        };
        st.onmouseenter=()=>s.querySelectorAll('i').forEach(i=>{if(Number(i.dataset.v)<=Number(st.dataset.v))i.classList.add('hover');});
        st.onmouseleave=()=>s.querySelectorAll('i').forEach(i=>i.classList.remove('hover'));
    });
}

/* ---------- 20. COMMENTS ---------- */
function setupComments(id){
    const l=$('#commentsList'), c=$('#commentsCount');
    if(!l) return;
    l.innerHTML='<div class="status-box"><div class="spinner"></div></div>';
    if(state.commentRef) state.commentRef.off();
    state.commentRef=db.ref('comments/'+id).limitToLast(80);
    state.commentRef.on('value',snap=>{
        const arr=[];
        if(snap.exists()) snap.forEach(x=>arr.push({id:x.key,...x.val()}));
        arr.sort((a,b)=>(b.ts||0)-(a.ts||0));
        c.textContent=arr.length;
        if(arr.length===0){l.innerHTML='<div class="status-box"><i class="fa-regular fa-comment empty-icon"></i><p>كن أول من يعلّق</p></div>';return;}
        l.innerHTML=arr.map(x=>{
            const owner=state.currentUser&&x.uid===state.currentUser.uid;
            const letter=(x.name||'?').trim().charAt(0).toUpperCase();
            return `<div class="comment-item">
                <div class="ci-avatar">${esc(letter)}</div>
                <div class="ci-body">
                    <div class="ci-head">
                        <span class="ci-name">${esc(x.name||'مستخدم')}</span>
                        ${x.isVip?'<span class="ci-vip">👑 VIP</span>':''}
                        <span class="ci-time">${fmtRel(x.ts)}</span>
                        ${owner?`<button class="ci-del" onclick="deleteComment('${esc(id)}','${esc(x.id)}')"><i class="fa-solid fa-trash"></i></button>`:''}
                    </div>
                    <div class="ci-text">${esc(x.text)}</div>
                </div>
            </div>`;
        }).join('');
    });
}

async function sendComment(){
    if(!state.currentUser){toast('سجل دخول','warn');return;}
    if(!state.currentItem) return;
    const inp=$('#commentInput');
    const txt=inp.value.trim();
    if(!txt) return;
    if(txt.length>300){toast('التعليق طويل','warn');return;}
    inp.value='';
    try{
        await db.ref('comments/'+state.currentItem.id).push({
            uid:state.currentUser.uid,
            name:state.userData?state.userData.name:'مستخدم',
            isVip:isVip(state.userData),
            text:txt, ts:Date.now()
        });
        checkAchievement('first_comment');
    }catch(e){toast('فشل الإرسال','err');}
}

async function deleteComment(itemId,commentId){
    const ok=await askConfirm({title:'حذف',msg:'حذف تعليقك؟'});
    if(ok){await db.ref(`comments/${itemId}/${commentId}`).remove();toast('تم الحذف','ok');}
}

/* ---------- 21. PROFILE ---------- */
function openProfileModal(){
    if(!state.userData) return;
    const u=state.userData;
    const lvl=getUserLevel(u);
    const vip=isVip(u);
    const exp=u.vipExpireDate||u.expireAt||0;

    $('#profileAvatar').textContent=(u.name||'?').trim().charAt(0).toUpperCase();
    $('#profileName').textContent=u.name||'مستخدم';
    $('#profileEmail').textContent=u.email||'---';
    $('#profileLevelWrap').innerHTML=`<span class="tag ${vip?'vip':'free'}">${lvl.label}</span>`;
    $('#profileSubStatus').textContent=vip?'VIP':'عادي';
    $('#profileExpireDate').textContent=exp?fmtDate(exp):'—';
    if(vip&&exp>0){$('#profileDaysLeft').textContent=Math.ceil((exp-Date.now())/86400000)+' يوم';}
    else{$('#profileDaysLeft').textContent=vip?'دائم':'0';}
    $('#profileFavCount').textContent=state.favorites.length;

    const box=$('#profileVipStatus');
    if(state.vipStatus&&state.vipStatus.status==='pending'){
        box.innerHTML=`<div class="vip-status-card pending">
            <div class="vsc-icon"><i class="fa-solid fa-hourglass-half"></i></div>
            <div><div class="vsc-title">طلب VIP قيد المراجعة</div>
            <div class="vsc-sub">سيتم التفعيل قريباً</div></div>
        </div>`;
    }else box.innerHTML='';
    openModal('profileModal');
}

/* ---------- 22. VIP ---------- */
function openSubModal(){
    const box=$('#subModalStatusBox');
    if(state.vipStatus&&state.vipStatus.status==='pending'){
        box.innerHTML=`<div class="vip-status-card pending">
            <div class="vsc-icon"><i class="fa-solid fa-hourglass-half"></i></div>
            <div><div class="vsc-title">طلبك قيد المراجعة</div>
            <div class="vsc-sub">تم الإرسال للإدارة</div></div>
        </div>`;
    }else box.innerHTML='';
    openModal('subModal');
}

async function requestVip(){
    const num=state.settings.whatsappNumber||'201000000000';
    const msg=encodeURIComponent(`مرحباً، أريد الاشتراك في VIP.\nالبريد: ${state.currentUser?.email||'—'}`);
    if(state.currentUser){
        try{
            await db.ref('vipRequests').push({
                uid:state.currentUser.uid,
                email:state.currentUser.email,
                name:state.userData?.name||'',
                status:'pending',
                createdAt:Date.now()
            });
            toast('تم تسجيل طلبك','ok');
        }catch(e){console.error(e);}
    }
    window.open(`https://wa.me/${num}?text=${msg}`,'_blank');
}

/* ---------- 23. NOTIFICATIONS ---------- */
function renderNotifList(){
    const l=$('#notifList'); if(!l) return;
    if(state.notifications.length===0){
        l.innerHTML='<div class="status-box"><i class="fa-solid fa-bell-slash empty-icon"></i><p>لا توجد إشعارات</p></div>';
        return;
    }
    l.innerHTML=state.notifications.map(n=>`
        <div class="notif-item">
            <div class="ni-icon"><i class="fa-solid ${n.type==='vip'?'fa-crown':n.type==='banned'?'fa-ban':'fa-bell'}"></i></div>
            <div class="ni-body">
                <div class="ni-title">${esc(n.title||'إشعار')}</div>
                <div class="ni-text">${esc(n.text||'')}</div>
                <div class="ni-time">${fmtRel(n.createdAt)}</div>
            </div>
        </div>`).join('');
}

function openNotifModal(){
    openModal('notifModal');
    if(state.currentUser){
        db.ref('notifications/'+state.currentUser.uid).once('value').then(snap=>{
            if(snap.exists()){
                const u={};
                snap.forEach(c=>{if(!c.val().read)u[c.key+'/read']=true;});
                if(Object.keys(u).length) db.ref('notifications/'+state.currentUser.uid).update(u);
            }
        });
    }
}

/* ---------- 24. SECTIONS ---------- */
function openSectionDetail(id){
    const s=state.sections.find(x=>x.id===id);
    if(!s) return;
    const items=getItemsForSection(s);
    $('#sectionDetailTitle').textContent=s.title||'قسم';
    $('#sectionDetailCount').textContent=items.length+' عنصر';
    $('#sectionDetailGrid').innerHTML=items.length===0
        ?'<div class="empty-state"><i class="fa-solid fa-folder-open"></i><h3>القسم فارغ</h3></div>'
        :items.map(it=>renderCard(it)).join('');
    openModal('sectionModal');
}

function showAllInRow(type){
    let items=state.videos.slice();
    let title='الكل';
    if(type==='trending'){items.sort((a,b)=>(b.views||0)-(a.views||0));title='الأكثر مشاهدة';}
    else if(type==='newest'){items.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));title='أحدث الإضافات';}
    else if(type==='vip'){items=items.filter(i=>i.isVip);title='محتوى VIP';}
    $('#sectionDetailTitle').textContent=title;
    $('#sectionDetailCount').textContent=items.length+' عنصر';
    $('#sectionDetailGrid').innerHTML=items.map(it=>renderCard(it)).join('');
    openModal('sectionModal');
}

function showItemDetails(id){
    const item=state.videos.find(v=>v.id===id);
    if(!item) return;
    openPlayer(id,'vod');
}

/* ---------- 25. ACHIEVEMENTS ---------- */
const ACHIEVEMENTS={
    first_fav:{title:'المفضلة الأولى',icon:'fa-heart'},
    first_rating:{title:'أول تقييم',icon:'fa-star'},
    ten_watches:{title:'مشاهد نشيط',icon:'fa-eye'},
    vip_member:{title:'عضو VIP',icon:'fa-crown'},
    first_comment:{title:'صوتك مسموع',icon:'fa-comment'},
    first_download:{title:'أول تحميل',icon:'fa-download'}
};

function checkAchievement(key){
    if(!state.currentUser||!ACHIEVEMENTS[key]) return;
    if(state.achievements[key]) return;
    db.ref(`achievements/${state.currentUser.uid}/${key}`).once('value').then(snap=>{
        if(!snap.exists()){
            db.ref(`achievements/${state.currentUser.uid}/${key}`).set({unlockedAt:Date.now()});
            toast(`🏆 إنجاز: ${ACHIEVEMENTS[key].title}`,'ok');
        }
    });
}

/* ---------- 26. WATCHLIST ---------- */
function addToWatchlistUI(itemId){
    if(!state.currentUser){toast('سجل دخول','warn');return;}
    if(state.watchlists.length===0){
        const name=prompt('اسم القائمة الجديدة:','قائمتي');
        if(!name) return;
        db.ref('watchlists/'+state.currentUser.uid).push({name,items:[itemId],createdAt:Date.now()});
        toast('تمت الإضافة','ok');
        return;
    }
    const list=state.watchlists[0];
    const items=list.items||[];
    if(!items.includes(itemId)) items.push(itemId);
    db.ref(`watchlists/${state.currentUser.uid}/${list.id}/items`).set(items);
    toast('تمت الإضافة للقائمة','ok');
}

/* ---------- 27. AI VOICE ASSISTANT ---------- */
function initVoiceAssistant(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){$('#voiceBtn').style.display='none';return;}

    const rec=new SR();
    rec.lang='ar-EG';
    rec.continuous=false;
    rec.interimResults=true;
    rec.maxAlternatives=1;

    rec.onstart=()=>{
        state.voiceActive=true;
        $('#voiceBtn').classList.add('listening');
        $('#voiceOverlay').classList.add('active');
        $('#voiceStatus').textContent='🎤 أستمع إليك...';
        $('#voiceTranscript').textContent='';
    };

    rec.onresult=(e)=>{
        let interim='',final='';
        for(let i=e.resultIndex;i<e.results.length;i++){
            if(e.results[i].isFinal) final+=e.results[i][0].transcript;
            else interim+=e.results[i][0].transcript;
        }
        $('#voiceTranscript').textContent=final||interim;
        if(final) processVoiceCommand(final.trim());
    };

    rec.onerror=(e)=>{
        const msgs={ 'no-speech':'لم أسمع شيئاً، حاول مرة أخرى', 'audio-capture':'لا يوجد ميكروفون', 'not-allowed':'مطلوب إذن الميكروفون' };
        toast(msgs[e.error]||'خطأ في الميكروفون','err');
        stopVoiceAssistant();
    };

    rec.onend=()=>{
        state.voiceActive=false;
        $('#voiceBtn').classList.remove('listening');
        setTimeout(()=>{if(!state.voiceActive) $('#voiceOverlay').classList.remove('active');},1200);
    };

    state.voiceRecognition=rec;
}

function startVoiceAssistant(){
    if(!state.voiceRecognition) return toast('المتصفح لا يدعم المساعد الصوتي','warn');
    try{state.voiceRecognition.start();}catch(e){toast('جاري التشغيل...','info');}
}

function stopVoiceAssistant(){
    if(state.voiceRecognition){
        try{state.voiceRecognition.abort();}catch(e){}
    }
    state.voiceActive=false;
    $('#voiceBtn').classList.remove('listening');
    $('#voiceOverlay').classList.remove('active');
}

function processVoiceCommand(cmd){
    const c=normalize(cmd);
    $('#voiceStatus').textContent='✅ '+cmd;
    setTimeout(()=>stopVoiceAssistant(),900);

    // Navigation commands
    if(c.includes('الرئيسيه')||c.includes('الرئيسية')||c==='home'){setActiveView('home');toast('الرئيسية','ok');return;}
    if(c.includes('فيلم')||c.includes('افلام')||c.includes('movie')){setActiveView('movies');toast('الأفلام','ok');return;}
    if(c.includes('مسلسل')||c.includes('مسلسلات')||c.includes('series')){setActiveView('series');toast('المسلسلات','ok');return;}
    if(c.includes('بث مباشر')||c.includes('قنوات')||c.includes('live')){setActiveView('live');toast('البث المباشر','ok');return;}
    if(c.includes('مباريات')||c.includes('مباراه')||c.includes('match')){setActiveView('matches');toast('المباريات','ok');return;}
    if(c.includes('vip')||c.includes('في اي بي')||c.includes('مميز')){setActiveView('vip');toast('VIP','ok');return;}
    if(c.includes('مفضل')||c.includes('المفضله')||c.includes('favorite')){
        setActiveView('home');
        $('#sectionDetailTitle').textContent='المفضلة';
        const favs=state.videos.filter(v=>state.favorites.includes(v.id));
        $('#sectionDetailCount').textContent=favs.length+' عنصر';
        $('#sectionDetailGrid').innerHTML=favs.length?favs.map(it=>renderCard(it)).join(''):'<div class="empty-state"><i class="fa-heart"></i><h3>لا توجد مفضلات</h3></div>';
        openModal('sectionModal');
        return;
    }
    if(c.includes('حساب')||c.includes('ملفي')||c.includes('profile')){state.currentUser?openProfileModal():openAuthModal('login');return;}
    if(c.includes('اشعار')||c.includes('notif')){if(state.currentUser)openNotifModal();return;}

    // Media control
    if(state.currentVideoEl){
        if(c.includes('وقف')||c.includes('ايقاف')||c.includes('كتم')){state.currentVideoEl.muted=!state.currentVideoEl.muted;toast(state.currentVideoEl.muted?'🔇 كتم':'🔊 صوت','ok');return;}
        if(c.includes('شغل')||c.includes('تشغيل')||c.includes('play')){state.currentVideoEl.play();toast('▶️ تشغيل','ok');return;}
        if(c.includes('ايقاف مؤقت')||c.includes('pause')){state.currentVideoEl.pause();toast('⏸️ إيقاف','ok');return;}
        if(c.includes('اغلق')||c.includes('خروج')||c.includes('close')){closePlayer();return;}
    }

    // Search command
    if(c.startsWith('ابحث')||c.startsWith('بحث عن')){
        const q=cmd.replace(/^ابحث(\s+عن)?\s*/i,'').trim();
        if(q){state.searchQuery=q;const si=$('#searchInput');if(si)si.value=q;performSearch();toast('بحث: '+q,'ok');return;}
    }
    if(c.startsWith('اعرض')||c.startsWith('افتح')||c.startsWith('شغل')){
        const q=cmd.replace(/^(اعرض|افتح|شغل)\s*/i,'').trim();
        if(q){
            const nq=normalize(q);
            const match=state.videos.find(v=>normalize(v.title).includes(nq));
            if(match){openPlayer(match.id,'vod');toast('▶️ '+match.title,'ok');return;}
            const liveMatch=state.liveChannels.find(cn=>normalize(cn.name||cn.title||'').includes(nq));
            if(liveMatch){openPlayer(liveMatch.id,'live');toast('📺 '+liveMatch.name,'ok');return;}
            const mm=state.matches.find(m=>normalize((m.team1||'')+' '+(m.team2||'')).includes(nq));
            if(mm){openPlayer(mm.id,'match');toast('⚽ المباراة','ok');return;}
            state.searchQuery=q;const si=$('#searchInput');if(si)si.value=q;performSearch();
            toast('نتائج: '+q,'ok');
            return;
        }
    }

    // Fallback: search
    state.searchQuery=cmd;
    const si=$('#searchInput');
    if(si) si.value=cmd;
    performSearch();
}

/* ---------- 28. KEYBOARD ---------- */
function handleKeyboard(e){
    if(!state.currentVideoEl) return;
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
    const v=state.currentVideoEl;
    switch(e.key){
        case ' ': e.preventDefault(); v.paused?v.play():v.pause(); break;
        case 'ArrowRight': v.currentTime+=5; break;
        case 'ArrowLeft': v.currentTime-=5; break;
        case 'ArrowUp': e.preventDefault(); v.volume=Math.min(1,v.volume+.1); break;
        case 'ArrowDown': e.preventDefault(); v.volume=Math.max(0,v.volume-.1); break;
        case 'm': case 'M': v.muted=!v.muted; break;
        case 'f': case 'F': document.fullscreenElement?document.exitFullscreen?.():v.requestFullscreen?.(); break;
        case 'Escape': closePlayer(); break;
    }
}

/* ---------- 29. URL HASH ---------- */
function handleUrlHash(){
    const h=location.hash;
    if(h.startsWith('#watch=')){const id=h.replace('#watch=','');setTimeout(()=>openPlayer(id,'vod'),1000);}
    else if(h.startsWith('#live=')){const id=h.replace('#live=','');setTimeout(()=>openPlayer(id,'live'),1000);}
    else if(h.startsWith('#match=')){const id=h.replace('#match=','');setTimeout(()=>openPlayer(id,'match'),1000);}
}

/* ---------- 30. EVENTS ---------- */
function initEvents(){
    $$('.nav-link').forEach(b=>b.onclick=()=>setActiveView(b.dataset.nav));
    $$('.bn-item').forEach(b=>b.onclick=()=>{
        const bn=b.dataset.bn;
        if(bn==='search'){$('#mobileSearch').classList.toggle('open');setTimeout(()=>$('#mobileSearchInput')?.focus(),100);}
        else if(bn==='profile'){state.currentUser?openProfileModal():openAuthModal('login');}
        else setActiveView(bn);
    });

    const si=$('#searchInput'), msi=$('#mobileSearchInput');
    if(si) si.oninput=(e)=>{state.searchQuery=e.target.value;$('#searchClear').classList.toggle('show',!!e.target.value);performSearch();};
    if(msi) msi.oninput=(e)=>{state.searchQuery=e.target.value;performSearch();};
    $('#searchClear')?.addEventListener('click',()=>{si.value='';state.searchQuery='';$('#searchClear').classList.remove('show');renderAll();renderHero();closeModal('sectionModal');});
    $('#mobileSearchClear')?.addEventListener('click',()=>{msi.value='';state.searchQuery='';renderAll();renderHero();closeModal('sectionModal');});

    $('#authForm')?.addEventListener('submit',handleAuthSubmit);
    $('#authToggleBtn')?.addEventListener('click',e=>{e.preventDefault();openAuthModal(state.authMode==='login'?'register':'login');});
    $('#forgotPassLink')?.addEventListener('click',handleForgotPass);
    $('#btnRequestVip')?.addEventListener('click',requestVip);
    $('#commentSendBtn')?.addEventListener('click',sendComment);
    $('#commentInput')?.addEventListener('keypress',e=>{if(e.key==='Enter')sendComment();});

    $('#cfYes')?.addEventListener('click',()=>{closeModal('confirmModal');if(confirmResolver){confirmResolver(true);confirmResolver=null;}});
    $('#cfNo')?.addEventListener('click',()=>{closeModal('confirmModal');if(confirmResolver){confirmResolver(false);confirmResolver=null;}});

    $$('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
    $$('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('active');}));

    $('#voiceBtn')?.addEventListener('click',startVoiceAssistant);
    $('#voiceOverlay')?.addEventListener('click',e=>{if(e.target===$('#voiceOverlay'))stopVoiceAssistant();});

    document.addEventListener('keydown',handleKeyboard);
    window.addEventListener('scroll',()=>{$('#mainNavbar')?.classList.toggle('scrolled',window.scrollY>30);});
    window.addEventListener('hashchange',handleUrlHash);

    const y=$('#yearSpan'); if(y) y.textContent=new Date().getFullYear();
}

/* ---------- 31. BOOT ---------- */
document.addEventListener('DOMContentLoaded',()=>{
    applyTheme();
    renderNavActions();
    updateGuestWarn();
    initEvents();
    initVoiceAssistant();
    fetchAll();
    setTimeout(hideLoader,1000);
});
