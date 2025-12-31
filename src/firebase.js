import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDtAud0STedW3r8j5fgckvws9_I90rk9jg",
  authDomain: "sidequest-1f1f3.firebaseapp.com",
  projectId: "sidequest-1f1f3",
  storageBucket: "sidequest-1f1f3.firebasestorage.app",
  messagingSenderId: "993950554984",
  appId: "1:993950554984:web:fe21bb976d79abe20654dd"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
