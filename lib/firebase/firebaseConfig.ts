import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAVv87CM48pu5ZIPDjoJbgya7jccWfLjjs",
  authDomain: "gestor-clinica-76c03.firebaseapp.com",
  projectId: "gestor-clinica-76c03",
  storageBucket: "gestor-clinica-76c03.firebasestorage.app",
  messagingSenderId: "833038267545",
  appId: "1:833038267545:web:ec15e0a5a9570cfe15b408"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
