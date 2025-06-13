import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, sendSignInLinkToEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

type AppUserProfile = {
  uid: string;
  email: string | null;
  brokerName: string;
  company: string;
  phone: string;
  subscriptionStatus: string;
  subscriptionPlan: string;
  trialExpiresAt: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  monthlySearchesUsed: number;
  monthlySearchLimit: number;
};

type AuthContextType = {
  currentUser: any;
  userProfile: AppUserProfile | null;
  loading: boolean;
  showPaywall: boolean;
  user: any;
  logout: () => Promise<void>;
  sendLoginLink: (email: string) => Promise<void>;
  message: string | null;
};

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  showPaywall: false,
  user: null,
  logout: async () => {},
  sendLoginLink: async () => {},
  message: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);

      if (fbUser) {
        const userDoc = await getDoc(doc(db, "users", fbUser.uid));
        let profile: AppUserProfile;

        if (userDoc.exists()) {
          profile = userDoc.data() as AppUserProfile;
          
          // 🔍 DEBUG: Log what's actually in Firestore
          console.log("🔍 User profile from Firestore:", {
            email: profile.email,
            subscriptionStatus: profile.subscriptionStatus,
            subscriptionPlan: profile.subscriptionPlan,
            trialExpiresAt: profile.trialExpiresAt,
            stripeCustomerId: profile.stripeCustomerId,
            stripeSubscriptionId: profile.stripeSubscriptionId,
            trialExpiryDate: new Date(profile.trialExpiresAt),
            currentDate: new Date(),
            trialIsActive: new Date(profile.trialExpiresAt) > new Date()
          });
          
        } else {
          console.log("⚠️ No user document found in Firestore, creating new profile");
          const brokerInfoString = localStorage.getItem("brokerInfo");
          const brokerInfo = brokerInfoString ? JSON.parse(brokerInfoString) : {};
          const newTrialExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

          profile = {
            uid: fbUser.uid,
            email: fbUser.email,
            brokerName: brokerInfo.brokerName || fbUser.displayName || "New Broker",
            company: brokerInfo.company || "New Company",
            phone: brokerInfo.phone || "(000) 000-0000",
            subscriptionStatus: "trial",
            subscriptionPlan: brokerInfo.plan || "starter",
            trialExpiresAt: newTrialExpiresAt.toISOString(),
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            monthlySearchesUsed: 0,
            monthlySearchLimit: 999,
          };
        }

        setUserProfile(profile);

        const trialExpiry = new Date(profile.trialExpiresAt);
        const hasActiveTrial = profile.subscriptionStatus === "trial" && trialExpiry > new Date();
        const hasActiveSubscription = profile.subscriptionStatus === "active";
        const shouldShowPaywall = !(hasActiveSubscription || hasActiveTrial);
        
        // 💳 DEBUG: Log the paywall decision logic
        console.log("💳 Paywall logic:", {
          subscriptionStatus: profile.subscriptionStatus,
          trialExpiry: trialExpiry,
          hasActiveTrial,
          hasActiveSubscription,
          shouldShowPaywall,
          hasStripeCustomerId: !!profile.stripeCustomerId,
          hasStripeSubscriptionId: !!profile.stripeSubscriptionId
        });
        
        setShowPaywall(shouldShowPaywall);
      } else {
        setUserProfile(null);
        localStorage.removeItem("brokerInfo");
        setShowPaywall(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // --- REAL Magic Link Login (No Stubs) ---
  const actionCodeSettings = {
    url: window.location.origin + "/complete-signin", // You MUST have this route set up to finish sign-in!
    handleCodeInApp: true,
  };

  const sendLoginLink = async (email: string) => {
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      setMessage(`Check your email! We sent a login link to ${email}`);
    } catch (err: any) {
      setMessage("Error sending login link: " + err.message);
      console.error(err);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        showPaywall,
        user: currentUser,
        logout,
        sendLoginLink,
        message,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}