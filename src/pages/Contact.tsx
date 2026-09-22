import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';

export const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      await addDoc(collection(db, 'contacts'), {
        name,
        email,
        message,
        createdAt: new Date().toISOString(),
      });

      setStatus({ type: 'success', text: 'تم إرسال رسالتك بنجاح! سنقوم بالرد عليك في أقرب وقت.' });
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      setStatus({ type: 'error', text: 'حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة لاحقاً.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-extrabold text-gold-500 flex items-center justify-center gap-3">
            <Mail className="w-9 h-9" /> تواصل معنا
          </h1>
          <p className="text-gray-400">يسعدنا تلقي استفساراتك واقتراحاتك حول المنصة وبرامج البث</p>
        </div>

        <div className="glass-card p-8 rounded-2xl border border-gold-500/20">
          {status && (
            <div
              className={`p-4 rounded-xl mb-6 flex items-center gap-3 text-sm font-semibold ${
                status.type === 'success'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}
            >
              {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span>{status.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">الاسم الكامل</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك"
                className="w-full bg-dark-800 border border-gold-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-dark-800 border border-gold-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 dir-ltr text-right"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">الرسالة</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب تفاصيل استفسارك هنا..."
                className="w-full bg-dark-800 border border-gold-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-gold-600 to-gold-500 text-dark-900 font-extrabold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-gold-500/10 flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              {loading ? 'جاري الإرسال...' : 'إرسال الرسالة'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
