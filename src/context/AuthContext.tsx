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
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
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

const buildProfile = (currentUser: User, displayName?: string): UserProfile => ({
  uid: currentUser.uid,
  email: currentUser.email || '',
  displayName: displayName || currentUser.displayName || 'مستخدم جديد',
  photoURL: currentUser.photoURL || '',
  role: 'user',
  subscriptionStatus: 'inactive',
  createdAt: new Date().toISOString(),
});

async function loadOrCreateProfile(currentUser: User, preferredName?: string): Promise<UserProfile> {
  const userRef = doc(db, 'users', currentUser.uid);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    return snapshot.data() as UserProfile;
  }

  const profile = buildProfile(currentUser, preferredName);
  await setDoc(userRef, { ...profile, createdAt: serverTimestamp() });
  return profile;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(true);
      try {
        setProfile(currentUser ? await loadOrCreateProfile(currentUser) : null);
      } catch (error) {
        console.error('تعذر تحميل ملف المستخدم:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const loginWithGoogle = async () => { await signInWithPopup(auth, googleProvider); };
  const loginWithEmail = async (email: string, password: string) => { await signInWithEmailAndPassword(auth, email.trim(), password); };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const name = displayName.trim() || 'مستخدم جديد';
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateAuthProfile(credential.user, { displayName: name });
    const newProfile = buildProfile(credential.user, name);
    await setDoc(doc(db, 'users', credential.user.uid), newProfile);
    setUser(credential.user);
    setProfile(newProfile);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('يجب تسجيل الدخول أولاً');
    const allowed: Partial<UserProfile> = { ...data };
    delete allowed.uid;
    delete allowed.email;
    delete allowed.role;
    delete allowed.createdAt;
    await updateDoc(doc(db, 'users', user.uid), allowed);
    setProfile((previous) => previous ? { ...previous, ...allowed } : previous);
  };

  const logout = async () => { await firebaseSignOut(auth); };

  return <AuthContext.Provider value={{ user, profile, loading, loginWithGoogle, loginWithEmail, signUpWithEmail, updateUserProfile, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
