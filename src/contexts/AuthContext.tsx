// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  sendLoginLink: (email: string, brokerInfo?: any) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  message: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type { User };

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Configuration for email link sign-in
  const actionCodeSettings = {
    url: window.location.origin,
    handleCodeInApp: true,
  };

  const sendLoginLink = useCallback(async (email: string, brokerInfo?: any) => {
    try {
      setMessage('');
      
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      
      localStorage.setItem('emailForSignIn', email);
      if (brokerInfo) {
        localStorage.setItem('brokerInfo', JSON.stringify(brokerInfo));
      }
      
      setMessage('Check your email! We sent you a secure login link.');
    } catch (error: any) {
      throw new Error(error.message);
    }
  }, []);

  const logout = useCallback(async () => {
    setCurrentUser(null);
    setUserProfile(null);
    setMessage('');
    await signOut(auth);
  }, []);

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // Get broker info from localStorage or use defaults
        const savedBrokerInfo = localStorage.getItem('brokerInfo');
        const brokerInfo = savedBrokerInfo ? JSON.parse(savedBrokerInfo) : {};
        
        setUserProfile({
          uid: user.uid,
          email: user.email,
          brokerName: brokerInfo.brokerName || user.displayName || 'Broker',
          company: brokerInfo.company || 'Your Company',
          phone: brokerInfo.phone || '(555) 123-4567',
          subscriptionStatus: 'trial',
          subscriptionPlan: 'trial',
          trialExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          monthlySearchesUsed: 0,
          monthlySearchLimit: 999
        });
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Handle email link completion - check on every page load
  useEffect(() => {
    const handleEmailLink = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        try {
          let email = localStorage.getItem('emailForSignIn');
          
          if (!email) {
            // Fallback: ask user for email
            email = window.prompt('Please provide your email for confirmation');
          }
          
          if (email) {
            await signInWithEmailLink(auth, email, window.location.href);
            
            // Clear localStorage
            localStorage.removeItem('emailForSignIn');
            // Don't remove brokerInfo - we need it for profile creation
            
            // Clean up URL
            window.history.replaceState({}, document.title, "/");
            
            setMessage('Successfully signed in! Welcome to your dashboard.');
          }
        } catch (error: any) {
          console.error('Error during sign-in:', error);
          setMessage('Error signing in. Please try again.');
        }
      }
    };

    handleEmailLink();
  }, []);

  const value: AuthContextType = {
    user: currentUser,
    userProfile,
    sendLoginLink,
    logout,
    loading,
    message
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}