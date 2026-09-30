import { createPublicKey } from "crypto";
import { decodeProtectedHeader, jwtVerify, type JWTPayload } from "jose";

const FIREBASE_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "imgstorage-53e1f";

const CERT_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

type FirebaseClaims = JWTPayload & {
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
};

let cachedCerts: Record<string, string> = {};
let cachedUntil = 0;

async function loadFirebaseCerts(force = false) {
  if (!force && Date.now() < cachedUntil && Object.keys(cachedCerts).length > 0) {
    return cachedCerts;
  }

  const response = await fetch(CERT_URL, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch Firebase public keys: ${response.status}`);
  }

  const certs = (await response.json()) as Record<string, string>;
  cachedCerts = certs;

  const cacheControl = response.headers.get("cache-control") || "";
  const match = cacheControl.match(/max-age=(\\d+)/i);
  const maxAgeSeconds = match ? Number(match[1]) : 3600;
  cachedUntil = Date.now() + Math.max(60, maxAgeSeconds) * 1000;

  return cachedCerts;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseClaims> {
  const { kid, alg } = decodeProtectedHeader(idToken);

  if (!kid || alg !== "RS256") {
    throw new Error("Invalid Firebase ID token header");
  }

  let certs = await loadFirebaseCerts();
  let certificate = certs[kid];

  if (!certificate) {
    certs = await loadFirebaseCerts(true);
    certificate = certs[kid];
  }

  if (!certificate) {
    throw new Error("Firebase signing key not found");
  }

  const publicKey = createPublicKey(certificate);

  const { payload } = await jwtVerify(idToken, publicKey, {
    algorithms: ["RS256"],
    audience: FIREBASE_PROJECT_ID,
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
  });

  if (!payload.sub) {
    throw new Error("Firebase ID token has no subject");
  }

  if (payload.auth_time && payload.auth_time > Math.floor(Date.now() / 1000)) {
    throw new Error("Firebase ID token has an invalid auth_time");
  }

  return payload as FirebaseClaims;
}
