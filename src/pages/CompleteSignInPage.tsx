import React, { useEffect, useState } from 'react';
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

const CompleteSignInPage: React.FC = () => {
  const [status, setStatus] = useState('Completing sign-in...');
  useEffect(() => {
    const auth = getAuth();
    const url = window.location.href;
    let email = window.localStorage.getItem('emailForSignIn') || '';
    if (!email) {
      email = window.prompt('Please provide your email for confirmation');
    }

    if (isSignInWithEmailLink(auth, url) && email) {
      signInWithEmailLink(auth, email, url)
        .then(() => {
          setStatus('Sign-in complete! Redirecting...');
          window.localStorage.removeItem('emailForSignIn');
          setTimeout(() => window.location.replace('/app'), 2000);
        })
        .catch(() => setStatus('Failed to complete sign-in.'));
    } else {
      setStatus('Invalid or expired sign-in link.');
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#1e293b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', color: '#1e293b', padding: '2rem', borderRadius: '12px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>{status}</h2>
      </div>
    </div>
  );
};

export default CompleteSignInPage;
