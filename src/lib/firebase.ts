import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": "studio-7167098775-c79db",
  "appId": "1:761456408943:web:dd518a69298c232aa4509a",
  "apiKey": "AIzaSyB0S3U9qOR1C4UMvyrlgLRjnEUsjqVomLY",
  "authDomain": "studio-7167098775-c79db.firebaseapp.com",
  "measurementId": "761456408943",
  "messagingSenderId": "761456408943"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
