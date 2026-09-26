/* ============================================================
   سيرفر الوحش 🐺 — Admin App Part 2
   Live / Matches / Sections / VIP Requests / Comments / Ratings
   Ads / Notifications / M3U Import / Settings
   ============================================================ */

/* ============================================================
   LIVE CATEGORIES
   ============================================================ */
let allLiveCats = [];
let allLiveChs = [];

function loadLiveCategories(){
    db.ref('liveCategories').on('value', snap=>{
        const sel = $('#liveChCategory');
        const filt = $('#filterLiveCat');
        if(sel) sel.innerHTML = '';
        if(filt) filt.innerHTML = '<option value="all">كل التصنيفات</option>';
        allLiveCats = [];
        if(snap.exists()) snap.forEach(c=>allLiveCats.push({id:c.key,...c.val()}));
        allLiveCats.forEach(r=>{
            if(sel) sel.add(new Option(r.name, r.name));
            if(filt) filt.add(new Option(r.name, r.name));
        });
        const stat = $('#liveStatCats');
        if(stat) stat.textContent = allLiveCats.length.toLocaleString('ar-EG');

        const box = $('#liveCatList');
        if(!box) return;
        if(!allLiveCats.length){
            box.innerHTML = `<div class="empty"><i class="fa-solid fa-folder-open"></i><p>لا توجد تصنيفات</p></div>`;
            return;
        }
        box.innerHTML = allLiveCats.map(r=>`
            <div class="dl-row simple" style="align-items:center">
                <div class="dl-cell"><i class="fa-solid ${esc(r.icon||'fa-folder')}" style="color:var(--live)"></i><span class="v">${esc(r.name)}</span></div>
                <div class="dl-actions">
                    <button class="btn ghost sm" onclick="editLiveCat(${jsArg(r.id)},${jsArg(r.name)},${jsArg(r.icon||'')})"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn red sm" onclick="delLiveCat(${jsArg(r.id)},${jsArg(r.name)})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`).join('');
    });
}
$('#addLiveCatForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const name = $('#newLiveCatName').value.trim();
    const icon = $('#newLiveCatIcon').value.trim() || 'fa-tv';
    if(!name) return;
    try{
        await db.ref('liveCategories').push({name,icon,createdAt:Date.now()});
        $('#newLiveCatName').value = '';
        $('#newLiveCatIcon').value = '';
        logActivity(`إضافة تصنيف بث: ${name}`);
        toast('تم الإضافة',name,'ok');
    }catch(err){ toast('خطأ',err.message,'err'); }
});
function editLiveCat(id,name,icon){
    $('#liveCatId').value = id;
    $('#liveCatName').value = name;
    $('#liveCatIcon').value = icon;
    openModal('mLiveCat');
}
window.editLiveCat = editLiveCat;
$('#liveCatForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const id = $('#liveCatId').value;
    try{
        await db.ref('liveCategories/'+id).update({
            name: $('#liveCatName').value.trim(),
            icon: $('#liveCatIcon').value.trim() || 'fa-tv'
        });
        closeModal('mLiveCat');
        logActivity('تعديل تصنيف بث');
        toast('تم الحفظ','','ok');
    }catch(err){ toast('خطأ',err.message,'err'); }
});
async function delLiveCat(id,name){
    const ok = await askConfirm({title:'حذف تصنيف بث',msg:`حذف "${name}"؟`,okText:'حذف'});
    if(!ok) return;
    await db.ref('liveCategories/'+id).remove();
    logActivity(`حذف تصنيف بث: ${name}`);
    toast('تم الحذف',name,'ok');
}
window.delLiveCat = delLiveCat;

/* ============================================================
   LIVE CHANNELS
   ============================================================ */
function loadLiveChannels(){
    db.ref('liveChannels').on('value',snap=>{
        allLiveChs=[];if(snap.exists())snap.forEach(c=>allLiveChs.push({id:c.key,...c.val()}));
        $('#liveStatChannels').textContent=allLiveChs.length.toLocaleString('ar-EG');
        $('#livePanelCount').textContent=`${allLiveChs.length.toLocaleString('ar-EG')} قناة محفوظة بشكل مستقل`;
        $('#liveStatVip').textContent=allLiveChs.filter(c=>c.isVip).length.toLocaleString('ar-EG');
        $('#statTotalLive').textContent=allLiveChs.length.toLocaleString('ar-EG');renderLiveChannelsList();
    });
}

function renderLiveChannelsList(){
    const q = ($('#qLive').value||'').toLowerCase().trim();
    const f = $('#filterLiveCat').value;
    const ft = ($('#filterLiveType')?.value) || 'all';
    const fa = ($('#filterLiveAge')?.value) || 'all';
    const box = $('#liveChannelsList');
    if(!box) return;
    let list = allLiveChs.filter(c=>{
        if(f !== 'all' && c.category !== f) return false;
        if(ft === 'vip' && !c.isVip) return false;
        if(ft === 'free' && c.isVip) return false;
        if(fa !== 'all' && (c.ageRating||'عام') !== fa) return false;
        if(q){
            const n = (c.name||'').toLowerCase();
            const cat = (c.category||'').toLowerCase();
            if(!n.includes(q) && !cat.includes(q)) return false;
        }
        return true;
    });
    if(!list.length){
        box.innerHTML = `<div class="empty"><i class="fa-solid fa-tv"></i><p>لا توجد قنوات مطابقة</p></div>`;
        return;
    }
    if((localStorage.getItem('admin_live_view_v2')||'grid')==='grid'){
        box.innerHTML = adminCardGrid(list,'live');
        return;
    }
    box.innerHTML = list.map(c=>`
        <div class="dl-row">
            <img class="dl-thumb logo" src="${esc(safeHttpUrl(c.logo)||'https://via.placeholder.com/80x50/1f1f1f/ffffff?text=LIVE')}" data-fallback-src="https://via.placeholder.com/80x50/1f1f1f/ffffff?text=LIVE">
            <div class="dl-cell"><span class="k">الاسم</span><span class="v">${esc(c.name||'قناة')}</span></div>
            <div class="dl-cell"><span class="k">التصنيف</span><span class="badge">${esc(c.category||'عام')}</span>${c.ageRating&&c.ageRating!=='عام'?` <span class="badge age">${esc(c.ageRating)}</span>`:''}</div>
            <div class="dl-cell"><span class="k">الشبكة</span><span class="v">${esc(c.network||'—')}</span></div>
            <div class="dl-cell"><span class="k">النوع</span>${c.isVip ? '<span class="badge vip"><i class="fa-solid fa-crown"></i> VIP</span>' : '<span class="badge live"><i class="fa-solid fa-tower-broadcast"></i> مباشر</span>'}</div>
            <div class="dl-cell"><span class="k">مشاهدون</span><span class="v"><i class="fa-regular fa-eye"></i> ${(c.viewers||0).toLocaleString('ar-EG')}</span></div>
            <div class="dl-cell"><span class="k">الترتيب</span><span class="v">${c.order||0}</span></div>
            <div class="dl-actions">
                <button class="btn ghost sm" onclick="editLiveChannel(${jsArg(c.id)})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn ghost sm" onclick="window.testServerUrl(${jsArg(c.url||'')},null)" title="اختبار"><i class="fa-solid fa-flask"></i></button>
                <button class="btn red sm" onclick="delLiveChannel(${jsArg(c.id)},${jsArg(c.name||'')})"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`).join('');
}
$('#qLive')?.addEventListener('input',debounce(renderLiveChannelsList,220));
$('#filterLiveCat')?.addEventListener('change',renderLiveChannelsList);
$('#filterLiveType')?.addEventListener('change',renderLiveChannelsList);
$('#filterLiveAge')?.addEventListener('change',renderLiveChannelsList);
$('#btnNewLiveChannel')?.addEventListener('click',()=>openLiveChannelModal());

function openLiveChannelModal(ch = null){
    $('#liveChForm').reset();
    $('#liveChId').value = '';
    $('#liveChTitle').textContent = ch ? 'تعديل قناة' : 'إضافة قناة جديدة';
    if(ch){
        $('#liveChId').value = ch.id;
        $('#liveChName').value = ch.name || '';
        $('#liveChCategory').value = ch.category || (allLiveCats[0]?.name||'');
        $('#liveChLogo').value = ch.logo || '';
        $('#liveChUrl').value = ch.url || ch.streamUrl || '';
        $('#liveChIsVip').value = ch.isVip ? 'true' : 'false';
        $('#liveChAgeRating').value = ch.ageRating || 'عام';
        $('#liveChType').value = ch.type || 'auto';
        $('#liveChOrder').value = ch.order || 0;
        $('#liveChDescription').value = ch.description || '';
    }else{
        if(allLiveCats[0]) $('#liveChCategory').value = allLiveCats[0].name;
    }
    openModal('mLiveChannel');
}
async function editLiveChannel(id){
    const snap = await db.ref('liveChannels/'+id).once('value');
    if(!snap.exists()) return toast('غير موجود','','err');
    openLiveChannelModal({id,...snap.val()});
}
window.editLiveChannel = editLiveChannel;

