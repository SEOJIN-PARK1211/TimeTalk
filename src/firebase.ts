import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDxUqzqggqc7SO9KqhUsOH7mWOMtx-Y8GA",
  authDomain: "timetalk-ed359.firebaseapp.com",
  projectId: "timetalk-ed359",
  storageBucket: "timetalk-ed359.firebasestorage.app",
  messagingSenderId: "725253753979",
  appId: "1:725253753979:web:568b262e0594495846e6de",
  measurementId: "G-LX9K0HL4N0"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
