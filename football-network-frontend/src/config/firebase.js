import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxCSdN4NBQYFZFEuMQlzfzXIWHKzKxNEU",
  authDomain: "koppafoot.firebaseapp.com",
  projectId: "koppafoot",
  storageBucket: "koppafoot.firebasestorage.app",
  messagingSenderId: "234916872903",
  appId: "1:234916872903:web:dc3f28da6140c699a874e2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
