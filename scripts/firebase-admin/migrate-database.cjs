'use strict';

const admin = require('firebase-admin');
const apply = process.argv.includes('--apply');
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to a private service-account JSON file outside this repository.');
  process.exit(2);
}
const projectId = process.env.FIREBASE_PROJECT_ID || 'voip17';
const databaseURL = process.env.FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`;
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId, databaseURL });

const copyFields = (source, fields) => Object.fromEntries(fields.filter(k => source?.[k] !== undefined).map(k => [k, source[k]]));
const normalizeRequest = (source, uid) => {
  const original = source || {};
  const rawMethod = String(original.paymentMethod || '').toLowerCase();
  const request = {
    uid,
    userId: uid,
    email: String(original.email || '').slice(0, 254),
    name: String(original.name || 'عضو').slice(0, 120),
    status: ['pending', 'approved', 'rejected'].includes(original.status) ? original.status : 'pending',
    paymentMethod: ['wallet', 'paypal', 'bank', 'other'].includes(rawMethod) ? rawMethod : 'other',
    paymentProvider: String(original.paymentProvider || original.paymentMethodLabel || original.paymentMethod || 'غير محدد').slice(0, 80),
    paymentReference: String(original.paymentReference || 'غير متوفر').slice(0, 120),
    paymentSender: String(original.paymentSender || 'غير متوفر').slice(0, 120),
    paymentNote: String(original.paymentNote || '').slice(0, 500),
    createdAt: Number(original.createdAt) || Date.now(),
  };
  for (const field of ['approvedAt','rejectedAt','reviewedAt','grantedAt']) if (Number.isFinite(Number(original[field])) && original[field] != null) request[field] = Number(original[field]);
  if (Number.isFinite(Number(original.durationDays)) && Number(original.durationDays) >= 1 && Number(original.durationDays) <= 3650) request.durationDays = Number(original.durationDays);
  if (['pending','granted'].includes(original.entitlementStatus)) request.entitlementStatus = original.entitlementStatus;
  if (typeof original.rejectReason === 'string') request.rejectReason = original.rejectReason.slice(0, 500);
  return request;
};
const videoPublicFields = ['title','category','isVip','ageRating','thumbnailUrl','description','views','ratingAvg','ratingCount','featured','year','type','seriesId','episode','season','createdAt','updatedAt','poster','image','thumbnail'];
const livePublicFields = ['name','category','logo','isVip','ageRating','type','order','description','network','viewers','createdAt','updatedAt'];
const matchPublicFields = ['category','status','date','time','team1','team1Logo','team2','team2Logo','score1','score2','channel','isVip','createdAt','updatedAt'];

(async () => {
  try {
    const snapshot = await admin.database().ref('/').once('value');
    const root = snapshot.val() || {};
    const updates = {};
    const catalog = { ...(root.publicCatalog || {}) };

    const videos = { ...(root.videosPrivate || {}), ...(root.videos || {}) };
    if (Object.keys(videos).length) {
      updates.videosPrivate = videos;
      if (root.videos) updates.videos = null;
    }
    const publicVideos = { ...(root.publicCatalog?.videos || {}), ...videos };
    if (Object.keys(publicVideos).length) catalog.videos = Object.fromEntries(Object.entries(publicVideos).map(([id, value]) => [id, copyFields(value || {}, videoPublicFields)]));
    for (const [branch, fields] of [['liveChannels', livePublicFields], ['matches', matchPublicFields]]) {
      const entries = { ...(root.publicCatalog?.[branch] || {}), ...(root[branch] || {}) };
      if (Object.keys(entries).length) catalog[branch] = Object.fromEntries(Object.entries(entries).map(([id, value]) => [id, copyFields(value || {}, fields)]));
    }
    if (Object.keys(catalog).length) updates.publicCatalog = catalog;

    const publicSettingKeys = ['siteName','tickerText','accentColor','vipColor','paymentInstructions','vipPrice','paymentsEnabled','popupBanner','popupEnabled'];
    if (root.settings && typeof root.settings === 'object') updates.publicSettings = copyFields(root.settings, publicSettingKeys);
    const publicAdKeys = ['topBanner','midBanner','bottomBanner','downloadAd','videoAd','videoAdDelay','videoAdInterval','videoAdDuration'];
    if (root.ads && typeof root.ads === 'object') updates.publicAds = copyFields(root.ads, publicAdKeys);

    const users = root.users || {};
    for (const [uid, source] of Object.entries(users)) {
      const user = source || {};
      const normalized = {
        ...user,
        uid,
        authUid: uid,
        email: typeof user.email === 'string' ? user.email : '',
        name: typeof user.name === 'string' ? user.name : 'عضو',
        phone: typeof user.phone === 'string' ? user.phone : '',
        role: typeof user.role === 'string' ? user.role : 'user',
        isVip: user.isVip === true,
        isBanned: user.isBanned === true,
        isBlocked: user.isBlocked === true,
        expireAt: Number(user.expireAt || user.vipExpireDate || 0),
        vipExpireDate: Number(user.vipExpireDate || user.expireAt || 0),
        subscriptionStatus: typeof user.subscriptionStatus === 'string' ? user.subscriptionStatus : (user.isVip === true ? 'active' : 'inactive'),
        createdAt: Number(user.createdAt) || Date.now(),
        updatedAt: Number(user.updatedAt) || Date.now(),
        lastLoginAt: Number(user.lastLoginAt) || 0,
      };
      updates[`users/${uid}`] = normalized;
    }

    const legacyRequests = root.vipRequests || {};
    const nestedRequests = {};
    for (const [key, value] of Object.entries(legacyRequests)) {
      if (value && typeof value.uid === 'string') {
        nestedRequests[value.uid] ||= {};
        nestedRequests[value.uid][key] = normalizeRequest(value, value.uid);
      } else if (value && typeof value === 'object') {
        for (const [requestId, request] of Object.entries(value)) {
          const uid = request?.uid || key;
          if (uid && request && typeof request === 'object') {
            nestedRequests[uid] ||= {};
            nestedRequests[uid][requestId] = normalizeRequest(request, uid);
          }
        }
      }
    }
    if (Object.keys(nestedRequests).length) updates.vipRequests = nestedRequests;

    console.log(`Prepared migration for ${Object.keys(users).length} user profiles, ${Object.keys(videos).length} VOD records, ${Object.keys(root.liveChannels || {}).length} live channels, ${Object.keys(root.matches || {}).length} matches and ${Object.values(nestedRequests).reduce((n, x) => n + Object.keys(x).length, 0)} VIP requests.`);
    if (!apply) {
      console.log('DRY RUN ONLY: no database data was changed. Back up the database, then rerun with --apply to perform the migration.');
      return;
    }
    if (process.env.CONFIRM_FIREBASE_MIGRATION !== projectId) {
      throw new Error(`For safety, set CONFIRM_FIREBASE_MIGRATION=${projectId} to apply changes.`);
    }
    await admin.database().ref('/').update(updates);
    console.log('Migration applied successfully. Verify the public catalog and protected records before deploying the rules.');
  } catch (error) {
    console.error(`Migration failed: ${error.code || error.message}`);
    process.exitCode = 1;
  } finally {
    await admin.app().delete();
  }
})();
