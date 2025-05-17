import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';

export const signIn = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
export const signUp = (email: string, password: string) => createUserWithEmailAndPassword(auth, email, password);
export const resetPassword = async (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };
export const logout = () => signOut(auth);
