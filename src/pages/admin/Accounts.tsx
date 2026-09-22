import React, { useEffect, useState } from 'react';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/types';
import { Loader2, UserPlus, Users } from 'lucide-react';
import { Field, StatusMessage, SubmitButton } from '@/components/admin/ui';

const emptyForm = { uid: '', email: '', displayName: '' };

export const Accounts: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      setUsers(snapshot.docs.map((item) => item.data() as UserProfile));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل الحسابات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadUsers(); }, []);

  const createAdminProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const uid = form.uid.trim();
      const email = form.email.trim().toLowerCase();
      const displayName = form.displayName.trim();
      if (!uid || !email || !displayName) throw new Error('يرجى إدخال UID والبريد والاسم');

      await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        displayName,
        photoURL: '',
        role: 'admin',
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString(),
      }, { merge: true });

      setForm(emptyForm);
      setMessage('تم حفظ ملف الأدمن في Firestore بنجاح.');
      await loadUsers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر حفظ الحساب');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="glass-card p-8 rounded-2xl h-fit">
        <h2 className="text-xl font-bold mb-3 text-gold-400 flex items-center gap-2"><UserPlus className="w-5 h-5" /> إضافة ملف أدمن</h2>
        <p className="text-sm text-gray-400 mb-6">أنشئ المستخدم أولاً من Firebase Authentication، ثم ضع UID هنا لحفظ ملفه في Firestore.</p>
        <StatusMessage message={message} />
        <form onSubmit={createAdminProfile} className="space-y-5">
          <Field label="Firebase Auth UID" value={form.uid} onChange={(value) => setForm({ ...form, uid: value })} required ltr placeholder="انسخ UID من Authentication" />
          <Field label="البريد الإلكتروني" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required type="url" ltr placeholder="admin@example.com" />
          <Field label="اسم الأدمن" value={form.displayName} onChange={(value) => setForm({ ...form, displayName: value })} required placeholder="مدير النظام" />
          <SubmitButton loading={saving} label="حفظ في Firestore" />
        </form>
      </div>

      <div className="glass-card p-8 rounded-2xl">
        <h2 className="text-xl font-bold mb-6 text-gold-400 flex items-center gap-2"><Users className="w-5 h-5" /> الحسابات ({users.length})</h2>
        {loading ? <div className="py-10 flex justify-center text-gold-500"><Loader2 className="w-8 h-8 animate-spin" /></div> : users.length === 0 ? <p className="text-gray-400 text-center py-10">لا توجد ملفات مستخدمين.</p> : <ul className="space-y-3">{users.map((user) => <li key={user.uid} className="bg-dark-900/50 border border-gold-500/10 rounded-xl p-3"><p className="font-bold">{user.displayName}</p><p className="text-sm text-gray-400">{user.email}</p><p className="text-xs text-gold-500 mt-1">{user.role}</p></li>)}</ul>}
      </div>
    </div>
  );
};

export default Accounts;
