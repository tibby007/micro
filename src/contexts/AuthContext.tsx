import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, firestore } from "../firebase"; // Adjust if your paths differ

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

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);

      if (fbUser) {
        // Attempt to get brokerInfo from localStorage
        const savedBrokerInfoString = localStorage.getItem("brokerInfo");
        const brokerInfo = savedBrokerInfoString
          ? JSON.parse(savedBrokerInfoString)
          : {};

        // 3-day trial as default, can be overwritten by Firestore profile
        const newTrialDurationDays = 3;
        const newTrialExpiresAt = new Date(
          Date.now() + newTrialDurationDays * 24 * 60 * 60 * 1000
        );

        // First, load the base profile (before Firestore)
        let profileForContext: AppUserProfile = {
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

        // Now, try to get their profile from Firestore (always trust Firestore over localStorage)
        const userRef = doc(firestore, "users", fbUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          profileForContext = {
            ...profileForContext,
            subscriptionStatus: userData.subscriptionStatus || "trial",
            trialExpiresAt: userData.trialExpiresAt
              ? userData.trialExpiresAt.toDate().toISOString()
              : newTrialExpiresAt.toISOString(),
            stripeCustomerId: userData.stripeCustomerId || null,
            stripeSubscriptionId: userData.stripeSubscriptionId || null,
          };
        }

        setUserProfile(profileForContext);

        // --- Subscription status and trial check ---
        const status = profileForContext.subscriptionStatus;
        const trialExpiry = new Date(profileForContext.trialExpiresAt);
        const hasActiveTrial = status === "trial" && trialExpiry > new Date();
        const hasActiveSubscription = status === "active";

        if (hasActiveSubscription || hasActiveTrial) {
          setShowPaywall(false);
        } else {
          setShowPaywall(true);
        }

        // Stripe redirect after magic link sign-in
        if (localStorage.getItem("justSignedInViaLink") === "true") {
          localStorage.removeItem("justSignedInViaLink");
          localStorage.removeItem("brokerInfo");

          const selectedPlan: "starter" | "pro" =
            brokerInfo.plan || "starter";
          const STRIPE_PAYMENT_LINKS: Record<string, string> = {
            starter: process.env.REACT_APP_STRIPE_STARTER_PAYMENT_LINK!,
            pro: process.env.REACT_APP_STRIPE_PRO_PAYMENT_LINK!,
          };

          const redirectUrl = STRIPE_PAYMENT_LINKS[selectedPlan];
          if (redirectUrl) {
            window.location.href = redirectUrl;
            return;
          }
        }
      } else {
        setUserProfile(null);
        localStorage.removeItem("brokerInfo");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Optional: live updates if the Firestore user profile changes
  // (Uncomment if you want real-time paywall updates)
  /*
  useEffect(() => {
    if (currentUser) {
      const userRef = doc(firestore, "users", currentUser.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserProfile((prev) => ({
            ...prev!,
            subscriptionStatus: userData.subscriptionStatus || "trial",
            trialExpiresAt: userData.trialExpiresAt
              ? userData.trialExpiresAt.toDate().toISOString()
              : prev!.trialExpiresAt,
            stripeCustomerId: userData.stripeCustomerId || null,
            stripeSubscriptionId: userData.stripeSubscriptionId || null,
          }));
        }
      });
      return unsubscribe;
    }
  }, [currentUser]);
  */

  return (
    <AuthContext.Provider
      value={{ currentUser, userProfile, loading, showPaywall }}
    >
      {children}
    </AuthContext.Provider>
  );
}
