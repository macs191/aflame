import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateAuthProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const userDocument = (uid: string) => doc(db, 'users', uid);

const createProfile = (currentUser: User, displayName?: string): UserProfile => ({
  uid: currentUser.uid,
  email: currentUser.email || '',
  displayName: displayName?.trim() || currentUser.displayName || 'مستخدم جديد',
  photoURL: currentUser.photoURL || '',
  role: 'user',
  subscriptionStatus: 'inactive',
  createdAt: new Date().toISOString(),
});

async function ensureProfile(currentUser: User, displayName?: string): Promise<UserProfile> {
  const profileDocument = userDocument(currentUser.uid);
  const snapshot = await getDoc(profileDocument);

  if (snapshot.exists()) {
    return snapshot.data() as UserProfile;
  }

  const profile = createProfile(currentUser, displayName);
  await setDoc(profileDocument, profile);
  return profile;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      void (async () => {
        if (disposed) return;
        setUser(currentUser);
        setProfile(null);
        setLoading(true);

        if (!currentUser) {
          setLoading(false);
          return;
        }

        try {
          const currentProfile = await ensureProfile(currentUser);
          if (!disposed) setProfile(currentProfile);
        } catch (error) {
          console.error('Profile initialization error:', error);
          if (!disposed) setProfile(null);
        } finally {
          if (!disposed) setLoading(false);
        }
      })();
    });

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const name = displayName.trim() || 'مستخدم جديد';
    const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    await updateAuthProfile(credential.user, { displayName: name });

    const newProfile = createProfile(credential.user, name);
    await setDoc(userDocument(credential.user.uid), newProfile);
    setProfile(newProfile);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('يجب تسجيل الدخول أولاً');

    const editable: Partial<UserProfile> = { ...data };
    delete editable.uid;
    delete editable.email;
    delete editable.role;
    delete editable.createdAt;

    await updateDoc(userDocument(user.uid), editable);
    setProfile((previous) => (previous ? { ...previous, ...editable } : previous));
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, loginWithGoogle, loginWithEmail, signUpWithEmail, updateUserProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
