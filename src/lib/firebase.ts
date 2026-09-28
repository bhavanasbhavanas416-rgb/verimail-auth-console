import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  verifyBeforeUpdateEmail,
  updateEmail,
  updatePassword,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  applyActionCode,
  checkActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
  signOut,
  reload,
  deleteUser,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  type User,
  type ActionCodeInfo,
} from 'firebase/auth';

// User's provided Firebase Configuration
export const firebaseConfig = {
  apiKey: 'AIzaSyCVKRGYBPyNWNdO4JGsQbNOIQKXlcDptKs',
  authDomain: 'cybercrimeai-354c2.firebaseapp.com',
  projectId: 'cybercrimeai-354c2',
  storageBucket: 'cybercrimeai-354c2.firebasestorage.app',
  messagingSenderId: '994267021942',
  appId: '1:994267021942:web:f8918707fa13031b94d557',
  measurementId: 'G-KN7X5KRYN4',
};

// Initialize Firebase App safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Safely initialize Analytics in browser environments that support it
export let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isAnalyticsSupported()
    .then((supported) => {
      if (supported) {
        analyticsInstance = getAnalytics(app);
      }
    })
    .catch(() => {
      // Ignore analytics errors in restricted iframe/sandbox contexts
    });
}

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  verifyBeforeUpdateEmail,
  updateEmail,
  updatePassword,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  applyActionCode,
  checkActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
  signOut,
  reload,
  deleteUser,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  type User,
  type ActionCodeInfo,
};

export interface ParsedFirebaseError {
  code: string;
  title: string;
  message: string;
  requiresConsoleSetup: boolean;
  requiresReauth: boolean;
}

export function parseFirebaseError(error: unknown): ParsedFirebaseError {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const codeMatch = rawMessage.match(/\((auth\/[^)]+)\)/);
  const code =
    (error as { code?: string })?.code || (codeMatch ? codeMatch[1] : 'auth/unknown-error');

  switch (code) {
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return {
        code,
        title: 'Email/Password Provider Not Enabled in Console',
        message:
          'The Email/Password authentication provider is currently disabled in Firebase project "cybercrimeai-354c2". Enable it in Firebase Console → Authentication → Sign-in method, or switch to Interactive Sandbox Mode to test immediately.',
        requiresConsoleSetup: true,
        requiresReauth: false,
      };
    case 'auth/email-already-in-use':
      return {
        code,
        title: 'Email Address Already Registered',
        message:
          'An account with this email address already exists in Firebase Auth. Sign in with your password or request a password reset link.',
        requiresConsoleSetup: false,
        requiresReauth: false,
      };
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return {
        code,
        title: 'Invalid Email or Password',
        message:
          'The email address or password you entered did not match our records. Verify your credentials or reset your password.',
        requiresConsoleSetup: false,
        requiresReauth: false,
      };
    case 'auth/weak-password':
      return {
        code,
        title: 'Password Does Not Meet Security Policy',
        message:
          'Firebase Auth requires passwords to be at least 6 characters long. We recommend 8+ characters with mixed case and numbers.',
        requiresConsoleSetup: false,
        requiresReauth: false,
      };
    case 'auth/invalid-email':
      return {
        code,
        title: 'Malformed Email Address',
        message: 'Please provide a valid RFC-compliant email address (e.g. name@domain.com).',
        requiresConsoleSetup: false,
        requiresReauth: false,
      };
    case 'auth/requires-recent-login':
      return {
        code,
        title: 'Re-authentication Required',
        message:
          'Changing your primary email, password, or deleting your account is a security-sensitive operation. Please enter your current password to re-authenticate.',
        requiresConsoleSetup: false,
        requiresReauth: true,
      };
    case 'auth/too-many-requests':
      return {
        code,
        title: 'Rate Limit Reached',
        message:
          'Firebase has temporarily throttled requests from this device due to repeated attempts. Please wait a minute before retrying.',
        requiresConsoleSetup: false,
        requiresReauth: false,
      };
    case 'auth/invalid-action-code':
    case 'auth/expired-action-code':
      return {
        code,
        title: 'Invalid or Expired Verification Code',
        message:
          'The action code (oobCode) has already been used, expired, or is malformed. Request a fresh verification or password reset email.',
        requiresConsoleSetup: false,
        requiresReauth: false,
      };
    case 'auth/unauthorized-domain':
      return {
        code,
        title: 'Domain Not Authorized in Firebase Console',
        message:
          'Add this application domain to Firebase Console → Authentication → Settings → Authorized domains for redirect action URLs.',
        requiresConsoleSetup: true,
        requiresReauth: false,
      };
    default:
      return {
        code,
        title: 'Firebase Authentication Error',
        message: rawMessage.replace(/^Firebase:\s*/i, ''),
        requiresConsoleSetup:
          rawMessage.includes('CONFIGURATION_NOT_FOUND') ||
          rawMessage.includes('OPERATION_NOT_ALLOWED'),
        requiresReauth: false,
      };
  }
}
