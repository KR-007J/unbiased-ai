import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Subscribes to the Sentinel-X real-time event stream.
 */
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
          // Safe date resolution: Firestore native object -> JS Date
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
