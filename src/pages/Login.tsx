import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Tv, ShieldCheck, Mail, Lock, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';

const errorMessage = (code: string): string => {
  const map: Record<string, string> = {
    'auth/invalid-email': 'البريد الإلكتروني غير صالح.',
    'auth/user-not-found': 'لا يوجد حساب بهذا البريد الإلكتروني.',
    'auth/wrong-password': 'كلمة المرور غير صحيحة.',
    'auth/invalid-credential': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    'auth/email-already-in-use': 'هذا البريد مسجّل بالفعل، يمكنك تسجيل الدخول.',
    'auth/weak-password': 'كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل.',
    'auth/too-many-requests': 'محاولات كثيرة، حاول لاحقاً.',
    'auth/popup-closed-by-user': 'تم إغلاق نافذة تسجيل الدخول.',
  };
  return map[code] || 'حدث خطأ، يرجى المحاولة مرة أخرى.';
};

interface AuthPageProps {
  mode?: 'login' | 'register';
}

export const Login: React.FC<AuthPageProps> = ({ mode = 'login' }) => {
  const { loginWithGoogle, loginWithEmail, signUpWithEmail, user } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = React.useState(mode === 'register');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  React.useEffect(() => {
    setIsRegister(mode === 'register');
    setError(null);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await signUpWithEmail(email, password, name.trim() || 'مستخدم جديد');
      } else {
        await loginWithEmail(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(errorMessage(err?.code || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(errorMessage(err?.code || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
      <div className="glass-card max-w-md w-full p-8 rounded-2xl border border-gold-500/20 space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-4 bg-gold-500/10 rounded-2xl text-gold-500 border border-gold-500/30">
            <Tv className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-extrabold text-gold-500">
            {isRegister ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </h1>
          <p className="text-gray-400 text-sm">
            {isRegister
              ? 'أنشئ حسابك للوصول إلى كل المحتوى'
              : 'سجّل دخولك لمتابعة المشاهدة'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="relative">
              <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="الاسم الكامل"
                className="w-full bg-dark-800 border border-gold-500/30 rounded-xl pr-11 pl-4 py-3 text-white focus:outline-none focus:border-gold-500"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              dir="ltr"
              className="w-full bg-dark-800 border border-gold-500/30 rounded-xl pr-11 pl-4 py-3 text-white text-right focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              dir="ltr"
              className="w-full bg-dark-800 border border-gold-500/30 rounded-xl pr-11 pl-4 py-3 text-white text-right focus:outline-none focus:border-gold-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-gold-600 to-gold-500 text-dark-900 font-extrabold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-gold-500/10 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {isRegister ? 'إنشاء الحساب' : 'دخول'}
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex-1 h-px bg-gold-500/10" />
          أو
          <span className="flex-1 h-px bg-gold-500/10" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-3.5 px-6 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          المتابعة بواسطة Google
        </button>

        <p className="text-center text-sm text-gray-400">
          {isRegister ? 'لديك حساب بالفعل؟ ' : 'ليس لديك حساب؟ '}
          <Link
            to={isRegister ? '/login' : '/register'}
            className="text-gold-400 font-bold hover:underline"
          >
            {isRegister ? 'تسجيل الدخول' : 'إنشاء حساب'}
          </Link>
        </p>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2 border-t border-gold-500/10">
          <ShieldCheck className="w-4 h-4 text-gold-500" />
          <span>مصادقة آمنة ومحمية بواسطة Firebase</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
