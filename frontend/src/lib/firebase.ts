import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  type User,
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

// Key stored in sessionStorage to track a pending Google redirect sign-in.
// sessionStorage survives the redirect but is cleared when the tab closes.
const GOOGLE_PENDING_KEY = "g_auth_redirect_pending";

// ── Google Sign-In ─────────────────────────────────────────────────────────────

/**
 * Start Google sign-in via full-page redirect.
 * Sets a sessionStorage flag so the auth page knows to wait for the result.
 */
export async function signInWithGoogle(): Promise<void> {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(GOOGLE_PENDING_KEY, "1");
  }
  await signInWithRedirect(auth, googleProvider);
}

/**
 * Called on mount in auth pages.
 * If a Google redirect is pending, waits for Firebase to sign the user in
 * via onAuthStateChanged and returns their ID token.
 * Returns null immediately if no redirect was pending.
 */
export function waitForGoogleRedirect(
  callback: (result: { idToken: string; displayName: string | null }) => void,
  onError: () => void,
): (() => void) | null {
  if (typeof window === "undefined") return null;
  if (!sessionStorage.getItem(GOOGLE_PENDING_KEY)) return null;

  // Flag is present — user is returning from Google redirect.
  // Firebase will automatically sign them in and fire onAuthStateChanged.
  const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) return; // Firebase fires null first, then the signed-in user
    sessionStorage.removeItem(GOOGLE_PENDING_KEY);
    unsubscribe();
    try {
      const idToken = await user.getIdToken();
      callback({ idToken, displayName: user.displayName });
    } catch {
      onError();
    }
  });

  // Safety timeout: if Firebase never resolves in 15s, clean up
  const timer = setTimeout(() => {
    unsubscribe();
    sessionStorage.removeItem(GOOGLE_PENDING_KEY);
    onError();
  }, 15000);

  return () => {
    unsubscribe();
    clearTimeout(timer);
  };
}

// ── Email auth ─────────────────────────────────────────────────────────────────

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<{ idToken: string; displayName: string }> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  const idToken = await result.user.getIdToken();
  return { idToken, displayName };
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<{ idToken: string; displayName: string | null }> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await result.user.getIdToken();
  return { idToken, displayName: result.user.displayName };
}

export async function firebaseLogout(): Promise<void> {
  await firebaseSignOut(auth);
}
