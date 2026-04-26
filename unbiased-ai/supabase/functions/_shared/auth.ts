import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const FIREBASE_PROJECT_ID = "unbiased-ai-krish-6789";
const JWKS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

interface DecodedToken {
  header: any;
  payload: {
    iss: string;
    aud: string;
    auth_time: number;
    user_id: string;
    sub: string;
    iat: number;
    exp: number;
    email?: string;
    email_verified?: boolean;
    firebase: {
      identities: {
        [key: string]: string[];
      };
      sign_in_provider: string;
    };
  };
  signature: Uint8Array;
}

export async function validateFirebaseToken(token: string): Promise<string | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const payload = JSON.parse(new TextDecoder().decode(base64Decode(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))));

    // 1. Check issuer
    if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) {
      console.error("Invalid issuer:", payload.iss);
      return null;
    }

    // 2. Check audience
    if (payload.aud !== FIREBASE_PROJECT_ID) {
      console.error("Invalid audience:", payload.aud);
      return null;
    }

    // 3. Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      console.error("Token expired");
      return null;
    }

    // Note: In a production environment, you should also verify the signature
    // using the public keys from JWKS_URL. For this hackathon implementation,
    // we are focusing on the claims validation and ensuring the user_id extraction.
    
    return payload.sub || payload.user_id;
  } catch (err) {
    console.error("Token validation error:", err);
    return null;
  }
}
