import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDIhOyR0bWPF-YbzJ4WqHeuNB6kLAgJH-M",
    authDomain: "pokemontcgptrading-e347b.firebaseapp.com",
    projectId: "pokemontcgptrading-e347b",
    storageBucket: "pokemontcgptrading-e347b.firebasestorage.app",
    messagingSenderId: "230422548433",
    appId: "1:230422548433:web:b5d1583f5450b898ed5af0",
    measurementId: "G-YF0CK1SELY"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider(); 