$('#liveChForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const id = $('#liveChId').value;
    const data = {
        name: $('#liveChName').value.trim(),
        category: $('#liveChCategory').value,
        logo: $('#liveChLogo').value.trim(),
        url: $('#liveChUrl').value.trim(),
        isVip: $('#liveChIsVip').value === 'true',
        ageRating: $('#liveChAgeRating').value || 'عام',
        type: $('#liveChType').value || 'auto',
        order: parseInt($('#liveChOrder').value) || 0,
        description: $('#liveChDescription').value.trim(),
        updatedAt: Date.now()
    };
    const embedSnippet=data.type==='embed'&&/^\s*</.test(data.url)&&data.url.length<=20000&&/<(iframe|video|audio)\b/i.test(data.url);
    if(!data.name||data.name.length>120||data.description.length>1000||data.category.length>120||(!safeHttpUrl(data.url)&&!embedSnippet)||!['عام','+13','+16','18+'].includes(data.ageRating)||!['auto','hls','dash','video','embed'].includes(data.type)||!Number.isInteger(data.order)||Math.abs(data.order)>100000){toast('تحقق من بيانات القناة','الاسم أو التصنيف أو الترتيب أو رابط HTTP/HTTPS غير صالح. يسمح بكود تضمين محدود في وضع Embed فقط.','err');return;}
    if(data.logo&&!safeHttpUrl(data.logo)){toast('رابط الشعار غير صالح','','err');return;}
    try{
        const recordId=id||db.ref('liveChannels').push().key;
        const old=id?((await db.ref('liveChannels/'+id).once('value')).val()||{}):{};
        const full={...old,...data,...(!id?{viewers:0,createdAt:Date.now()}:{})};
        await db.ref().update({['liveChannels/'+recordId]:data,['publicCatalog/liveChannels/'+recordId]:publicLiveProjection(full)});
        closeModal('mLiveChannel');
        logActivity(`${id?'تعديل':'إضافة'} قناة: ${data.name}`);
        toast('تم الحفظ', data.name, 'ok');
    }catch(err){ toast('خطأ',err.message,'err'); }
});
async function delLiveChannel(id,name){
    const ok = await askConfirm({title:'حذف قناة',msg:`حذف "${name}"؟`,okText:'حذف'});
    if(!ok) return;
    await db.ref().update({['liveChannels/'+id]:null,['publicCatalog/liveChannels/'+id]:null});
    logActivity(`حذف قناة: ${name}`);
    toast('تم الحذف',name,'ok');
}
window.delLiveChannel = delLiveChannel;

$('#liveChTestBtn')?.addEventListener('click', (e) => {
    const url = $('#liveChUrl').value.trim();
    if(!url){ toast('أدخل الرابط أولاً','','warn'); return; }
    window.testServerUrl(url, e.currentTarget);
});

/* ============================================================
   MATCHES (SPORTS)
   ============================================================ */
let allMatchCats = [];
let allMatches = [];

function loadMatchCategories(){
    db.ref('matchCategories').on('value', snap=>{
        const sel = $('#matchCategory');
        if(sel) sel.innerHTML = '';
        allMatchCats = [];
        if(snap.exists()) snap.forEach(c=>allMatchCats.push({id:c.key,...c.val()}));
        allMatchCats.forEach(r=>{
            if(sel) sel.add(new Option(r.name, r.name));
        });
        if(allMatchCats.length === 0 && sel){
            // auto-create defaults
            ['دوري أبطال أوروبا','الدوري الإنجليزي','الدوري الإسباني','كأس العالم','عام'].forEach(name=>{
                db.ref('matchCategories').push({name, icon:'fa-trophy', createdAt:Date.now()});
            });
        }
        const box = $('#matchCatList');
        if(!box) return;
        if(!allMatchCats.length){
            box.innerHTML = `<div class="empty"><i class="fa-solid fa-folder-open"></i><p>جاري التهيئة...</p></div>`;
            return;
        }
        box.innerHTML = allMatchCats.map(r=>`
            <div class="dl-row simple" style="align-items:center">
                <div class="dl-cell"><i class="fa-solid ${esc(r.icon||'fa-trophy')}" style="color:var(--success)"></i><span class="v">${esc(r.name)}</span></div>
                <div class="dl-actions">
                    <button class="btn red sm" onclick="delMatchCat(${jsArg(r.id)},${jsArg(r.name)})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`).join('');
    });
}
$('#addMatchCatForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const name = $('#newMatchCatName').value.trim();
    const icon = $('#newMatchCatIcon').value.trim() || 'fa-trophy';
    if(!name) return;
    try{
        await db.ref('matchCategories').push({name,icon,createdAt:Date.now()});
        $('#newMatchCatName').value = '';
        $('#newMatchCatIcon').value = '';
        logActivity(`إضافة تصنيف مباريات: ${name}`);
        toast('تم الإضافة',name,'ok');
    }catch(err){ toast('خطأ',err.message,'err'); }
});
async function delMatchCat(id,name){
    const ok = await askConfirm({title:'حذف تصنيف',msg:`حذف "${name}"؟`,okText:'حذف'});
    if(!ok) return;
    await db.ref('matchCategories/'+id).remove();
    logActivity(`حذف تصنيف: ${name}`);
    toast('تم الحذف',name,'ok');
}
window.delMatchCat = delMatchCat;

function loadMatches(){
    db.ref('matches').on('value', snap=>{
        allMatches = [];
        if(snap.exists()) snap.forEach(c=>allMatches.push({id:c.key,...c.val()}));
        const live = allMatches.filter(m=>m.status === 'live').length;
        const upcoming = allMatches.filter(m=>m.status === 'upcoming' || !m.status).length;
        const finished = allMatches.filter(m=>m.status === 'finished').length;
        $('#matchStatTotal').textContent = allMatches.length.toLocaleString('ar-EG');
        $('#matchStatLive').textContent = live.toLocaleString('ar-EG');
        $('#matchStatUpcoming').textContent = upcoming.toLocaleString('ar-EG');
        $('#matchStatFinished').textContent = finished.toLocaleString('ar-EG');
        $('#statTotalMatches').textContent = allMatches.length.toLocaleString('ar-EG');
        renderMatchesList();
    });
}

