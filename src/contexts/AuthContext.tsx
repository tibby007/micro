// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User as FirebaseUserType } from 'firebase/auth'; // Renamed to avoid conflict
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase'; // Assuming this path is correct relative to AuthContext.tsx

// Define a specific type for your user profile data
export interface AppUserProfile {
  uid: string;
  email: string | null;
  brokerName: string;
  company: string;
  phone: string;
  subscriptionStatus: 'trial' | 'starter' | 'pro' | 'inactive'; // Example statuses
  subscriptionPlan: 'trial' | 'starter' | 'pro' | null; // Example plans
  trialExpiresAt?: Date | string; // Or store as ISO string and convert
  monthlySearchesUsed: number;
  monthlySearchLimit: number;
}

interface AuthContextType {
  user: FirebaseUserType | null; // Using the renamed FirebaseUserType
  userProfile: AppUserProfile | null; // Using the new specific type
  sendLoginLink: (email: string, brokerInfo?: Partial<Pick<AppUserProfile, 'brokerName' | 'company' | 'phone'>>) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  message: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type { FirebaseUserType as User }; // Export FirebaseUserType as User if needed elsewhere

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUserType | null>(null);
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null); // Typed state
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const actionCodeSettings = {
    url: `${window.location.origin}/app`, // Redirect to /app or your main app page after login
    handleCodeInApp: true,
  };

  const sendLoginLink = useCallback(async (email: string, brokerInfo?: Partial<Pick<AppUserProfile, 'brokerName' | 'company' | 'phone'>>) => {
    try {
      setMessage('');
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      localStorage.setItem('emailForSignIn', email);
      if (brokerInfo) {
        localStorage.setItem('brokerInfo', JSON.stringify(brokerInfo));
      }
      setMessage('Check your email! We sent you a secure login link.');
    } catch (error: any) {
      // Consider more specific error handling or logging
      console.error("Error sending login link:", error);
      setMessage(error.message || 'Failed to send login link.');
      // Do not re-throw here unless you want the component calling it to handle it.
      // throw new Error(error.message); 
    }
  }, []);

  const logout = useCallback(async () => {
    try {
        await signOut(auth);
        setCurrentUser(null);
        setUserProfile(null);
        localStorage.removeItem('brokerInfo'); // Clear brokerInfo on logout
        setMessage('Successfully signed out.');
    } catch (error) {
        console.error("Error signing out: ", error);
        setMessage("Failed to sign out.");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setCurrentUser(fbUser);
      if (fbUser) {
        const savedBrokerInfoString = localStorage.getItem('brokerInfo');
        const savedBrokerInfo = savedBrokerInfoString ? JSON.parse(savedBrokerInfoString) : {};
        
        // Construct the user profile with defaults
        const profileData: AppUserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          brokerName: savedBrokerInfo.brokerName || fbUser.displayName || 'Broker User',
          company: savedBrokerInfo.company || 'User Company',
          phone: savedBrokerInfo.phone || '(555) 555-5555', // Provide a sensible default
          subscriptionStatus: 'trial', // Default or fetch from DB
          subscriptionPlan: 'trial',   // Default or fetch from DB
          trialExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Store as ISO string
          monthlySearchesUsed: 0,
          monthlySearchLimit: 999, // Default for trial
        };
        setUserProfile(profileData);
        // Optionally, you could clear 'brokerInfo' from localStorage here if it's only for initial setup
        // localStorage.removeItem('brokerInfo'); 
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleEmailLinkSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        setLoading(true); // Show loading while processing
        let email = localStorage.getItem('emailForSignIn');
        if (!email) {
          email = window.prompt('Please provide your email for confirmation to complete sign-in:');
        }

        if (email) {
          try {
            await signInWithEmailLink(auth, email, window.location.href);
            localStorage.removeItem('emailForSignIn');
            // Broker info should already be set if it was a new registration flow
            // If not, onAuthStateChanged will pick up the user and create a default profile.
            setMessage('Successfully signed in!');
            // Clean URL only after successful sign-in and state update
            if (window.history.replaceState) {
                 window.history.replaceState(null, '', '/app'); // Or your dashboard path
            }
          } catch (error: any) {
            console.error('Error signing in with email link:', error);
            setMessage(`Sign-in error: ${error.code || error.message}. Please try sending the link again.`);
            // Potentially clear emailForSignIn if it's invalid
            // localStorage.removeItem('emailForSignIn');
          } finally {
            setLoading(false);
          }
        } else {
          // No email provided by user or from localStorage
          setMessage('Email required to complete sign-in. Please try sending the link again.');
          setLoading(false);
        }
      }
    };
    handleEmailLinkSignIn();
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
      {!loading && children}
      {/* Or show a global loader: {loading ? <GlobalLoader /> : children} */}
    </AuthContext.Provider>
  );
}