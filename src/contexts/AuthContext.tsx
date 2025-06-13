import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, sendSignInLinkToEmail } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, limit, getDocs, deleteDoc } from "firebase/firestore";
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
        console.log('🔍 Looking for user with UID:', fbUser.uid, 'and email:', fbUser.email);
        
        // First try to find by UID (existing users)
        let userDoc = await getDoc(doc(db, "users", fbUser.uid));
        let profile: AppUserProfile;

        if (userDoc.exists()) {
          console.log('✅ Found user document by UID');
          profile = userDoc.data() as AppUserProfile;
          
          // 🔍 DEBUG: Log what's actually in Firestore
          console.log("🔍 User profile from Firestore (via UID):", {
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
          console.log('❌ No document found by UID, trying email query...');
          // If not found by UID, try querying by email (webhook-created users)
          const emailQuery = query(collection(db, 'users'), where('email', '==', fbUser.email), limit(1));
          const emailSnapshot = await getDocs(emailQuery);
          
          if (!emailSnapshot.empty) {
            console.log('✅ Found user document by email query');
            const emailDoc = emailSnapshot.docs[0];
            profile = emailDoc.data() as AppUserProfile;
            
            // 🔍 DEBUG: Log what's actually in Firestore
            console.log("🔍 User profile from Firestore (via email):", {
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
            
            // Copy the document to the correct UID-based location and delete the old one
            await setDoc(doc(db, "users", fbUser.uid), profile);
            await deleteDoc(emailDoc.ref);
            console.log('✅ Migrated user document to correct UID location');
            
          } else {
            console.log("⚠️ No user document found anywhere, creating new profile");
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
        }

        setUserProfile(profile);

        const trialExpiry = new Date(profile.trialExpiresAt);
        const hasActiveTrial = profile.subscriptionStatus === "trial" && trialExpiry > new Date();
        const hasActiveSubscription = profile.subscriptionStatus === "active";
        const hasStripeSetup = profile.stripeCustomerId && profile.stripeSubscriptionId;
        
        // NEW LOGIC: Must have Stripe subscription setup (even for trial) to search
        const canSearch = hasStripeSetup && (hasActiveSubscription || hasActiveTrial);
        const shouldShowPaywall = !canSearch;
        
        // 💳 DEBUG: Log the paywall decision logic
        console.log("💳 Paywall logic:", {
          subscriptionStatus: profile.subscriptionStatus,
          trialExpiry: trialExpiry,
          hasActiveTrial,
          hasActiveSubscription,
          hasStripeSetup,
          canSearch,
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