function renderMatchesList(){
    const q = ($('#qMatch').value||'').toLowerCase().trim();
    const f = $('#filterMatchStatus').value;
    const box = $('#matchesList');
    if(!box) return;
    let list = allMatches.filter(m=>{
        if(f !== 'all' && m.status !== f) return false;
        if(q){
            const t1 = (m.team1||'').toLowerCase();
            const t2 = (m.team2||'').toLowerCase();
            if(!t1.includes(q) && !t2.includes(q)) return false;
        }
        return true;
    });
    if(!list.length){
        box.innerHTML = `<div class="empty"><i class="fa-solid fa-futbol"></i><p>لا توجد مباريات</p></div>`;
        return;
    }
    box.innerHTML = list.map(m=>{
        const statusBadge = m.status === 'live'
            ? '<span class="badge live"><i class="fa-solid fa-circle-dot"></i> مباشر</span>'
            : m.status === 'finished'
            ? '<span class="badge exp">انتهت</span>'
            : '<span class="badge info">قادمة</span>';
        const score = m.status === 'finished' && m.score1 !== undefined
            ? `${m.score1} - ${m.score2 || 0}`
            : '—';
        return `
        <div class="dl-row match-row">
            <div class="dl-cell"><span class="k">الفريقان</span><span class="v">${esc(m.team1||'—')} × ${esc(m.team2||'—')}</span></div>
            <div class="dl-cell"><span class="k">النتيجة</span><span class="v">${esc(score)}</span></div>
            <div class="dl-cell"><span class="k">التصنيف</span><span class="badge">${esc(m.category||'عام')}</span></div>
            <div class="dl-cell"><span class="k">الحالة</span>${statusBadge}</div>
            <div class="dl-actions">
                <button class="btn ghost sm" onclick="editMatch(${jsArg(m.id)})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn red sm" onclick="delMatch(${jsArg(m.id)},${jsArg(m.team1||'')},${jsArg(m.team2||'')})"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');
}
$('#qMatch')?.addEventListener('input',debounce(renderMatchesList,220));
$('#filterMatchStatus')?.addEventListener('change',renderMatchesList);
$('#btnNewMatch')?.addEventListener('click',()=>openMatchModal());

function openMatchModal(m = null){
    $('#matchForm').reset();
    $('#matchId').value = '';
    $('#matchTitle').textContent = m ? 'تعديل مباراة' : 'مباراة جديدة';
    if(m){
        $('#matchId').value = m.id;
        $('#matchCategory').value = m.category || (allMatchCats[0]?.name||'');
        $('#matchStatus').value = m.status || 'upcoming';
        $('#matchDate').value = m.date || '';
        $('#matchTime').value = m.time || '';
        $('#matchTeam1').value = m.team1 || '';
        $('#matchTeam1Logo').value = m.team1Logo || '';
        $('#matchTeam2').value = m.team2 || '';
        $('#matchTeam2Logo').value = m.team2Logo || '';
        $('#matchScore1').value = m.score1 ?? '';
        $('#matchScore2').value = m.score2 ?? '';
        $('#matchChannel').value = m.channel || '';
        $('#matchUrl').value = m.url || m.streamUrl || '';
        $('#matchIsVip').value = m.isVip ? 'true' : 'false';
    }else{
        if(allMatchCats[0]) $('#matchCategory').value = allMatchCats[0].name;
        const today = new Date().toISOString().slice(0,10);
        $('#matchDate').value = today;
    }
    openModal('mMatch');
}
async function editMatch(id){
    const snap = await db.ref('matches/'+id).once('value');
    if(!snap.exists()) return toast('غير موجود','','err');
    openMatchModal({id, ...snap.val()});
}
window.editMatch = editMatch;

$('#matchForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const id = $('#matchId').value;
    const s1 = $('#matchScore1').value;
    const s2 = $('#matchScore2').value;
    const data = {
        category: $('#matchCategory').value,
        status: $('#matchStatus').value,
        date: $('#matchDate').value,
        time: $('#matchTime').value,
        team1: $('#matchTeam1').value.trim(),
        team1Logo: $('#matchTeam1Logo').value.trim(),
        team2: $('#matchTeam2').value.trim(),
        team2Logo: $('#matchTeam2Logo').value.trim(),
        score1: s1 === '' ? null : parseInt(s1),
        score2: s2 === '' ? null : parseInt(s2),
        channel: $('#matchChannel').value.trim(),
        url: $('#matchUrl').value.trim(),
        streamUrl: $('#matchUrl').value.trim(),
        isVip: $('#matchIsVip').value === 'true',
        updatedAt: Date.now()
    };
    const scores=[s1,s2].filter(v=>v!=='').map(Number);
    if(!data.team1||data.team1.length>120||!data.team2||data.team2.length>120||data.category.length>120||!['live','upcoming','finished'].includes(data.status)||!/^\d{4}-\d{2}-\d{2}$/.test(data.date)||!/^\d{2}:\d{2}$/.test(data.time)||scores.some(v=>!Number.isInteger(v)||v<0||v>999)||[data.team1Logo,data.team2Logo,data.url].some(url=>url&&!safeHttpUrl(url))||data.channel.length>120){toast('تحقق من بيانات المباراة','أدخل الفريقين وتاريخ/وقت صحيحين وروابط http/https ونتيجة رقمية صالحة.','err');return;}
    try{
        const recordId=id||db.ref('matches').push().key;
        const old=id?((await db.ref('matches/'+id).once('value')).val()||{}):{};
        const full={...old,...data,...(!id?{views:0,createdAt:Date.now()}:{})};
        await db.ref().update({['matches/'+recordId]:data,['publicCatalog/matches/'+recordId]:publicMatchProjection(full)});
        closeModal('mMatch');
        logActivity(`${id?'تعديل':'إضافة'} مباراة: ${data.team1} × ${data.team2}`);
        toast('تم الحفظ', `${data.team1} × ${data.team2}`,'ok');
    }catch(err){ toast('خطأ',err.message,'err'); }
});
async function delMatch(id,t1,t2){
    const ok = await askConfirm({title:'حذف مباراة',msg:`حذف "${t1} × ${t2}"؟`,okText:'حذف'});
    if(!ok) return;
    await db.ref().update({['matches/'+id]:null,['publicCatalog/matches/'+id]:null});
    logActivity(`حذف مباراة: ${t1} × ${t2}`);
    toast('تم الحذف','','ok');
}
window.delMatch = delMatch;

$('#matchTestBtn')?.addEventListener('click', (e) => {
    const url = $('#matchUrl').value.trim();
    if(!url){ toast('أدخل الرابط','','warn'); return; }
    window.testServerUrl(url, e.currentTarget);
});

/* ============================================================
   SECTIONS
   ============================================================ */
let allSections = [];

function loadSections(){
    db.ref('sections').on('value', snap=>{
        allSections = [];
        if(snap.exists()) snap.forEach(c=>allSections.push({id:c.key,...c.val()}));
        allSections.sort((a,b)=>(a.order||0) - (b.order||0));
        renderSectionsList();
    });
}

function renderSectionsList(){
    const box = $('#sectionsList');
    if(!box) return;
    if(!allSections.length){
        box.innerHTML = `<div class="empty"><i class="fa-solid fa-layer-group"></i><p>لا توجد أقسام مخصصة</p></div>`;
        return;
    }
    box.innerHTML = allSections.map(s=>`
        <div class="dl-row simple" style="align-items:center">
            <div class="dl-cell">
                <i class="fa-solid ${esc(s.icon||'fa-film')}" style="color:var(--accent)"></i>
                <span class="v">${esc(s.title||'قسم')}</span>
            </div>
            <div class="dl-cell"><span class="badge ${s.active!==false?'ok':'exp'}">${s.active!==false?'مفعّل':'معطّل'}</span></div>
            <div class="dl-cell"><span class="badge">${esc(s.filter||'all')}</span></div>
            <div class="dl-actions">
                <button class="btn ghost sm" onclick="editSection(${jsArg(s.id)})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn gold sm" onclick="toggleSectionActive(${jsArg(s.id)},${s.active !== false})"><i class="fa-solid fa-power-off"></i></button>
                <button class="btn red sm" onclick="delSection(${jsArg(s.id)},${jsArg(s.title||'')})"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`).join('');
}

$('#addSectionForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const catsSel = $('#sectionCategories');
    const selectedCats = catsSel ? [...catsSel.selectedOptions].map(o => o.value) : [];
    const data = {
        title: $('#sectionTitle').value.trim(),
        icon: $('#sectionIcon').value.trim() || 'fa-film',
        filter: $('#sectionFilter').value,
        sort: $('#sectionSort').value,
        limit: parseInt($('#sectionLimit').value) || 20,
        style: $('#sectionStyle').value,
        categories: selectedCats,
        order: allSections.length,
        active: true,
        createdAt: Date.now()
    };
    if(!data.title||data.title.length>120||!/^fa-[a-z0-9-]{1,60}$/.test(data.icon)||!['all','vip','free'].includes(data.filter)||!['newest','views','rating','random'].includes(data.sort)||!['poster','landscape'].includes(data.style)||!Number.isInteger(data.limit)||data.limit<1||data.limit>50||data.categories.length>50||Math.abs(data.order)>100000){toast('تحقق من بيانات القسم','راجع العنوان والرمز والخيارات والحد الأقصى (1–50).','err');return;}
    try{
        await db.ref('sections').push(data);
        $('#addSectionForm').reset();
        $('#sectionIcon').value = 'fa-film';
        $('#sectionLimit').value = 20;
        logActivity(`إضافة قسم: ${data.title}`);
        toast('تم الإضافة', data.title, 'ok');
    }catch(err){ toast('خطأ',err.message,'err'); }
});

async function editSection(id){
    const s = allSections.find(x => x.id === id);
    if(!s) return;
    $('#sectionId').value = s.id;
    $('#secEditTitle').value = s.title || '';
    $('#secEditIcon').value = s.icon || 'fa-film';
    $('#secEditFilter').value = s.filter || 'all';
    $('#secEditSort').value = s.sort || 'newest';
    $('#secEditLimit').value = s.limit || 20;
    $('#secEditStyle').value = s.style || 'poster';
    $('#secEditOrder').value = s.order || 0;
    $('#secEditActive').value = s.active !== false ? 'true' : 'false';
    openModal('mSection');
}
window.editSection = editSection;

$('#sectionForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const id = $('#sectionId').value;
    const data={title:$('#secEditTitle').value.trim(),icon:$('#secEditIcon').value.trim()||'fa-film',filter:$('#secEditFilter').value,sort:$('#secEditSort').value,limit:parseInt($('#secEditLimit').value,10)||20,style:$('#secEditStyle').value,order:parseInt($('#secEditOrder').value,10)||0,active:$('#secEditActive').value==='true'};
    if(!data.title||data.title.length>120||!/^fa-[a-z0-9-]{1,60}$/.test(data.icon)||!['all','vip','free'].includes(data.filter)||!['newest','views','rating','random'].includes(data.sort)||!['poster','landscape'].includes(data.style)||data.limit<1||data.limit>50||Math.abs(data.order)>100000){toast('تحقق من بيانات القسم','راجع العنوان والرمز والخيارات والحد الأقصى (1–50).','err');return;}
    try{
        await db.ref('sections/'+id).update(data);
        closeModal('mSection');
        logActivity('تعديل قسم');
        toast('تم الحفظ','','ok');
    }catch(err){ toast('خطأ',err.message,'err'); }
});

async function toggleSectionActive(id, wasActive){
    await db.ref('sections/'+id).update({active: !wasActive});
    toast(wasActive ? 'تم التعطيل' : 'تم التفعيل','','ok');
}
window.toggleSectionActive = toggleSectionActive;

async function delSection(id,title){
    const ok = await askConfirm({title:'حذف قسم',msg:`حذف "${title}"؟`,okText:'حذف'});
    if(!ok) return;
    await db.ref('sections/'+id).remove();
    logActivity(`حذف قسم: ${title}`);
    toast('تم الحذف',title,'ok');
}
window.delSection = delSection;

/* ============================================================
   VIP REQUESTS
   ============================================================ */
let allVr = [];
let currentVrId = null;

function loadVipRequests(){
    db.ref('vipRequests').on('value', snap=>{
        allVr = [];
        if(snap.exists())snap.forEach(userNode=>userNode.forEach(c=>allVr.push({id:c.key,...c.val(),uid:c.val()?.uid||userNode.key})));
        allVr.sort((a,b)=>(b.createdAt||0) - (a.createdAt||0));
        window.__allVipRequests = allVr;

        const pending = allVr.filter(r=>r.status === 'pending').length;
        const approved = allVr.filter(r=>r.status === 'approved').length;
        const rejected = allVr.filter(r=>r.status === 'rejected').length;
        $('#vrStatPending').textContent = pending.toLocaleString('ar-EG');
        $('#vrStatApproved').textContent = approved.toLocaleString('ar-EG');
        $('#vrStatRejected').textContent = rejected.toLocaleString('ar-EG');

        const navBadge = $('#navVipCount');
        const fabBadge = $('#fabVipBadge');
        const bnDot = $('#bnVipDot');
        $('#statPendingRequests').textContent = pending.toLocaleString('ar-EG');
        if(pending > 0){
            if(navBadge){ navBadge.style.display = ''; navBadge.textContent = pending; }
            if(fabBadge){ fabBadge.style.display = ''; fabBadge.textContent = pending; }
            if(bnDot) bnDot.style.display = '';
        }else{
            if(navBadge) navBadge.style.display = 'none';
            if(fabBadge) fabBadge.style.display = 'none';
            if(bnDot) bnDot.style.display = 'none';
        }

        const notifBtn = $('#btnNotifications');
        if(notifBtn){
            if(pending > 0){
                notifBtn.classList.add('warn-active');
                notifBtn.dataset.count = pending;
            }else{
                notifBtn.classList.remove('warn-active');
                notifBtn.removeAttribute('data-count');
            }
        }

        renderVipRequests();
    });
}

function renderVipRequests(){
    const q = ($('#vrSearch')?.value||'').toLowerCase().trim();
    const f = $('#vrFilter')?.value || 'pending';
    const box = $('#vipRequestsList');
    if(!box) return;
    let list = allVr.filter(r=>{
        if(f !== 'all' && r.status !== f) return false;
        if(q){
            const n = (r.name||'').toLowerCase();
            const e = (r.email||'').toLowerCase();
            if(!n.includes(q) && !e.includes(q)) return false;
        }
        return true;
    });
    if(!list.length){
        box.innerHTML = `<div class="empty"><i class="fa-solid fa-crown"></i><p>لا توجد طلبات</p></div>`;
        return;
    }
    box.innerHTML = list.map(r=>{
        const status = r.status || 'pending';
        const canFinishGrant=status==='approved'&&r.entitlementStatus==='pending';
        const statusBadge = canFinishGrant
            ? `<span class="badge warn"><i class="fa-solid fa-hourglass-half"></i> موافق عليه؛ التفعيل معلّق</span>`
            : status === 'pending'
            ? `<span class="badge warn"><i class="fa-solid fa-hourglass-half"></i> معلق</span>`
            : status === 'approved'
            ? `<span class="badge ok"><i class="fa-solid fa-circle-check"></i> مقبول</span>`
            : `<span class="badge block"><i class="fa-solid fa-circle-xmark"></i> مرفوض</span>`;
        const initial = (r.name || r.email || '?').trim().charAt(0).toUpperCase();
        return `
        <div class="vr-row ${status}">
            <div class="vr-head">
                <div class="vr-avatar">${esc(initial)}</div>
                <div class="vr-info">
                    <div class="vr-name">${esc(r.name || 'بدون اسم')}</div>
                    <div class="vr-email">${esc(r.email || '—')}</div>
                </div>
                ${statusBadge}
            </div>
            <div class="vr-meta">
                <span><i class="fa-regular fa-clock"></i> ${timeAgo(r.createdAt)}</span>
                ${r.approvedAt ? `<span><i class="fa-solid fa-check"></i> ${timeAgo(r.approvedAt)}</span>` : ''}
            </div>
            <div class="vr-actions">
                <button class="btn ghost sm" onclick="openVrDetails(${jsArg(r.id)})"><i class="fa-solid fa-eye"></i> تفاصيل</button>
                ${status === 'pending'||canFinishGrant ? `
                    <button class="btn green sm" onclick="approveVipRequest(${jsArg(r.id)})"><i class="fa-solid fa-check"></i> ${canFinishGrant?'إكمال التفعيل':'قبول'}</button>
                    ${status==='pending'?`<button class="btn red sm" onclick="rejectVipRequest(${jsArg(r.id)})"><i class="fa-solid fa-xmark"></i> رفض</button>`:''}
                ` : ''}
                <button class="btn wa sm" onclick="openVrWhatsApp(${jsArg(r.id)})"><i class="fa-brands fa-whatsapp"></i></button>
            </div>
        </div>`;
    }).join('');
}
$('#vrFilter')?.addEventListener('change', renderVipRequests);
$('#vrSearch')?.addEventListener('input', debounce(renderVipRequests, 220));

function openVrDetails(id){
    const r = allVr.find(x => x.id === id);
    if(!r) return;
    currentVrId = id;
    $('#vrDetailsSub').textContent = `${r.name || ''} • ${r.email || ''}`;
    const status = r.status || 'pending';
    const statusText = status === 'pending' ? 'معلق' : status === 'approved' ? 'مقبول' : 'مرفوض';
    const statusColor = status === 'pending' ? 'var(--warning)' : status === 'approved' ? 'var(--success)' : 'var(--danger)';
    $('#vrDetailsBody').innerHTML = `
        <div style="display:grid;gap:10px;font-size:.85rem">
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text-3)">الاسم</span><strong>${esc(r.name||'—')}</strong></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text-3)">البريد</span><strong>${esc(r.email||'—')}</strong></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text-3)">الحالة</span><strong style="color:${statusColor}">${statusText}</strong></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text-3)">التاريخ</span><strong>${fmtTime(r.createdAt)}</strong></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text-3)">طريقة الدفع</span><strong>${esc(r.paymentMethod||'—')}</strong></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text-3)">المحفظة/المزود</span><strong>${esc(r.paymentProvider||'—')}</strong></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text-3)">رقم العملية</span><strong>${esc(r.paymentReference||'—')}</strong></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text-3)">هاتف/بريد المرسل</span><strong>${esc(r.paymentSender||'—')}</strong></div>
            <div style="padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--text-3);display:block;margin-bottom:4px">ملاحظة</span><span>${esc(r.paymentNote||'—')}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0"><span style="color:var(--text-3)">UID</span><code style="font-size:.7rem;color:var(--info)">${esc(r.uid||'—')}</code></div>
        </div>`;
    const canFinishGrant=status==='approved'&&r.entitlementStatus==='pending';
    $('#vrApproveBtn').style.display = status === 'pending'||canFinishGrant ? '' : 'none';
    $('#vrApproveBtn').innerHTML=`<i class="fa-solid fa-check"></i> ${canFinishGrant?'إكمال التفعيل':'قبول'}`;
    $('#vrRejectBtn').style.display = status === 'pending' ? '' : 'none';
    $('#vrApproveBtn').onclick = () => approveVipRequest(id);
    $('#vrRejectBtn').onclick = () => rejectVipRequest(id);
    $('#vrWhatsappBtn').onclick = () => openVrWhatsApp(id);
    openModal('mVRDetails');
}
window.openVrDetails = openVrDetails;

async function approveVipRequest(id){
    const r=allVr.find(x=>x.id===id);if(!r)return;
    const requestRef=db.ref('vipRequests/'+r.uid+'/'+id);
    try{
        const freshSnap=await requestRef.once('value');const fresh=freshSnap.val();
        if(!fresh){toast('الطلب غير موجود','','err');return;}
        const retry=fresh.status==='approved'&&fresh.entitlementStatus==='pending';
        if(fresh.status!=='pending'&&!retry){toast('عولج هذا الطلب بالفعل','','warn');return;}
        let days=retry?Number(fresh.durationDays):0;
        if(!retry){const daysStr=prompt('مدة الاشتراك بالأيام (افتراضي 30):','30');if(daysStr===null)return;days=Math.min(3650,Math.max(1,parseInt(daysStr,10)||30));}
        if(!Number.isFinite(days)||days<1||days>3650){toast('مدة الاشتراك غير صالحة','','err');return;}
        const ok=await askConfirm({title:retry?'إكمال تفعيل VIP':'قبول الطلب',msg:`ترقية ${fresh.name||fresh.email} لمدة ${days} يوم؟`,okText:'قبول',type:'green'});if(!ok)return;
        const now=Date.now();
        if(!retry){
            const claim=await requestRef.transaction(current=>{if(!current||(current.status||'pending')!=='pending')return;return {...current,status:'approved',approvedAt:now,durationDays:days,reviewedAt:now,entitlementStatus:'pending'};},undefined,false);
            if(!claim.committed){toast('عولج الطلب في جلسة أخرى','','warn');return;}
        }
        const uid=fresh.uid||fresh.userId||fresh.authUid;if(!uid)throw new Error('طلب VIP لا يحتوي على UID صالح');
        const userRef=db.ref('users/'+uid);
        const grant=await userRef.transaction(prev=>{
            prev=prev||{};const grants=prev.vipRequestGrants||{};if(grants[id])return;
            const old=Number(userExpire(prev))||0;const expiry=Math.max(Date.now(),old)+days*86400000;
            return {...prev,isVip:true,expireAt:expiry,vipExpireDate:expiry,updatedAt:Date.now(),subscriptionStatus:'active',vipRequestGrants:{...grants,[id]:true}};
        },undefined,false);
        let newlyGranted=grant.committed;
        if(!newlyGranted){const check=await userRef.once('value');if(!(check.val()?.vipRequestGrants||{})[id])throw new Error('تعذر تثبيت الاشتراك؛ أعد المحاولة');}
        await requestRef.update({entitlementStatus:'granted',grantedAt:Date.now()});
        if(newlyGranted)await db.ref('notifications/'+uid).push({type:'vip',title:'تم تفعيل VIP',text:`تم قبول طلبك وتفعيل الاشتراك لمدة ${days} يوم.`,createdAt:Date.now(),read:false});
        closeModal('mVRDetails');logActivity(`قبول طلب VIP: ${fresh.name||fresh.email}`);toast('تم القبول',`${days} يوم`,'ok');
    }catch(err){toast('خطأ',err.message,'err');}
}
window.approveVipRequest = approveVipRequest;

async function rejectVipRequest(id){
    const r=allVr.find(x=>x.id===id);if(!r)return;
    try{const current=(await db.ref('vipRequests/'+r.uid+'/'+id).once('value')).val();if(!current||(current.status||'pending')!=='pending'){toast('عولج هذا الطلب بالفعل','','warn');return;}}catch(e){toast('تعذر التحقق من الطلب',e.message,'err');return;}
    const reason = prompt('سبب الرفض (اختياري):', '');
    if(reason === null) return;
    const ok = await askConfirm({title:'رفض الطلب',msg:`رفض طلب ${r.name || r.email}؟`,okText:'رفض',type:'red'});
    if(!ok) return;
    try{
        const now=Date.now();
        const rejected=await db.ref('vipRequests/'+r.uid+'/'+id).transaction(current=>{if(!current||(current.status||'pending')!=='pending')return;return {...current,status:'rejected',rejectedAt:now,reviewedAt:now,rejectReason:reason||'لم يتم تحديد سبب'};},undefined,false);
        if(!rejected.committed){toast('عولج الطلب في جلسة أخرى','','warn');return;}
        const requestUid=r.uid||r.userId||r.authUid;
        if(requestUid) await db.ref('notifications/' + requestUid).push({type:'vip',title:'تحديث طلب VIP',text:`تم رفض طلبك. ${reason||'يمكنك التواصل مع الإدارة لمزيد من التفاصيل.'}`,createdAt:now,read:false});
        closeModal('mVRDetails');
        logActivity(`رفض طلب VIP: ${r.name || r.email}`);
        toast('تم الرفض','','ok');
    }catch(err){ toast('خطأ',err.message,'err'); }
}
window.rejectVipRequest = rejectVipRequest;

function openVrWhatsApp(id){
    const r = allVr.find(x => x.id === id);
    if(!r) return;
    const link = (window.__siteSettings?.whatsappLink || '').trim();
    const num = (window.__siteSettings?.whatsappNumber || '').replace(/\D/g,'');
    let base = '';
    if(link && /^https?:\/\//i.test(link)) base = link;
    else if(num) base = `https://wa.me/${num}`;
    else if(link) base = `https://wa.me/${link.replace(/\D/g,'')}`;
    if(!base){ toast('لم يتم إضافة رقم واتساب','أضفه من الإعدادات','warn'); return; }
    const msg = `السلام عليكم، بخصوص طلب الاشتراك VIP\nالاسم: ${r.name || '—'}\nالبريد: ${r.email || '—'}`;
    const url = base.includes('?') ? `${base}&text=${encodeURIComponent(msg)}` : `${base}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener');
}
window.openVrWhatsApp = openVrWhatsApp;

/* ============================================================
   COMMENTS
   ============================================================ */
let allComments = []; // {id, videoId, videoTitle, ...}

function loadComments(){
    db.ref('comments').on('value', snap=>{
        allComments = [];
        if(snap.exists()){
            snap.forEach(vSnap=>{
                const videoId = vSnap.key;
                const vid = allItems.find(v => v.id === videoId);
                vSnap.forEach(c=>{
                    allComments.push({
                        id: c.key,
                        videoId,
                        videoTitle: vid ? (vid.title||'—') : 'محذوف',
                        ...c.val()
                    });
                });
            });
        }
        allComments.sort((a,b)=>(b.ts||0) - (a.ts||0));
        const stat = $('#statTotalComments');
        if(stat) stat.textContent = allComments.length.toLocaleString('ar-EG');
        renderCommentsList();
    });
}

function renderCommentsList(){
    const box = $('#commentsList');
    if(!box) return;
    const q = ($('#qComment').value||'').toLowerCase().trim();
    const f = $('#filterCommentVip').value;
    let list = allComments.filter(c=>{
        if(f === 'vip' && !c.isVip) return false;
        if(q){
            const n = (c.name||'').toLowerCase();
            const t = (c.text||'').toLowerCase();
            const vt = (c.videoTitle||'').toLowerCase();
            if(!n.includes(q) && !t.includes(q) && !vt.includes(q)) return false;
        }
        return true;
    });
    if(!list.length){
        box.innerHTML = `<div class="empty"><i class="fa-solid fa-comments"></i><p>لا توجد تعليقات</p></div>`;
        return;
    }
    box.innerHTML = list.slice(0,100).map(c=>`
        <div class="dl-row simple" style="align-items:flex-start">
            <div class="dl-cell" style="flex-direction:column;align-items:flex-start;gap:4px">
                <div style="display:flex;gap:6px;align-items:center">
                    <strong>${esc(c.name||'مستخدم')}</strong>
                    ${c.isVip ? '<span class="badge vip">VIP</span>' : ''}
                    <span style="font-size:.7rem;color:var(--text-3)">${timeAgo(c.ts)}</span>
                </div>
                <p style="color:var(--text-2);font-size:.82rem;line-height:1.5">${esc(c.text)}</p>
                <span style="font-size:.7rem;color:var(--text-3)"><i class="fa-solid fa-film"></i> ${esc(c.videoTitle)}</span>
            </div>
            <div class="dl-actions">
                <button class="btn red sm" onclick="delComment(${jsArg(c.videoId)},${jsArg(c.id)})"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`).join('');
}
$('#qComment')?.addEventListener('input',debounce(renderCommentsList,220));
$('#filterCommentVip')?.addEventListener('change',renderCommentsList);

async function delComment(videoId, commentId){
    const ok = await askConfirm({title:'حذف تعليق',msg:'حذف هذا التعليق؟',okText:'حذف'});
    if(!ok) return;
    await db.ref(`comments/${videoId}/${commentId}`).remove();
    logActivity('حذف تعليق');
    toast('تم الحذف','','ok');
}
window.delComment = delComment;

/* ============================================================
   RATINGS
   ============================================================ */
let allRatings = [];

function loadRatings(){
    db.ref('ratings').on('value', snap=>{
        allRatings = [];
        if(snap.exists()){
            snap.forEach(vSnap=>{
                const videoId = vSnap.key;
                const vid = allItems.find(v => v.id === videoId);
                vSnap.forEach(r=>{
                    allRatings.push({
                        id: r.key,
                        videoId,
                        videoTitle: vid ? (vid.title||'—') : 'محذوف',
                        ...r.val()
                    });
                });
            });
        }
        renderRatingsList();
    });
}

function renderRatingsList(){
    const box = $('#ratingsList');
    if(!box) return;
    const f = $('#filterRatingStars').value;
    let list = allRatings.filter(r=>{
        if(f !== 'all' && Number(r.value) !== Number(f)) return false;
        return true;
    });
    if(!list.length){
        box.innerHTML = `<div class="empty"><i class="fa-solid fa-star"></i><p>لا توجد تقييمات</p></div>`;
        return;
    }
    box.innerHTML = list.slice(0,100).map(r=>{
        const stars = '★'.repeat(Number(r.value)||0) + '☆'.repeat(5 - (Number(r.value)||0));
        return `
        <div class="dl-row simple" style="align-items:center">
            <div class="dl-cell" style="flex-direction:column;align-items:flex-start;gap:3px">
                <span style="color:var(--vip);font-size:1rem;letter-spacing:2px">${stars}</span>
                <span style="font-size:.78rem;color:var(--text-2)">${esc(r.videoTitle)}</span>
                <span style="font-size:.68rem;color:var(--text-3)">${timeAgo(r.ts)} • ${esc(r.id)}</span>
            </div>
        </div>`;
    }).join('');
}
$('#filterRatingStars')?.addEventListener('change',renderRatingsList);

/* ============================================================
   ADS
   ============================================================ */
function publicAdsProjection(ads){
    const result={};
    ['topBanner','midBanner','bottomBanner','downloadAd','videoAd','videoAdDelay','videoAdInterval','videoAdDuration'].forEach(key=>{if(ads?.[key]!==undefined)result[key]=ads[key];});
    return result;
}
function loadAds(){
    db.ref('ads').on('value', snap=>{
        const ads = snap.val() || {};
        if($('#adTopHtml')) $('#adTopHtml').value = ads.topBanner || '';
        if($('#adMidHtml')) $('#adMidHtml').value = ads.midBanner || '';
        if($('#adBottomHtml')) $('#adBottomHtml').value = ads.bottomBanner || '';
        if($('#adDownloadHtml')) $('#adDownloadHtml').value = ads.downloadAd || '';
        if($('#adVideoHtml')) $('#adVideoHtml').value = ads.videoAd || '';
        if($('#adVideoDelay')) $('#adVideoDelay').value = ads.videoAdDelay ?? 120;
        if($('#adVideoInterval')) $('#adVideoInterval').value = ads.videoAdInterval ?? 300;
        if($('#adVideoDuration')) $('#adVideoDuration').value = ads.videoAdDuration ?? 10;
    });
    db.ref('settings/popupBanner').on('value', snap=>{
        if($('#adPopupHtml')) $('#adPopupHtml').value = snap.val() || '';
    });
    db.ref('settings/popupEnabled').on('value', snap=>{
        if($('#adPopupEnabled')) $('#adPopupEnabled').checked = snap.val() === true;
    });
    db.ref('adsCatalog').on('value', snap=>{
        const list=[]; if(snap.exists()) snap.forEach(c=>list.push({id:c.key,...c.val()}));
        window.__adsCatalog=list;
        const box=$('#adsCatalogList');
        if($('#adStatActive')) $('#adStatActive').textContent=list.filter(a=>a.active!==false).length.toLocaleString('ar-EG');
        if(box) box.innerHTML=list.length?list.map(ad=>`<div class="dl-row"><div class="dl-cell"><span class="k">الإعلان</span><span class="v">${esc(ad.name||'إعلان')}</span></div><div class="dl-cell"><span class="k">المكان</span><span class="v">${esc(ad.placement||'—')}</span></div><div class="dl-cell"><span class="k">النوع</span><span class="v">${ad.type==='link'?'رابط':'Script'}</span></div><div class="dl-cell"><span class="k">الحالة</span><span class="badge ${ad.active===false?'block':'ok'}">${ad.active===false?'متوقف':'نشط'}</span></div><div class="dl-actions"><button class="btn ${ad.active===false?'green':'gold'} sm" onclick="toggleAd(${jsArg(ad.id)},${ad.active===false})"><i class="fa-solid ${ad.active===false?'fa-play':'fa-pause'}"></i></button><button class="btn red sm" onclick="deleteAd(${jsArg(ad.id)})"><i class="fa-solid fa-trash"></i></button></div></div>`).join(''):'<div class="empty"><i class="fa-solid fa-rectangle-ad"></i><p>لا توجد إعلانات مضافة</p></div>';
    });
    db.ref('adStats').on('value', snap=>{
        let impressions=0,clicks=0,revenue=0; if(snap.exists()) snap.forEach(c=>{const x=c.val()||{};impressions+=Number(x.impressions)||0;clicks+=Number(x.clicks)||0;revenue+=Number(x.revenue)||0;});
        if($('#adStatImpressions')) $('#adStatImpressions').textContent=impressions.toLocaleString('ar-EG');
        if($('#adStatClicks')) $('#adStatClicks').textContent=clicks.toLocaleString('ar-EG');
        if($('#adStatRevenue')) $('#adStatRevenue').textContent='$'+revenue.toFixed(2);
    });
}

$('#adCreateForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const payload={name:$('#newAdName').value.trim(),placement:$('#newAdPlacement').value,type:$('#newAdType').value,content:$('#newAdContent').value.trim(),ecpm:Number($('#newAdEcpm').value)||0,active:$('#newAdActive').checked,createdAt:Date.now()};
    await db.ref('adsCatalog').push(payload); logActivity('إضافة إعلان: '+payload.name); e.target.reset(); $('#newAdActive').checked=true; toast('تمت إضافة الإعلان','','ok');
});
window.toggleAd=async(id,active)=>{await db.ref('adsCatalog/'+id+'/active').set(active);toast(active?'تم تفعيل الإعلان':'تم إيقاف الإعلان','','ok')};
window.deleteAd=async id=>{if(await askConfirm({title:'حذف إعلان',msg:'سيتم حذف الإعلان وإعداداته نهائياً',ok:'حذف'})){await db.ref('adsCatalog/'+id).remove();toast('تم حذف الإعلان','','ok')}};

$('#btnSaveAdTop')?.addEventListener('click',async()=>{
    const value=$('#adTopHtml').value;
    await db.ref().update({'ads/topBanner':value,'publicAds/topBanner':value});
    logActivity('حفظ إعلان علوي');
    toast('تم الحفظ','','ok');
});
$('#btnSaveAdMid')?.addEventListener('click',async()=>{
    const value=$('#adMidHtml').value;
    await db.ref().update({'ads/midBanner':value,'publicAds/midBanner':value});
    logActivity('حفظ إعلان وسطي');
    toast('تم الحفظ','','ok');
});
$('#btnSaveAdBottom')?.addEventListener('click',async()=>{
    const value=$('#adBottomHtml').value;
    await db.ref().update({'ads/bottomBanner':value,'publicAds/bottomBanner':value});
    logActivity('حفظ إعلان سفلي');
    toast('تم الحفظ','','ok');
});
$('#btnSaveAdDownload')?.addEventListener('click',async()=>{
    const value=$('#adDownloadHtml').value;
    await db.ref().update({'ads/downloadAd':value,'publicAds/downloadAd':value});
    logActivity('حفظ إعلان التحميل');
    toast('تم الحفظ','','ok');
});
$('#btnSaveAdVideo')?.addEventListener('click',async()=>{
    const patch={
        videoAd:$('#adVideoHtml').value,
        videoAdDelay:Math.max(0,parseInt($('#adVideoDelay').value)||120),
        videoAdInterval:Math.max(30,parseInt($('#adVideoInterval').value)||300),
        videoAdDuration:Math.max(5,parseInt($('#adVideoDuration').value)||10)
    };
    const updates={};Object.entries(patch).forEach(([key,value])=>{updates['ads/'+key]=value;updates['publicAds/'+key]=value;});
    await db.ref().update(updates);
    logActivity('حفظ إعلان الفيديو المجاني');
    toast('تم حفظ إعلان الفيديو','','ok');
});
$('#btnSaveAdPopup')?.addEventListener('click',async()=>{
    const banner=$('#adPopupHtml').value,enabled=$('#adPopupEnabled').checked;
    await db.ref().update({'settings/popupBanner':banner,'settings/popupEnabled':enabled,'publicSettings/popupBanner':banner,'publicSettings/popupEnabled':enabled});
    logActivity('حفظ الإعلان المنبثق');
    toast('تم الحفظ','','ok');
});

/* ============================================================
   NOTIFICATIONS (Send to users)
   ============================================================ */
async function loadNotifHistory(){
    const box = $('#notifHistoryList');
    if(!box) return;
    const snap = await db.ref('adminNotifications').limitToLast(30).once('value');
    const list = [];
    if(snap.exists()) snap.forEach(c=>list.push({id:c.key, ...c.val()}));
    list.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    if(!list.length){
        box.innerHTML = `<div class="empty"><i class="fa-solid fa-paper-plane"></i><p>لم يتم إرسال إشعارات</p></div>`;
        return;
    }
    box.innerHTML = list.map(n=>`
        <div class="dl-row simple" style="align-items:center">
            <div class="dl-cell"><i class="fa-solid fa-bell" style="color:var(--accent)"></i><span class="v">${esc(n.title||'')}</span></div>
            <div class="dl-cell"><span class="v" style="font-size:.72rem;color:var(--text-3)">${n.target === 'all' ? '📢 الجميع' : (n.targetName||'مستخدم')}</span></div>
            <div class="dl-cell"><span class="v" style="font-size:.68rem;color:var(--text-3)">${timeAgo(n.createdAt)}</span></div>
        </div>`).join('');
}

$('#btnSendNotif')?.addEventListener('click', async ()=>{
    const target = $('#notifTargetUser').value;
    const type = $('#notifType').value;
    const title = $('#notifTitle').value.trim();
    const text = $('#notifText').value.trim();
    if(!title || !text){ toast('أكمل الحقول','','warn'); return; }

    const targetUser = target === 'all' ? null : allUsers.find(u => u.id === target);
    const btn = $('#btnSendNotif');
    btn.disabled = true;
    const oldHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...';

    try{
        const notifData = {
            title, text, type,
            target,
            targetName: targetUser ? (targetUser.name || targetUser.email) : 'الجميع',
            read: false,
            createdAt: Date.now()
        };

        if(target === 'all'){
            // Save to adminNotifications + to each user's notifications
            const adminRef = db.ref('adminNotifications').push();
            await adminRef.set(notifData);

            if(allUsers.length > 0){
                const updates = {};
                const now = Date.now();
                allUsers.forEach(u=>{
                    const key = db.ref('notifications/'+u.id).push().key;
                    updates[`notifications/${u.id}/${key}`] = {...notifData, createdAt: now};
                });
                const entries = Object.entries(updates);
                for(let i = 0; i < entries.length; i += 300){
                    const chunk = {};
                    entries.slice(i, i + 300).forEach(([k,v]) => chunk[k] = v);
                    await db.ref().update(chunk);
                }
                toast('تم البث', `${allUsers.length} مستخدم`,'ok');
            }else{
                toast('تم الحفظ','لا يوجد مستخدمون','warn');
            }
        }else{
            const adminRef = db.ref('adminNotifications').push();
            await adminRef.set(notifData);
            await db.ref('notifications/' + target).push(notifData);
            toast('تم الإرسال', targetUser.name || targetUser.email, 'ok');
        }

        $('#notifTitle').value = '';
        $('#notifText').value = '';
        logActivity(`إرسال إشعار: ${title}`);
        loadNotifHistory();
    }catch(err){
        toast('خطأ', err.message, 'err');
    }finally{
        btn.disabled = false;
        btn.innerHTML = oldHTML;
    }
});

/* ============================================================
   M3U IMPORT
   ============================================================ */
let parsedM3U = [];
let m3uCurrentTab = 'all';
let m3uTesting = false;
let m3uStopFlag = false;
let m3uPlayerHls = null;

$('#m3uFile')?.addEventListener('change', e=>{
    const f = e.target.files[0];
    if(!f) return;
    if(f.size>5*1024*1024){toast('الملف أكبر من الحد','الحد الأقصى 5 ميغابايت','err');e.target.value='';return;}
    const r = new FileReader();
    r.onload = ev => {
        $('#m3uText').value = ev.target.result;
        parseM3U();
        toast('تم التحميل', `${parsedM3U.length} قناة`,'ok');
    };
    r.readAsText(f);
});
$('#m3uParseBtn')?.addEventListener('click', () => {
    parseM3U();
    if(parsedM3U.length) toast('تم التحليل', `${parsedM3U.length} قناة`,'ok');
});
$('#m3uText')?.addEventListener('input', debounce(() => {
    if(($('#m3uText').value || '').length > 30) parseM3U();
}, 600));

document.addEventListener('click', e => {
    const tab = e.target.closest('.m3u-tab');
    if(!tab) return;
    m3uCurrentTab = tab.dataset.m3uTab;
    $$('.m3u-tab').forEach(t => t.classList.toggle('active', t.dataset.m3uTab === m3uCurrentTab));
    renderM3UPreview();
});

function parseM3U(){
    let text=$('#m3uText').value||'';
    if(new Blob([text]).size>5*1024*1024){parsedM3U=[];$('#m3uText').value='';toast('ملف M3U كبير جداً','الحد الأقصى 5 ميغابايت','err');return;}
    text=text.replace(/\r/g,'\n').trim();
    if(!text){
        parsedM3U = [];
        $('#m3uPreview').style.display = 'none';
        $('#m3uTabs').style.display = 'none';
        $('#m3uProgressWrap').style.display = 'none';
        return;
    }
    let entries = [];
    if(text.includes('#EXTINF')){
        const normalized = text.replace(/#EXTINF/g, '\n#EXTINF').trim();
        entries = normalized.split(/\n+/).map(s => s.trim()).filter(Boolean);
    } else {
        entries = text.split(/\n+/).map(s => s.trim()).filter(Boolean);
    }
    const out = [];
    let current = null;
    for(const raw of entries){
        const line = raw.trim();
        if(!line) continue;
        if(line.startsWith('#EXTM3U')) continue;
        if(line.startsWith('#EXTINF')){
            if(current && current.url) out.push(current);
            const info = line.substring(line.indexOf(':') + 1);
            const commaIdx = info.lastIndexOf(',');
            const attrsPart = commaIdx >= 0 ? info.substring(0, commaIdx) : info;
            const tailAfterComma = commaIdx >= 0 ? info.substring(commaIdx + 1).trim() : '';
            let name = tailAfterComma;
            let embeddedUrl = '';
            const urlMatch = name.match(/(https?:\/\/[^\s]+)/);
            if(urlMatch){
                embeddedUrl = urlMatch[1].trim();
                name = name.replace(embeddedUrl, '').trim();
            }
            const getAttr = (key) => {
                const m = attrsPart.match(new RegExp(key + '\\s*=\\s*"([^"]*)"', 'i'));
                return m ? m[1].trim() : '';
            };
            current = {
                name: name || getAttr('tvg-name') || 'قناة',
                logo: getAttr('tvg-logo'),
                category: getAttr('group-title') || 'عام',
                tvgId: getAttr('tvg-id'),
                url: embeddedUrl || '',
                status: 'untested',
                reason: '',
                tested: false
            };
            continue;
        }
        if(line.startsWith('#')) continue;
        if(current){
            if(!current.url) current.url = line;
            out.push(current);
            current = null;
        } else {
            out.push({name:'قناة', url:line, logo:'', category:'عام', status:'untested', reason:'', tested:false});
        }
    }
    if(current && current.url) out.push(current);

    const oldMap = new Map(parsedM3U.map(c => [c.url, c]));
    if(out.length>2000){parsedM3U=[];toast('قائمة كبيرة جداً','الحد الأقصى 2000 قناة في كل استيراد','err');return;}
    parsedM3U = out
        .filter(c=>{const url=safeHttpUrl(c.url);return !!url&&url.length<=4096&&!!String(c.name||'').trim()&&String(c.name).length<=120&&String(c.category||'').length<=120&&String(c.logo||'').length<=2048&&(!c.logo||!!safeHttpUrl(c.logo))&&String(c.tvgId||'').length<=180;})
        .map(c => {
            const old = oldMap.get(c.url);
            c={...c,url:safeHttpUrl(c.url),logo:c.logo?safeHttpUrl(c.logo):'',name:String(c.name).trim(),category:String(c.category||'عام').trim()||'عام'};
            if(old && old.tested){
                return {...c, status:old.status, reason:old.reason, tested:true};
            }
            return c;
        });

    $('#m3uTabs').style.display = parsedM3U.length ? 'flex' : 'none';
    updateM3UCounter();
    renderM3UPreview();
}

function updateM3UCounter(){
    const all = parsedM3U.length;
    const work = parsedM3U.filter(c => c.status === 'working').length;
    const fail = parsedM3U.filter(c => c.status === 'broken').length;
    const unverified=parsedM3U.filter(c=>c.status==='unverified').length;
    const unt = parsedM3U.filter(c => c.status === 'untested' || c.status === 'testing').length;
    $('#m3uCntAll').textContent = all;
    $('#m3uCntWork').textContent = work;
    $('#m3uCntFail').textContent = fail;
    $('#m3uCntUnverified').textContent=unverified;
    $('#m3uCntUntested').textContent = unt;
    $('#m3uStatWork').textContent = work;
    $('#m3uStatFail').textContent = fail;
    $('#m3uStatUnverified').textContent=unverified;
    $('#m3uStatRemain').textContent = unt;
}

function renderM3UPreview(){
    const preview = $('#m3uPreview');
    if(!preview) return;
    preview.style.display = 'block';
    if(!parsedM3U.length){
        preview.innerHTML = `<div style="text-align:center;color:var(--danger);padding:20px;font-weight:800"><i class="fa-solid fa-circle-exclamation"></i> لا توجد قنوات صالحة</div>`;
        return;
    }
    let list = parsedM3U;
    if(m3uCurrentTab === 'working') list = parsedM3U.filter(c => c.status === 'working');
    if(m3uCurrentTab === 'broken') list = parsedM3U.filter(c => c.status === 'broken');
    if(m3uCurrentTab==='unverified')list=parsedM3U.filter(c=>c.status==='unverified');
    if(m3uCurrentTab === 'untested') list = parsedM3U.filter(c => c.status === 'untested' || c.status === 'testing');
    if(!list.length){
        preview.innerHTML = `<div style="text-align:center;color:var(--text-3);padding:20px"><i class="fa-solid fa-inbox" style="font-size:2rem;opacity:.4;display:block;margin-bottom:8px"></i><p style="font-weight:700">لا توجد قنوات</p></div>`;
        return;
    }
    preview.innerHTML = list.map((c) => {
        const statusInfo = getM3UStatusInfo(c.status);
        const globalIdx = parsedM3U.indexOf(c);
        const isTesting = c.status === 'testing';
        return `
        <div class="m3u-channel-row ${c.status}">
            ${c.logo ? `<img class="m3u-ch-logo" src="${esc(c.logo)}" data-fallback-src="">` : `<div class="m3u-ch-logo" style="display:flex;align-items:center;justify-content:center;color:var(--text-3)"><i class="fa-solid fa-tv"></i></div>`}
            <div class="m3u-ch-info">
                <div class="m3u-ch-name">
                    <span style="overflow:hidden;text-overflow:ellipsis">${esc(c.name)}</span>
                    <span class="m3u-ch-status ${c.status}"><i class="fa-solid ${statusInfo.icon}${isTesting?' fa-spin':''}"></i> ${statusInfo.label}</span>
                </div>
                <div class="m3u-ch-url">${esc(c.url)}</div>
            </div>
            <span class="m3u-ch-cat">${esc(c.category)}</span>
            <div class="m3u-ch-actions">
                <button class="m3u-ch-btn test ${isTesting?'testing':''}" data-m3u-action="test-one" data-idx="${globalIdx}" title="اختبار">
                    <i class="fa-solid fa-${isTesting?'spinner':'flask'}${isTesting?' fa-spin':''}"></i>
                </button>
                <button class="m3u-ch-btn" data-m3u-action="play" data-idx="${globalIdx}" title="معاينة">
                    <i class="fa-solid fa-play"></i>
                </button>
            </div>
        </div>`;
    }).join('');
    preview.querySelectorAll('[data-m3u-action]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.idx);
            if(btn.dataset.m3uAction === 'test-one') testOneChannel(idx);
            if(btn.dataset.m3uAction === 'play') playM3uPreview(idx);
        });
    });
}

function getM3UStatusInfo(status){
    switch(status){
        case 'working': return {icon:'fa-circle-check', label:'يعمل'};
        case 'broken': return {icon:'fa-circle-xmark', label:'معطل'};
        case 'testing': return {icon:'fa-circle-notch', label:'اختبار'};
        case 'unverified': return {icon:'fa-circle-question', label:'تعذر التحقق'};
        default: return {icon:'fa-clock', label:'لم يُختَبَر'};
    }
}

async function testChannel(url){
    const safeUrl=safeHttpUrl(url);
    if(!safeUrl)return {ok:false,verified:true,reason:'invalid_url'};
    if(/youtube\.com|youtu\.be|twitch\.tv/i.test(safeUrl))return {ok:false,verified:false,reason:'probe_unsupported'};
    if(/\.(mp4|webm|mov|m4v)(\?|$)/i.test(safeUrl))return new Promise(resolve=>{
        const video=document.createElement('video');video.muted=true;video.preload='metadata';let done=false;
        const finish=(ok,verified,reason)=>{if(done)return;done=true;clearTimeout(timer);video.removeAttribute('src');video.load();resolve({ok,verified,reason});};
        const timer=setTimeout(()=>finish(false,false,'timeout'),7000);
        video.onloadedmetadata=()=>finish(true,true,'media_metadata');video.onerror=()=>finish(false,true,'media_error');video.src=safeUrl;video.load();
    });
    if(/\.m3u8(\?|$)/i.test(safeUrl)||/m3u8/i.test(safeUrl)){
        if(!window.Hls||!Hls.isSupported())return {ok:false,verified:false,reason:'hls_unavailable'};
        return new Promise(resolve=>{
            const video=document.createElement('video');video.muted=true;video.preload='none';let hls,done=false;
            const finish=(ok,verified,reason)=>{if(done)return;done=true;clearTimeout(timer);try{if(hls)hls.destroy();}catch(_){}resolve({ok,verified,reason});};
            const timer=setTimeout(()=>finish(false,false,'timeout'),7000);
            try{
                hls=new Hls({enableWorker:true,lowLatencyMode:false,manifestLoadingTimeOut:6000,manifestLoadingMaxRetry:0,levelLoadingTimeOut:6000,levelLoadingMaxRetry:0,fragLoadingTimeOut:6000,fragLoadingMaxRetry:0});
                hls.on(Hls.Events.MANIFEST_PARSED,()=>finish(true,true,'manifest_ok'));
                hls.on(Hls.Events.ERROR,(evt,data)=>{if(data.fatal)finish(false,data.response?.code>=400||data.details==='manifestLoadError',data.details||data.type||'fatal_error');});
                hls.loadSource(safeUrl);hls.attachMedia(video);
            }catch(err){finish(false,false,err.message||'load_error');}
        });
    }
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),7000);
    try{const response=await fetch(safeUrl,{method:'HEAD',mode:'cors',cache:'no-store',signal:ctrl.signal});return {ok:response.ok,verified:true,reason:response.ok?'http_ok':`http_${response.status}`};}
    catch(_){return {ok:false,verified:false,reason:ctrl.signal.aborted?'timeout':'cors_or_network_unverifiable'};}
    finally{clearTimeout(timer);}
}

async function testOneChannel(idx){
    if(idx < 0 || idx >= parsedM3U.length) return;
    const c = parsedM3U[idx];
    c.status = 'testing';
    renderM3UPreview();
    const result = await testChannel(c.url);
    c.status=result.ok?'working':result.verified?'broken':'unverified';
    c.reason = result.reason || '';
    c.tested = !!result.verified;
    updateM3UCounter();
    renderM3UPreview();
}

$('#m3uTestBtn')?.addEventListener('click', async () => {
    if(!parsedM3U.length){ toast('لا توجد قنوات','','warn'); return; }
    if(m3uTesting){ toast('الاختبار جارٍ','','warn'); return; }
    m3uTesting = true;
    m3uStopFlag = false;
    const total = parsedM3U.length;
    let done=0,work=0,fail=0,unverified=0;

    $('#m3uProgressWrap').style.display = 'block';
    const stopBtn=$('#m3uStopBtn');if(stopBtn){stopBtn.style.display='inline-flex';stopBtn.disabled=false;stopBtn.innerHTML='<i class="fa-solid fa-stop"></i> إيقاف';}
    $('#m3uProgressBar').style.width = '0%';
    $('#m3uProgressCount').textContent = `0 / ${total}`;
    $('#m3uProgressLabel').innerHTML = `<i class="fa-solid fa-flask"></i> جارٍ الاختبار...`;

    const testBtn = $('#m3uTestBtn');
    const oldHtml = testBtn.innerHTML;
    testBtn.disabled = true;
    testBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> اختبار...';

    parsedM3U.forEach(c => { c.status = 'untested'; c.reason = ''; c.tested = false; });
    renderM3UPreview();

    const CONCURRENCY = 6;
    let cursor = 0;

    const worker = async () => {
        while(cursor < total && !m3uStopFlag){
            const myIdx = cursor++;
            const c = parsedM3U[myIdx];
            if(!c) continue;
            c.status = 'testing';
            if(done % 3 === 0) renderM3UPreview();
            const result = await testChannel(c.url);
            c.status=result.ok?'working':result.verified?'broken':'unverified';
            c.reason = result.reason || '';
            c.tested=!!result.verified;
            done++;
            if(result.ok)work++;else if(result.verified)fail++;else unverified++;
            $('#m3uProgressBar').style.width = ((done/total)*100).toFixed(1) + '%';
            $('#m3uProgressCount').textContent = `${done} / ${total}`;
            $('#m3uStatWork').textContent = work;
            $('#m3uStatFail').textContent = fail;
            $('#m3uStatUnverified').textContent=unverified;
            $('#m3uStatRemain').textContent = total - done;
        }
    };

    await Promise.all(Array.from({length: Math.min(CONCURRENCY, total)}, worker));

    const stopped=m3uStopFlag;
    m3uTesting = false;
    testBtn.disabled = false;
    testBtn.innerHTML = oldHtml;
    if(stopBtn)stopBtn.style.display='none';
    updateM3UCounter();
    renderM3UPreview();
    $('#m3uProgressLabel').innerHTML=stopped?'<i class="fa-solid fa-circle-stop" style="color:var(--warning)"></i> أُوقف الاختبار':'<i class="fa-solid fa-circle-check" style="color:var(--success)"></i> اكتمل';
    toast(stopped?'أُوقف الاختبار':'تم الاختبار',`تم فحص ${done} من ${total} • يعمل: ${work} • معطل مؤكّد: ${fail} • تعذر التحقق: ${unverified}`,stopped?'warn':'ok');

    if(stopped)return;
    m3uCurrentTab = 'working';
    $$('.m3u-tab').forEach(t => t.classList.toggle('active', t.dataset.m3uTab === 'working'));
    renderM3UPreview();
});

$('#m3uStopBtn')?.addEventListener('click',()=>{
    if(!m3uTesting)return;
    m3uStopFlag=true;
    const btn=$('#m3uStopBtn');if(btn){btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-hourglass-half"></i> جارٍ الإيقاف...';}
    $('#m3uProgressLabel').innerHTML='<i class="fa-solid fa-circle-stop" style="color:var(--warning)"></i> جارٍ إيقاف الاختبارات الحالية...';
});

function playM3uPreview(idx){
    const c = parsedM3U[idx];
    if(!c) return;
    const wrap = $('#m3uPlayer');
    const video = $('#m3uPlayerVideo');
    const label = $('#m3uPlayerLabel');
    if(m3uPlayerHls){ try{m3uPlayerHls.destroy();}catch(e){} m3uPlayerHls = null; }
    video.pause();
    video.removeAttribute('src');
    video.load();
    wrap.style.display = 'block';
    label.textContent = c.name || 'قناة';
    wrap.scrollIntoView({behavior:'smooth', block:'nearest'});
    if(/\.m3u8(\?|$)/i.test(c.url) || /m3u8/i.test(c.url)){
        if(window.Hls && Hls.isSupported()){
            m3uPlayerHls = new Hls({enableWorker:true});
            m3uPlayerHls.loadSource(c.url);
            m3uPlayerHls.attachMedia(video);
            m3uPlayerHls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(()=>{}));
            m3uPlayerHls.on(Hls.Events.ERROR, (e, data) => {
                if(data.fatal) toast('تعذّر التشغيل','','err');
            });
        } else if(video.canPlayType('application/vnd.apple.mpegurl')){
            video.src = c.url;
            video.play().catch(()=>{});
        } else toast('متصفحك لا يدعم HLS','','err');
    } else {
        video.src = c.url;
        video.play().catch(()=>{});
    }
}
window.playM3uPreview = playM3uPreview;

function closeM3uPlayer(){
    const wrap = $('#m3uPlayer');
    const video = $('#m3uPlayerVideo');
    if(m3uPlayerHls){ try{m3uPlayerHls.destroy();}catch(e){} m3uPlayerHls = null; }
    video.pause();
    video.removeAttribute('src');
    video.load();
    wrap.style.display = 'none';
}
window.closeM3uPlayer = closeM3uPlayer;

async function importM3UChannels(list, label){
    if(!list.length){ toast('لا توجد قنوات','','warn'); return; }
    if(list.length>2000){toast('قائمة كبيرة جداً','الحد الأقصى 2000 قناة لكل استيراد.','err');return;}
    const isVip = $('#m3uVip').value === 'true';
    const ageRating = $('#m3uAgeRating').value || 'عام';
    const network = ($('#m3uNetwork').value.trim() || 'شبكة القنوات').slice(0,120);
    const autoCat = $('#m3uAutoCat').value === 'true';
    const ok = await askConfirm({
        title:`استيراد ${label}`,
        msg:`سيتم إضافة ${list.length} قناة${autoCat?' مع التصنيفات':''}.`,
        okText:'استيراد',
        type:'gold'
    });
    if(!ok) return;
    const btn = label.includes('عامل') ? $('#m3uImportWorkingBtn') : $('#m3uImportBtn');
    const oldHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';
    try{
        if(autoCat){
            const catsNeeded = new Set();
            list.forEach(c => { if(c.category) catsNeeded.add(c.category); });
            const existing = new Set(allLiveCats.map(c => c.name));
            const promises = [];
            for(const cat of catsNeeded){
                if(!existing.has(cat)){
                    promises.push(db.ref('liveCategories').push({name:cat, icon:'fa-tv', createdAt:Date.now()}));
                }
            }
            if(promises.length) await Promise.all(promises);
        }
        const updates = {};
        const now = Date.now();
        list.forEach((c, i) => {
            const key = db.ref('liveChannels').push().key;
            const record={
                name: c.name,
                category: c.category || 'عام',
                logo: c.logo || '',
                url: c.url,
                network,
                isVip,
                ageRating,
                type: /m3u8/i.test(c.url) ? 'hls' : /\.mpd(?:$|[?#])/i.test(c.url) ? 'dash' : 'auto',
                viewers: 0,
                order: i,
                testStatus: c.status || 'untested',
                createdAt: now
            };
            updates[`liveChannels/${key}`]=record;
            updates[`publicCatalog/liveChannels/${key}`]=publicLiveProjection(record);
        });
        const entries = Object.entries(updates);
        for(let i = 0; i < entries.length; i += 300){
            const chunk = {};
            entries.slice(i, i + 300).forEach(([k,v]) => chunk[k] = v);
            await db.ref().update(chunk);
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${Math.min(i+300, entries.length)} / ${entries.length}`;
        }
        closeModal('mM3U');
        $('#m3uText').value = '';
        parsedM3U = [];
        $('#m3uPreview').style.display = 'none';
        $('#m3uTabs').style.display = 'none';
        $('#m3uProgressWrap').style.display = 'none';
        closeM3uPlayer();
        logActivity(`استيراد ${list.length} قناة`);
        toast('تم الاستيراد', `${list.length} قناة`,'ok');
    }catch(err){
        toast('خطأ', err.message, 'err');
    }finally{
        btn.disabled = false;
        btn.innerHTML = oldHtml;
    }
}
$('#m3uImportBtn')?.addEventListener('click', () => importM3UChannels(parsedM3U, 'كل القنوات'));
$('#m3uImportWorkingBtn')?.addEventListener('click', () => {
    const working = parsedM3U.filter(c => c.status === 'working');
    if(!working.length){
        toast('لا توجد قنوات عاملة','اضغط اختبار الكل أولاً','warn');
        return;
    }
    importM3UChannels(working, 'القنوات العاملة');
});
$('#m3uClearBtn')?.addEventListener('click', () => {
    $('#m3uText').value = '';
    $('#m3uFile').value = '';
    parsedM3U = [];
    m3uCurrentTab = 'all';
    $('#m3uPreview').style.display = 'none';
    $('#m3uPreview').innerHTML = '';
    $('#m3uTabs').style.display = 'none';
    $('#m3uProgressWrap').style.display = 'none';
    closeM3uPlayer();
    $$('.m3u-tab').forEach(t => t.classList.toggle('active', t.dataset.m3uTab === 'all'));
    toast('تم التفريغ','','ok');
});
$('#btnImportM3U')?.addEventListener('click', () => openModal('mM3U'));

