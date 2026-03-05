import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithCredential,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

// Type declaration for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (callback?: (notification: {
            isNotDisplayed: () => boolean;
            getNotDisplayedReason: () => string;
          }) => void) => void;
          renderButton: (parent: HTMLElement, options: {
            type?: 'standard' | 'icon';
            theme?: 'outline' | 'filled_blue' | 'filled_black';
            size?: 'large' | 'medium' | 'small';
            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
            shape?: 'rectangular' | 'pill' | 'circle' | 'square';
            logo_alignment?: 'left' | 'center';
            width?: number | string;
          }) => void;
        };
      };
    };
  }
}

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface FirebaseAuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | null>(null);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkAuth = () => {
    if (!auth) {
      throw new Error("Firebase is not configured. Please add your Firebase API keys.");
    }
    return auth;
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(checkAuth(), email, password);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    setError(null);
    try {
      const firebaseAuth = checkAuth();
      const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await updateProfile(result.user, { displayName });
      await sendEmailVerification(result.user);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    const firebaseAuth = checkAuth();
    
    return new Promise<void>((resolve, reject) => {
      const gis = window.google;
      if (!gis?.accounts) {
        const err = new Error("Google Sign-In is loading. Please wait a moment and try again.");
        setError(err.message);
        reject(err);
        return;
      }
      
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      if (!clientId) {
        const err = new Error("Google Sign-In is not configured. Please use email/password.");
        setError(err.message);
        reject(err);
        return;
      }
      
      const buttonContainer = document.createElement('div');
      buttonContainer.id = 'google-signin-temp';
      buttonContainer.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10000;background:white;padding:20px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.3)';
      
      const overlay = document.createElement('div');
      overlay.id = 'google-signin-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999';
      overlay.onclick = () => { cleanup(); reject(new Error('Sign-in cancelled')); };
      
      document.body.appendChild(overlay);
      document.body.appendChild(buttonContainer);
      
      const cleanup = () => {
        document.getElementById('google-signin-temp')?.remove();
        document.getElementById('google-signin-overlay')?.remove();
      };
      
      gis.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          try {
            cleanup();
            const credential = GoogleAuthProvider.credential(response.credential);
            await signInWithCredential(firebaseAuth, credential);
            resolve();
          } catch (err: any) {
            setError(err.message);
            reject(err);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: false,
      });
      
      gis.accounts.id.renderButton(buttonContainer, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 280,
      });
    });
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(checkAuth());
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(checkAuth(), email);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const sendVerificationEmailFn = async () => {
    setError(null);
    try {
      const firebaseAuth = checkAuth();
      if (firebaseAuth.currentUser) {
        await sendEmailVerification(firebaseAuth.currentUser);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
    setError(null);
    try {
      const firebaseAuth = checkAuth();
      if (firebaseAuth.currentUser) {
        await updateProfile(firebaseAuth.currentUser, data);
        setUser((prev) => prev ? { ...prev, ...data } : null);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (auth?.currentUser) {
      return auth.currentUser.getIdToken();
    }
    return null;
  };

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        signInWithGoogle,
        logout,
        resetPassword,
        sendVerificationEmail: sendVerificationEmailFn,
        updateUserProfile,
        getIdToken,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error("useFirebaseAuth must be used within a FirebaseAuthProvider");
  }
  return context;
}
