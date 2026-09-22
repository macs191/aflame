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
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { get, onValue, ref, set, update } from 'firebase/database';
import { auth, googleProvider, db, realtimeDb } from '@/lib/firebase';
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

const createProfile = (currentUser: User, displayName?: string): UserProfile => ({
  uid: currentUser.uid,
  email: currentUser.email || '',
  displayName: displayName || currentUser.displayName || 'مستخدم جديد',
  photoURL: currentUser.photoURL || '',
  role: 'user',
  subscriptionStatus: 'inactive',
  createdAt: new Date().toISOString(),
});

const profileRef = (uid: string) => ref(realtimeDb, `users/${uid}`);
const firestoreProfileRef = (uid: string) => doc(db, 'users', uid);

async function ensureProfile(currentUser: User, displayName?: string): Promise<UserProfile> {
  const snapshot = await get(profileRef(currentUser.uid));
  if (snapshot.exists()) return snapshot.val() as UserProfile;
  const profile = createProfile(currentUser, displayName);
  await set(profileRef(currentUser.uid), profile);
  await setDoc(firestoreProfileRef(currentUser.uid), profile);
  return profile;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);
    setLoading(true);
    if (!currentUser) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      await ensureProfile(currentUser);
      const unsubscribe = onValue(profileRef(currentUser.uid), (snapshot) => {
        setProfile(snapshot.exists() ? snapshot.val() as UserProfile : null);
        setLoading(false);
      }, (error) => {
        console.error('Realtime Database profile error:', error);
        setProfile(null);
        setLoading(false);
      });
      return unsubscribe;
    } catch (error) {
      console.error('Profile initialization error:', error);
      setProfile(null);
      setLoading(false);
    }
  }), []);

  const loginWithGoogle = async () => { await signInWithPopup(auth, googleProvider); };
  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const name = displayName.trim() || 'مستخدم جديد';
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateAuthProfile(credential.user, { displayName: name });
    const profile = createProfile(credential.user, name);
    await set(profileRef(credential.user.uid), profile);
    await setDoc(firestoreProfileRef(credential.user.uid), profile);
    setProfile(profile);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('يجب تسجيل الدخول أولاً');
    const editable: Partial<UserProfile> = { ...data };
    delete editable.uid;
    delete editable.email;
    delete editable.role;
    delete editable.createdAt;
    await update(profileRef(user.uid), editable);
    await updateDoc(firestoreProfileRef(user.uid), editable);
  };

  const logout = async () => { await firebaseSignOut(auth); };

  return <AuthContext.Provider value={{ user, profile, loading, loginWithGoogle, loginWithEmail, signUpWithEmail, updateUserProfile, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