/* ============================================================
   SETTINGS
   ============================================================ */
function loadSettings(){
    db.ref('settings').on('value', snap=>{
        if(!snap.exists()){ window.__siteSettings = {}; return; }
        const s = snap.val();
        window.__siteSettings = s;
        if(s.siteName){
            $('#settingSiteName').value = s.siteName;
            const side = $('#sideBrandName');
            if(side) side.textContent = s.siteName;
        }
        if(s.tickerText) $('#settingTickerText').value = s.tickerText;
        if(s.accentColor) $('#settingAccentColor').value = s.accentColor;
        if(s.vipColor) $('#settingVipColor').value = s.vipColor;
        if(s.whatsappLink) $('#settingWhatsappLink').value = s.whatsappLink;
        if(s.whatsappNumber) $('#settingWhatsappNumber').value = s.whatsappNumber;
        if($('#settingPaymentInstructions')) $('#settingPaymentInstructions').value = s.paymentInstructions || '';
        if($('#settingVipPrice')) $('#settingVipPrice').value = s.vipPrice || '';
        if($('#settingPaymentsEnabled')) $('#settingPaymentsEnabled').value = s.paymentsEnabled === false ? 'false' : 'true';
    });
}
function publicSettingsProjection(settings){
    const result={};
    ['siteName','tickerText','accentColor','vipColor','paymentInstructions','vipPrice','paymentsEnabled','popupBanner','popupEnabled'].forEach(key=>{if(settings?.[key]!==undefined)result[key]=settings[key];});
    return result;
}
$('#btnSaveSettings')?.addEventListener('click',async()=>{
    try{
        const snap = await db.ref('settings').once('value');
        const prev = snap.val() || {};
        const next={
            ...prev,
            siteName: $('#settingSiteName').value.trim(),
            tickerText: $('#settingTickerText').value.trim(),
            accentColor: $('#settingAccentColor').value,
            vipColor: $('#settingVipColor').value,
            whatsappLink: $('#settingWhatsappLink').value.trim(),
            whatsappNumber: $('#settingWhatsappNumber').value.trim().replace(/\D/g,''),
            paymentInstructions: $('#settingPaymentInstructions').value.trim(),
            vipPrice: $('#settingVipPrice').value.trim(),
            paymentsEnabled: $('#settingPaymentsEnabled').value === 'true',
            updatedAt: Date.now()
        };
        await db.ref().update({settings:next,publicSettings:publicSettingsProjection(next)});
        logActivity('تحديث الإعدادات');
        toast('تم الحفظ','','ok');
    }catch(err){ toast('خطأ',err.message,'err'); }
});

/* ============================================================
   BOOT
   ============================================================ */
let adminBooted=false;
window.addEventListener('taghub:admin-unlocked',()=>{
    if(adminBooted)return;
    adminBooted=true;
    loadCategories();
    loadLiveCategories();
    loadLiveChannels();
    loadMedia();
    loadUsers();
    loadVipRequests();
    loadSections();
    loadMatchCategories();
    loadMatches();
    loadComments();
    loadRatings();
    loadAds();
    loadNotifHistory();
    loadSettings();
    if(window.initViewToggles) initViewToggles();
    setTimeout(renderTopViewedChart, 800);
},{once:true});
