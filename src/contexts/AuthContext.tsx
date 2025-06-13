import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
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
        } else {
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

  // --- STUBS for backward compatibility ---
  const logout = async () => {
    await signOut(auth);
  };

  const sendLoginLink = async (email: string) => {
    // Implement your login link logic here if needed.
    setMessage("Login link sent! (stub)");
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
