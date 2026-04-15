import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import { db } from "../lib/firebase";

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Alert {
  id: string;
  type: string;
  message: string;
  location: string;
  severity: Severity;
  timestamp: any;
}

export const subscribeToAlerts = (
  onUpdate: (alerts: Alert[]) => void, 
  onError?: (error: any) => void
) => {
  try {
    const q = query(
      collection(db, "alerts_stream"), 
      orderBy("firestore_created_at", "desc"),
      limit(20)
    );
    
    return onSnapshot(q, (snapshot) => {
      const alerts: Alert[] = snapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          type: data.type || 'Undefined Threat',
          message: data.message || 'No log data provided',
          location: data.location || 'Unknown Node',
          severity: data.severity || 'LOW',
          timestamp: data.firestore_created_at || new Date()
        } as Alert;
      });
      onUpdate(alerts);
    }, (err: any) => {
      console.error("[SOC_LINK_FAILURE]:", err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.error("[SOC_INIT_FAILURE]:", err);
  }
};
