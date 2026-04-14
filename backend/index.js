const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
app.use(require('cors')());
app.use(express.json());

const { SUPABASE_URL, SUPABASE_KEY, FIREBASE_SERVICE_ACCOUNT, PORT = 5000 } = process.env;

// Initialize Supabase (Primary Source)
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Initialize Firebase Admin (Real-time Broadcaster)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT))
  });
}
const firestore = admin.firestore();

const VALID_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

app.post('/alerts', async (req, res) => {
  const { type, location, severity, message } = req.body;
  const normalizedSeverity = severity?.toUpperCase();

  if (!type || !location || !VALID_SEVERITIES.includes(normalizedSeverity)) {
    return res.status(400).json({ error: "Missing required fields or invalid severity level." });
  }

  try {
    const isoTimestamp = new Date().toISOString();

    // 1. Supabase (PostgreSQL Persistence)
    const { data: sbData, error: sbError } = await supabase
      .from('alerts')
      .insert([{ type, location, severity: normalizedSeverity, message, created_at: isoTimestamp }])
      .select();

    if (sbError) throw new Error(sbError.message);

    // 2. Firestore (Real-time Stream Broadcast)
    await firestore.collection('alerts_stream').add({
      type,
      location,
      severity: normalizedSeverity,
      message,
      created_at: isoTimestamp,
      firestore_created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({ status: "success", data: sbData[0] });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.get('/alerts', async (req, res) => {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/health', (req, res) => res.status(200).send('HEALTHY'));

app.listen(PORT, () => console.log(`Sentinel-X Backend active on PORT ${PORT}`));
