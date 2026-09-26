import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { get, ref, set, update } from 'firebase/database';

const uid = 'viewer_1';
const otherUid = 'viewer_2';
let env;

beforeAll(async () => {
  const rules = await readFile(new URL('../../database.rules.json', import.meta.url), 'utf8');
  env = await initializeTestEnvironment({
    projectId: 'demo-taghub',
    database: { host: '127.0.0.1', port: 9000, rules },
  });
});

afterAll(async () => { await env?.cleanup(); });

beforeEach(async () => {
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.database();
    await set(ref(db, 'users/viewer_1'), { uid, authUid: uid, email: 'viewer@example.test', name: 'Viewer', role: 'user', isVip: false, isBanned: false, isBlocked: false, expireAt: 0, vipExpireDate: 0, subscriptionStatus: 'inactive', createdAt: 1, updatedAt: 1, lastLoginAt: 1, phone: '', note: '' });
    await set(ref(db, 'users/viewer_2'), { uid: otherUid, authUid: otherUid, email: 'other@example.test', name: 'Other', role: 'user', isVip: false, isBanned: false, isBlocked: false, expireAt: 0, vipExpireDate: 0, subscriptionStatus: 'inactive', createdAt: 1, updatedAt: 1, lastLoginAt: 1, phone: '', note: '' });
    await set(ref(db, 'videosPrivate/free1'), { isVip: false, servers: [{ url: 'https://stream.test/free.m3u8' }] });
    await set(ref(db, 'videosPrivate/vip1'), { isVip: true, servers: [{ url: 'https://stream.test/vip.m3u8' }] });
    await set(ref(db, 'publicCatalog/videos/vip1'), { title: 'Public title', isVip: true, thumbnailUrl: 'https://img.test/poster.jpg' });
    await set(ref(db, 'settings/privateExample'), 'private');
    await set(ref(db, 'publicSettings/siteName'), 'TagHub');
    await set(ref(db, 'ads/privateExample'), '<script>private</script>');
    await set(ref(db, 'publicAds/topBanner'), '<p>Ad</p>');
  });
});

const userDb = () => env.authenticatedContext(uid, { email: 'viewer@example.test' }).database();
const adminDb = () => env.authenticatedContext('admin_1', { admin: true }).database();

