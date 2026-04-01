import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Prevent duplicate initialization in Next.js hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Initialize Analytics only in browser (not during SSR)
if (typeof window !== "undefined") {
  isSupported().then(yes => { if (yes) getAnalytics(app); });
}
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Sign in with Google via full-page redirect (no popup).
 * Eliminates COOP/popup-blocker issues entirely.
 * Call getGoogleRedirectResult() on mount to complete the sign-in.
 */
export async function signInWithGoogle(): Promise<void> {
  await signInWithRedirect(auth, googleProvider);
}

/**
 * Call on mount in auth pages to catch users returning from Google redirect.
 * Returns null if there is no pending redirect result.
 */
export async function getGoogleRedirectResult(): Promise<{ idToken: string; displayName: string | null } | null> {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    const idToken = await result.user.getIdToken();
    return { idToken, displayName: result.user.displayName };
  } catch {
    return null;
  }
}

/** Register with email + password via Firebase, then return the ID token. */
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<{ idToken: string; displayName: string }> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  const idToken = await result.user.getIdToken();
  return { idToken, displayName };
}

/** Sign in with email + password via Firebase and return the ID token. */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ idToken: string; displayName: string | null }> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await result.user.getIdToken();
  return { idToken, displayName: result.user.displayName };
}

/** Sign out from Firebase. */
export async function firebaseLogout(): Promise<void> {
  await firebaseSignOut(auth);
}
