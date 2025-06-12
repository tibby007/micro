// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User as FirebaseUserType } from 'firebase/auth';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';

export interface AppUserProfile {
  uid: string;
  email: string | null;
  brokerName: string;
  company: string;
  phone: string;
  subscriptionStatus: 'trial' | 'starter' | 'pro' | 'inactive';
  subscriptionPlan: 'trial' | 'starter' | 'pro' | null;
  trialExpiresAt?: Date | string;
  monthlySearchesUsed: number;
  monthlySearchLimit: number;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;

}

interface AuthContextType {
  user: FirebaseUserType | null;
  userProfile: AppUserProfile | null;
  sendLoginLink: (email: string, brokerInfo?: Partial<Pick<AppUserProfile, 'brokerName' | 'company' | 'phone' | 'subscriptionPlan'>>) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  message: string;
}

const STRIPE_PAYMENT_LINKS: Record<'starter' | 'pro', string> = {
  starter: 'https://buy.stripe.com/8x2aEW86o3Jq3Ub4Us4gg04',
  pro: 'https://buy.stripe.com/cNi28q4Uc0xeaiz1Ig4gg05'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type { FirebaseUserType as User };

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUserType | null>(null);
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const actionCodeSettings = {
    url: `${window.location.origin}/app`,
    handleCodeInApp: true,
  };

  const sendLoginLink = useCallback(async (email: string, brokerInfo?: Partial<Pick<AppUserProfile, 'brokerName' | 'company' | 'phone' | 'subscriptionPlan'>>) => {
    try {
      setMessage('');
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      localStorage.setItem('emailForSignIn', email);
      if (brokerInfo) {
        localStorage.setItem('brokerInfo', JSON.stringify(brokerInfo));
      }
      setMessage('Check your email! We sent you a secure login link.');
    } catch (error: any) {
      console.error("Error sending login link:", error);
      setMessage(error.message || 'Failed to send login link.');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
        await signOut(auth);
        setCurrentUser(null);
        setUserProfile(null);
        localStorage.removeItem('brokerInfo');
        setMessage('Successfully signed out.');
    } catch (error) {
        console.error("Error signing out: ", error);
        setMessage("Failed to sign out.");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);

      if (fbUser) {
        const savedBrokerInfoString = localStorage.getItem('brokerInfo');
        const brokerInfo = savedBrokerInfoString ? JSON.parse(savedBrokerInfoString) : {};
        const newTrialDurationDays = 3;
        const newTrialExpiresAt = new Date(Date.now() + newTrialDurationDays * 24 * 60 * 60 * 1000);

        const profileForContext: AppUserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          brokerName: brokerInfo.brokerName || fbUser.displayName || 'New Broker',
          company: brokerInfo.company || 'New Company',
          phone: brokerInfo.phone || '(000) 000-0000',
          subscriptionStatus: 'trial',
          subscriptionPlan: brokerInfo.plan || 'starter',
          trialExpiresAt: newTrialExpiresAt.toISOString(),
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          monthlySearchesUsed: 0,
          monthlySearchLimit: 999
        };

        setUserProfile(profileForContext);
        console.log("AuthContext: User profile set in context:", profileForContext);

        if (localStorage.getItem('justSignedInViaLink') === 'true') {
          localStorage.removeItem('justSignedInViaLink');
          localStorage.removeItem('brokerInfo');

          const selectedPlan: 'starter' | 'pro' = brokerInfo.plan || 'starter';
          const redirectUrl = STRIPE_PAYMENT_LINKS[selectedPlan];
          console.log(`Redirecting to Stripe Checkout for plan: ${selectedPlan}`, redirectUrl);

          window.location.href = redirectUrl;
          return;
        }
      } else {
        setUserProfile(null);
        localStorage.removeItem('brokerInfo');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleEmailLinkSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        setLoading(true);
        let email = localStorage.getItem('emailForSignIn');
  
        if (!email) {
          email = window.prompt('Please confirm your email to complete sign-in:');
        }
  
        if (email) {
          try {
            await signInWithEmailLink(auth, email, window.location.href);
  
            // Set the flag so onAuthStateChanged knows to redirect to Stripe
            localStorage.setItem('justSignedInViaLink', 'true');
  
            // Clean up
            localStorage.removeItem('emailForSignIn');
  
            // ✅ Let onAuthStateChanged handle the redirect
            if (window.history.replaceState) {
              window.history.replaceState(null, '', '/app');
            } else {
              window.location.href = '/app';
            }
  
            console.log('✅ Email link sign-in complete. Flag set for Stripe redirect.');
  
          } catch (error: any) {
            console.error('❌ Failed to complete email link sign-in:', error);
            setMessage('Sign-in failed. Please try again.');
          } finally {
            setLoading(false);
          }
        } else {
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
    </AuthContext.Provider>
  );
}
