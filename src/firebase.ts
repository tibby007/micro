import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCsfpF-CFNx45CDJ1OggQJqbEw54YbPPfA",
  authDomain: "micro-site-212a0.firebaseapp.com",
  projectId: "micro-site-212a0",
  storageBucket: "micro-site-212a0.firebasestorage.app",
  messagingSenderId: "364253352609",
  appId: "1:364253352609:web:e3df69766086b0afd356e0",
  measurementId: "G-BX09ZG3CX7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const firestore = db; // ADD THIS FOR BACKWARD COMPATIBILITY

export const STRIPE_PUBLISHABLE_KEY = "pk_live_51NMtedB1YJBVEg8wcVl97PdHHsg7l0Hk3QB62klCxn3LocrMKncABtNvmjfwUEj3bhL7Du6uNEJYTdfbtB2mePsF00glVcxgKu";