describe('TagHub RTDB authorization', () => {
  it('allows first signup to create only a normal profile matching the Auth identity', async () => {
    const db = env.authenticatedContext('new_user', { email: 'new@example.test' }).database();
    const profile = { uid: 'new_user', authUid: 'new_user', email: 'new@example.test', name: 'New User', phone: '', role: 'user', note: '', isBanned: false, isBlocked: false, isVip: false, subscriptionStatus: 'inactive', vipExpireDate: 0, expireAt: 0, createdAt: Date.now(), updatedAt: Date.now(), lastLoginAt: Date.now() };
    await assertSucceeds(set(ref(db, 'users/new_user'), profile));
    await assertFails(set(ref(db, 'users/attacker'), { ...profile, uid: 'attacker', authUid: 'attacker', role: 'admin', isVip: true }));
  });

  it('allows guests to read the URL-free catalog but not private records', async () => {
    const guest = env.unauthenticatedContext().database();
    await assertSucceeds(get(ref(guest, 'publicCatalog/videos/vip1')));
    await assertSucceeds(get(ref(guest, 'publicSettings/siteName')));
    await assertSucceeds(get(ref(guest, 'publicAds/topBanner')));
    await assertFails(get(ref(guest, 'settings/privateExample')));
    await assertFails(get(ref(guest, 'ads/privateExample')));
    await assertFails(get(ref(guest, 'videosPrivate/free1')));
    await assertFails(get(ref(guest, 'users/viewer_1')));
  });

  it('allows signed-in users to read free streams but not VIP streams', async () => {
    const db = userDb();
    await assertSucceeds(get(ref(db, 'videosPrivate/free1')));
    await assertFails(get(ref(db, 'videosPrivate/vip1')));
    await assertFails(set(ref(db, 'videosPrivate/free1/servers'), []));
  });

  it('enforces active VIP expiry and banned status on private media', async () => {
    await env.withSecurityRulesDisabled(async context => {
      const db = context.database();
      await update(ref(db, 'users/viewer_1'), { isVip: true, expireAt: Date.now() + 86_400_000, vipExpireDate: Date.now() + 86_400_000, subscriptionStatus: 'active' });
    });
    await assertSucceeds(get(ref(userDb(), 'videosPrivate/vip1')));
    await env.withSecurityRulesDisabled(async context => {
      await update(ref(context.database(), 'users/viewer_1'), { isVip: true, expireAt: 1, vipExpireDate: 1, isBanned: true, isBlocked: true });
    });
    await assertFails(get(ref(userDb(), 'videosPrivate/free1')));
  });

  it('allows a user to submit only a new pending manual transfer request under their UID', async () => {
    const db = userDb();
    const request = { uid, userId: uid, email: 'viewer@example.test', name: 'Viewer', status: 'pending', paymentMethod: 'wallet', paymentProvider: 'Vodafone Cash', paymentReference: 'TX-12345', paymentSender: '+201000000000', paymentNote: '', createdAt: Date.now() };
    await assertSucceeds(set(ref(db, 'vipRequests/viewer_1/req_1'), request));
    await assertFails(set(ref(db, 'vipRequests/viewer_1/req_1/status'), 'approved'));
    await assertFails(set(ref(db, 'vipRequests/viewer_2/req_2'), { ...request, uid: otherUid }));
  });

  it('allows an admin to record review and grant-recovery fields on a valid request', async () => {
    const request = { uid, userId: uid, email: 'viewer@example.test', name: 'Viewer', status: 'pending', paymentMethod: 'wallet', paymentProvider: 'Wallet', paymentReference: 'TX-998', paymentSender: '+201000000000', paymentNote: '', createdAt: Date.now() };
    await env.withSecurityRulesDisabled(async context => set(ref(context.database(), 'vipRequests/viewer_1/req_admin'), request));
    await assertSucceeds(update(ref(adminDb(), 'vipRequests/viewer_1/req_admin'), { status: 'approved', approvedAt: Date.now(), reviewedAt: Date.now(), durationDays: 30, entitlementStatus: 'pending' }));
  });

  it('allows owner-scoped ratings/comments/watchlists/welcome notifications only', async () => {
    const db = userDb();
    await assertSucceeds(set(ref(db, 'ratings/item_1/viewer_1'), { value: 5, ts: Date.now() }));
    await assertFails(set(ref(db, 'ratings/item_1/viewer_2'), { value: 5, ts: Date.now() }));
    await assertSucceeds(set(ref(db, 'comments/item_1/comment_1'), { uid, name: 'Viewer', text: 'Nice film', ts: Date.now() }));
    await assertFails(set(ref(db, 'comments/item_1/comment_2'), { uid: otherUid, name: 'Other', text: 'Impersonation', ts: Date.now() }));
    await assertSucceeds(set(ref(db, 'watchlists/viewer_1/list_1'), { name: 'My list', items: ['item_1'], createdAt: Date.now() }));
    await assertSucceeds(set(ref(db, 'notifications/viewer_1/n1'), { title: 'Welcome', text: 'Hello', type: 'welcome', read: false, createdAt: Date.now() }));
    await assertFails(set(ref(db, 'notifications/viewer_2/n2'), { title: 'Fake', text: 'Hello', type: 'welcome', read: false, createdAt: Date.now() }));
  });

  it('prevents users from changing role, VIP, ban state, or accessing admin data', async () => {
    const db = userDb();
    await assertFails(update(ref(db, 'users/viewer_1'), { isVip: true, expireAt: Date.now() + 1_000_000, vipExpireDate: Date.now() + 1_000_000 }));
    await assertFails(update(ref(db, 'users/viewer_1'), { isBanned: false, role: 'admin' }));
    await assertFails(get(ref(db, 'adminNotifications')));
    await assertFails(set(ref(db, 'settings/siteName'), 'Attacker'));
  });

  it('allows an Auth account with the custom admin claim to access protected records', async () => {
    const db = adminDb();
    await assertSucceeds(get(ref(db, 'videosPrivate/vip1')));
    await assertSucceeds(set(ref(db, 'settings/siteName'), 'Site'));
    await assertSucceeds(set(ref(db, 'users/viewer_1/isVip'), true));
  });
});
