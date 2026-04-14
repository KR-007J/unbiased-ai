import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";

// NEW DEPLOYMENT CONFIG (Sentinel-X HQ)
const firebaseConfig = {
  apiKey: "AIzaSyB1VBR_jWmCJUZOszy4pxauwHeCrV-M6_o",
  authDomain: "sentinel-x-hq-core-110788.firebaseapp.com",
  projectId: "sentinel-x-hq-core-110788",
  storageBucket: "sentinel-x-hq-core-110788.firebasestorage.app",
  messagingSenderId: "290759059169",
  appId: "1:290759059169:web:0db6f8c402af670f4d39a0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const subscribeToAlerts = (onUpdate, onError) => {
  try {
    const q = query(
      collection(db, "alerts_stream"), 
      orderBy("firestore_created_at", "desc"),
      limit(20)
    );
    
    return onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.firestore_created_at?.toDate?.() || new Date(data.created_at)
        };
      });
      onUpdate(alerts);
    }, (err) => {
      console.error("[FIRESTORE ERROR]:", err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.error("[INIT ERROR]:", err);
  }
};
