import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB1VBR_jWmCJUZOszy4pxauwHeCrV-M6_o",
  authDomain: "sentinel-x-hq-core-110788.firebaseapp.com",
  projectId: "sentinel-x-hq-core-110788",
  storageBucket: "sentinel-x-hq-core-110788.firebasestorage.app",
  messagingSenderId: "290759059169",
  appId: "1:290759059169:web:0db6f8c402af670f4d39a0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
