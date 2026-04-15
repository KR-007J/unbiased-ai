import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

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

const seed = async () => {
  const alerts = [
    { type: 'Brute Force Attempt', message: 'Detected 500+ failed login attempts from IP 192.168.1.105 targeting SSH.', location: 'Edge Node Gamma', severity: 'HIGH' },
    { type: 'DDoS Vector Neutralized', message: 'Incoming traffic spike of 40Gbps mitigated by cloud scrubbers.', location: 'Global Ingress 01', severity: 'CRITICAL' },
    { type: 'File Integrity Breach', message: 'Unauthorized change detected in /etc/shadow on secondary database cluster.', location: 'DB Cluster Beta', severity: 'HIGH' },
    { type: 'System Update', message: 'Node kernel successfully patched to v5.15.0-SOC.', location: 'Core Services', severity: 'LOW' }
  ];

  for (const alert of alerts) {
    await addDoc(collection(db, "alerts_stream"), {
      ...alert,
      firestore_created_at: serverTimestamp(),
      created_at: new Date().toISOString()
    });
    console.log(`Pushed: ${alert.type}`);
  }
};

seed();
