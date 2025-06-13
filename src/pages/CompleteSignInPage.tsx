import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailLink } from "firebase/auth";

export default function CompleteSignInPage() {
  const [status, setStatus] = useState("Processing sign-in...");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's a sign-in link in the URL
    if (auth.isSignInWithEmailLink(window.location.href)) {
      // Get email from localStorage or prompt
      let email = window.localStorage.getItem("emailForSignIn");
      if (!email) {
        email = window.prompt("Please provide your email for confirmation:");
      }
      if (!email) {
        setStatus("No email found. Please try signing in again.");
        return;
      }

      // Complete sign-in
      signInWithEmailLink(auth, email, window.location.href)
        .then((result) => {
          window.localStorage.removeItem("emailForSignIn");
          setStatus("Sign-in successful! Redirecting...");
          setTimeout(() => {
            navigate("/app");
          }, 1500);
        })
        .catch((error) => {
          setStatus("Error completing sign-in: " + error.message);
        });
    } else {
      setStatus("Invalid sign-in link. Please try again.");
    }
  }, [navigate]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui,sans-serif"
    }}>
      <div style={{
        background: "#fff", padding: 36, borderRadius: 12, boxShadow: "0 2px 16px rgba(0,0,0,0.07)"
      }}>
        <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 14 }}>Sign-In</h2>
        <div>{status}</div>
      </div>
    </div>
  );
}
