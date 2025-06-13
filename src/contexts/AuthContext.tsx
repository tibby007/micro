import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

// ===== TYPE DEFINITIONS =====
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
};

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  showPaywall: false,
});

// ===== CONTEXT PROVIDER =====
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);

      if (fbUser) {
        // Fetch user profile from Firestore if it exists
        const userDoc = await getDoc(doc(db, "users", fbUser.uid));
        let profile: AppUserProfile;

        if (userDoc.exists()) {
          profile = userDoc.data() as AppUserProfile;
        } else {
          // Fallback to dummy info for new users
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

        // -- PAYWALL LOGIC --
        const trialExpiry = new Date(profile.trialExpiresAt);
        const hasActiveTrial = profile.subscriptionStatus === "trial" && trialExpiry > new Date();
        const hasActiveSubscription = profile.subscriptionStatus === "active";
        setShowPaywall(!(hasActiveSubscription || hasActiveTrial));
      } else {
        setUserProfile(null);
        localStorage.removeItem("brokerInfo");
        setShowPaywall(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        showPaywall,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ===== CUSTOM HOOK =====
export function useAuth() {
  return useContext(AuthContext);
}
