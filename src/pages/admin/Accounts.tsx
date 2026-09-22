import React, { useEffect, useState } from 'react';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, UserRole, SubscriptionStatus } from '@/types';
import { Loader2, ShieldCheck, Users } from 'lucide-react';
import { StatusMessage } from '@/components/admin/ui';

export const Accounts: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect((): (() => void) => {
    let disposed = false;

    const loadUsers = async (): Promise<void> => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));

        if (!disposed) {
          setUsers(snapshot.docs.map((item) => item.data() as UserProfile));
        }
      } catch (error) {
        console.error('Accounts loading error:', error);

        if (!disposed) {
          setMessage('تعذر تحميل الحسابات. تأكد من صلاحيات Firestore.');
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    };

    void loadUsers();

    return (): void => {
      disposed = true;
    };
  }, []);

  const updateAccount = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'users', uid), data);
      setUsers((currentUsers) =>
        currentUsers.map((account) => (account.uid === uid ? { ...account, ...data } : account)),
      );
      setMessage('تم تحديث الحساب وحفظه بنجاح.');
    } catch (error) {
      console.error('Account update error:', error);
      setMessage('تعذر تحديث الحساب. تأكد من صلاحيات الأدمن.');
    }
  };

  return (
    <section className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold text-gold-400 flex items-center gap-2">
          <Users className="w-6 h-6" /> إدارة الحسابات
        </h2>
        <p className="text-gray-400 text-sm mt-2">البيانات محفوظة في Firestore.</p>
      </div>

      <StatusMessage message={message} />

      {loading ? (
        <div className="py-12 flex justify-center text-gold-500">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-gray-400 text-center py-10">لا توجد ملفات مستخدمين.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gold-500/20">
          <table className="w-full text-sm">
            <thead className="bg-dark-800 text-gold-400">
              <tr>
                <th className="p-4 text-right">المستخدم</th>
                <th className="p-4 text-right">UID</th>
                <th className="p-4 text-right">الدور</th>
                <th className="p-4 text-right">الاشتراك</th>
              </tr>
            </thead>
            <tbody>
              {users.map((account) => (
                <tr key={account.uid} className="border-t border-gold-500/10">
                  <td className="p-4">
                    <div className="font-bold">{account.displayName}</div>
                    <div className="text-gray-400">{account.email}</div>
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-400">{account.uid}</td>
                  <td className="p-4">
                    <select
                      value={account.role}
                      onChange={(event) =>
                        void updateAccount(account.uid, { role: event.target.value as UserRole })
                      }
                      className="bg-dark-800 border border-gold-500/30 rounded-lg px-3 py-2"
                    >
                      <option value="user">مستخدم</option>
                      <option value="admin">أدمن</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <select
                      value={account.subscriptionStatus}
                      onChange={(event) =>
                        void updateAccount(account.uid, {
                          subscriptionStatus: event.target.value as SubscriptionStatus,
                        })
                      }
                      className="bg-dark-800 border border-gold-500/30 rounded-lg px-3 py-2"
                    >
                      <option value="inactive">غير نشط</option>
                      <option value="pending">قيد المراجعة</option>
                      <option value="active">نشط</option>
                      <option value="expired">منتهي</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs text-gray-500 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4" /> كلمات المرور يديرها Firebase Authentication ولا تُخزن هنا.
      </div>
    </section>
  );
};

export default Accounts;
