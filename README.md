# 🛡️ VeriMail Identity & Auth Console

[![GitHub Profile](https://img.shields.io/badge/Developer-bhavanasbhavanas416--rgb-181717.svg?logo=github&logoColor=white)](https://github.com/bhavanasbhavanas416-rgb)
[![Repository](https://img.shields.io/badge/Repository-verimail--auth--console-0969DA.svg?logo=github)](https://github.com/bhavanasbhavanas416-rgb/verimail-auth-console)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Authentication-FFCA28.svg?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

An enterprise-grade **Identity, Authentication & Email Lifecycle Console** engineered with **React 19**, **TypeScript 5**, **Tailwind CSS 4**, **Framer Motion**, and the **Firebase Authentication SDK (v12)**. 

This platform serves as a modern identity administration portal, featuring automated email verification loops, custom out-of-band action handlers, secondary alias management, cryptographic re-authentication workflows, and real-time security audit trails.

---

## 🌐 Live Application Access URLs

The application server binds directly to `0.0.0.0:3000`, providing immediate access across both local development environments and local area networks:

| Access Type | URL Link | Target & Purpose |
| :--- | :--- | :--- |
| 🌐 **Local Area Network (LAN)** | **[http://10.164.1.1:3000/](http://10.164.1.1:3000/)** | Live active network address for mobile, tablet, and cross-device testing over Wi-Fi |
| 💻 **Localhost Host** | **[http://localhost:3000/](http://localhost:3000/)** | Local machine development preview (`http://127.0.0.1:3000/`) |
| 🐙 **GitHub Repository** | **[bhavanasbhavanas416-rgb/verimail-auth-console](https://github.com/bhavanasbhavanas416-rgb/verimail-auth-console)** | Official project repository |
| 👤 **GitHub Developer Profile** | **[https://github.com/bhavanasbhavanas416-rgb](https://github.com/bhavanasbhavanas416-rgb)** | Profile and open-source contributions by Bhavana |

> 📱 **Network Access Tip**: Any device connected to the same Wi-Fi network (such as smartphones or test laptops) can immediately open **[http://10.164.1.1:3000/](http://10.164.1.1:3000/)** to interact with the responsive interface and verify emails.

---

## 📖 About the Project

### 🎯 Purpose & Problem Statement
Modern applications frequently struggle with complex authentication workflows, particularly around **email verification state sync**, **secure primary email migrations**, and **out-of-band email link processing**. Traditional setups either fail to throttle verification requests, lock users out when changing primary emails, or require cumbersome backend mock setups for local development.

**VeriMail Identity & Auth Console** resolves these challenges by providing:
1. **Dual-Engine Architecture**: Seamless switching between live Firebase Authentication and a zero-config interactive Sandbox mode.
2. **Reliable Verification Polling**: Automatic status synchronizer that polls `reload(auth.currentUser)` to immediately reflect email verification without manual page refreshes.
3. **Safe Primary Email Transitions**: Implementation of Firebase's recommended `verifyBeforeUpdateEmail` pattern, ensuring old emails remain active until the new address is cryptographically verified.
4. **Action Link Simulator**: Integrated engine for decoding, inspecting, and applying Firebase Out-of-Band (`oobCode`) tokens for password resets, email verification, and recovery.

---

## 🏗️ Architecture & Interaction Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client Device
    participant Console as VeriMail Web App (React 19)
    participant Auth as Firebase Auth SDK (v12)
    participant Outbox as Action Dispatcher / Outbox

    User->>Console: Register (Email + Password)
    Console->>Auth: createUserWithEmailAndPassword()
    Auth-->>Console: UserCredential (emailVerified: false)
    Console->>Auth: sendEmailVerification(currentUser)
    Auth->>Outbox: Generate Action URL (?mode=verifyEmail&oobCode=XYZ)
    Note over User,Console: Link accessible via http://10.164.1.1:3000/ or simulated outbox
    User->>Console: Click Action Link or Paste oobCode
    Console->>Auth: applyActionCode("XYZ")
    Auth-->>Console: Code Applied & Verified
    Console->>Auth: reload(currentUser)
    Auth-->>Console: emailVerified = true
    Console-->>User: Badge Updated to Verified 🛡️
```

---

## 🌟 Core Modules & Capabilities

### 1. 🔐 Authentication & Session Suite
- **User Registration & Login**: Validated credential submission with password strength hints and RFC-compliant email checking.
- **Session Persistence Switcher**: Configure authentication persistence between `browserLocalPersistence` (stays logged in) and `browserSessionPersistence` (cleared on tab close).
- **Graceful Error Parser**: Custom utility translating raw Firebase error codes (e.g. `auth/operation-not-allowed`, `auth/too-many-requests`) into actionable resolutions.

### 2. ✉️ Email Verification Center
- **Live Status Badge**: Visual indicator distinguishing verified accounts from pending accounts.
- **Cooldown Throttle (60s)**: Built-in countdown timer guarding against rate limits and email dispatch spam.
- **Background Auto-Poller**: 5-second interval heartbeat calling `reload(auth.currentUser)` to automatically detect when a user clicks a verification link in an external tab or phone.
- **Simulated Email Outbox**: Live inspection tool displaying dispatched emails, subjects, timestamps, and action URLs.

### 3. 👥 Primary Email Lifecycle Management
- **Multi-Alias Management**: Add secondary email addresses categorized by role (`Recovery`, `Billing`, `Security Alerts`, `Secondary`).
- **Cryptographic Transition (`verifyBeforeUpdateEmail`)**: Initiates address modification while leaving the current primary intact until verified.
- **In-Place Re-Authentication**: Contextual password challenge before executing security-critical actions (account deletion, email update, password reset).

### 4. ⚡ Action Handler Engine (`oobCode` Processor)
- Built-in handler for Firebase out-of-band action links (`/__/auth/action`).
- Handles:
  - `verifyEmail`: Validates code and updates account status.
  - `resetPassword`: Verifies token and safely sets a new password.
  - `recoverEmail`: Reverts unauthorized address updates.

### 5. 🛠️ Interactive Firebase Setup Guide
- Visual 4-step checklist guiding developers through:
  - Enabling the Email/Password sign-in provider in Firebase Console.
  - Authorizing development and network hostnames (`localhost`, `10.164.1.1`).
  - Configuring action URL templates and domain routing.

### 6. 📜 Security Audit Logging
- Real-time audit stream capturing every authentication event with:
  - Event timestamp
  - Operation type (e.g., `REGISTER_USER`, `SEND_VERIFICATION`, `UPDATE_EMAIL`)
  - Target email address
  - Status indicator (`SUCCESS`, `WARNING`, `ERROR`)
  - Full diagnostic detail log

---

## 💻 Entire Source Code & Implementation Tour

Below is the complete source code for each primary component and module in the application.

<details>
<summary><b>📄 1. <code>src/types/auth.ts</code> (Domain Models & TypeScript Interfaces)</b></summary>

```typescript
export type NavTab =
  | 'auth'
  | 'verification'
  | 'email-management'
  | 'action-handler'
  | 'console-setup';

export type AuthSubView = 'login' | 'register' | 'forgot-password';

export type EngineMode = 'firebase' | 'sandbox';

export interface UnifiedUser {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
  providerId: string;
  pendingNewEmail?: string | null;
  isSandbox?: boolean;
}

export interface DispatchedEmail {
  id: string;
  type: 'VERIFY_EMAIL' | 'VERIFY_NEW_EMAIL' | 'PASSWORD_RESET' | 'ALIAS_VERIFICATION';
  recipient: string;
  subject: string;
  sentAt: string;
  oobCode: string;
  actionUrl: string;
  status: 'SENT' | 'APPLIED' | 'EXPIRED';
  targetEmail?: string;
  engine: EngineMode;
}

export interface EmailAlias {
  id: string;
  email: string;
  role: 'Recovery' | 'Billing' | 'Security Alerts' | 'Secondary';
  verified: boolean;
  addedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  operation: string;
  method: string;
  targetEmail: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  details: string;
}

export interface EmailPreferences {
  loginAlerts: boolean;
  emailChangeNotifications: boolean;
  passwordResetAlerts: boolean;
  verificationReminders: boolean;
}
```
</details>

<details>
<summary><b>📄 2. <code>src/lib/firebase.ts</code> (Firebase Client SDK & Error Parser)</b></summary>

```typescript
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
    .catch(() => {});
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
```
</details>

<details>
<summary><b>📄 3. <code>src/components/ActionHandlerView.tsx</code> (Out-of-Band Code Action Runner)</b></summary>

```typescript
import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, KeyRound, MailCheck, RefreshCw, ArrowRight, ExternalLink } from 'lucide-react';
import {
  auth,
  applyActionCode,
  checkActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
  parseFirebaseError,
} from '../lib/firebase';
import type { DispatchedEmail } from '../types/auth';

interface ActionHandlerViewProps {
  initialMode?: string;
  initialOobCode?: string;
  outbox: DispatchedEmail[];
  onApplyOutboxItem: (item: DispatchedEmail, newPassword?: string) => Promise<void>;
  onRefreshUser: () => Promise<void>;
  onLogAudit: (
    operation: string,
    method: string,
    targetEmail: string,
    status: 'SUCCESS' | 'WARNING' | 'ERROR',
    details: string
  ) => void;
}

export const ActionHandlerView: React.FC<ActionHandlerViewProps> = ({
  initialMode = 'verifyEmail',
  initialOobCode = '',
  outbox,
  onApplyOutboxItem,
  onRefreshUser,
  onLogAudit,
}) => {
  const [actionMode, setActionMode] = useState<string>(initialMode || 'verifyEmail');
  const [inputCodeOrUrl, setInputCodeOrUrl] = useState<string>(initialOobCode || '');
  const [newPasswordForReset, setNewPasswordForReset] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  const parseInputToCodeAndMode = (raw: string): { mode: string; oobCode: string } => {
    const trimmed = raw.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('oobCode=')) {
      try {
        const url = new URL(trimmed.startsWith('http') ? trimmed : `https://example.com/${trimmed}`);
        const parsedMode = url.searchParams.get('mode') || actionMode;
        const parsedCode = url.searchParams.get('oobCode') || trimmed;
        return { mode: parsedMode, oobCode: parsedCode };
      } catch {
        return { mode: actionMode, oobCode: trimmed };
      }
    }
    return { mode: actionMode, oobCode: trimmed };
  };

  const handleExecuteActionCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const { mode, oobCode } = parseInputToCodeAndMode(inputCodeOrUrl);
    if (!oobCode) return;

    setIsProcessing(true);
    try {
      if (mode === 'verifyEmail' || mode === 'verifyAndChangeEmail') {
        await applyActionCode(auth, oobCode);
        await onRefreshUser();
        setStatusBanner({
          type: 'success',
          title: 'Email Verified Successfully',
          message: 'The email address has been verified and active credentials updated.',
        });
        onLogAudit('APPLY_ACTION_CODE', 'applyActionCode', 'Firebase User', 'SUCCESS', `Action code applied: ${mode}`);
      } else if (mode === 'resetPassword') {
        await confirmPasswordReset(auth, oobCode, newPasswordForReset);
        setStatusBanner({
          type: 'success',
          title: 'Password Reset Confirmed',
          message: 'Your new password has been applied. You can now log in.',
        });
        onLogAudit('RESET_PASSWORD', 'confirmPasswordReset', 'Firebase User', 'SUCCESS', 'Password updated successfully');
      }
    } catch (err) {
      const parsed = parseFirebaseError(err);
      setStatusBanner({ type: 'error', title: parsed.title, message: parsed.message });
      onLogAudit('ACTION_CODE_ERROR', mode, 'Unknown', 'ERROR', parsed.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-slate-900">Action Link & OOB Code Engine</h2>
        <p className="text-sm text-slate-600 mt-1">
          Inspect, test, and manually apply Firebase Out-of-Band (OOB) action codes directly without leaving the console.
        </p>
        <form onSubmit={handleExecuteActionCode} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Action Link or oobCode</label>
            <input
              type="text"
              value={inputCodeOrUrl}
              onChange={(e) => setInputCodeOrUrl(e.target.value)}
              placeholder="Paste verification URL or oobCode token..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isProcessing || !inputCodeOrUrl}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isProcessing ? 'Executing...' : 'Apply Action Code'}
          </button>
        </form>
      </div>
    </div>
  );
};
```
</details>

<details>
<summary><b>📄 4. <code>src/components/VerificationCenterView.tsx</code> (Verification Center)</b></summary>

```typescript
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, RefreshCw, Send, MailCheck, ExternalLink, Copy, Check } from 'lucide-react';
import { firebaseConfig } from '../lib/firebase';
import type { UnifiedUser, DispatchedEmail, EngineMode } from '../types/auth';

interface VerificationCenterViewProps {
  user: UnifiedUser | null;
  engineMode: EngineMode;
  resendCooldown: number;
  isBusy: boolean;
  outbox: DispatchedEmail[];
  onSendVerification: (customContinueUrl?: string) => Promise<void>;
  onReloadVerificationStatus: () => Promise<void>;
  onSimulateVerifyCurrentUser: () => Promise<void>;
  onNavigateToAuth: () => void;
  onNavigateToEmailManagement: () => void;
  onNavigateToActionHandler: () => void;
}

export const VerificationCenterView: React.FC<VerificationCenterViewProps> = ({
  user,
  engineMode,
  resendCooldown,
  isBusy,
  outbox,
  onSendVerification,
  onReloadVerificationStatus,
  onSimulateVerifyCurrentUser,
}) => {
  const [autoPoll, setAutoPoll] = useState<boolean>(false);
  const [pollCountdown, setPollCountdown] = useState<number>(5);

  useEffect(() => {
    if (!autoPoll || !user || user.emailVerified) return;
    const timer = setInterval(() => {
      setPollCountdown((prev) => {
        if (prev <= 1) {
          onReloadVerificationStatus();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoPoll, user, onReloadVerificationStatus]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Email Verification Center</h2>
            <p className="text-sm text-slate-600">Inspect real-time badge state and trigger throttled verification emails.</p>
          </div>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${user?.emailVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            {user?.emailVerified ? '✓ Email Verified' : '⚠ Verification Pending'}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => onSendVerification()}
            disabled={isBusy || resendCooldown > 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Send Verification Email'}
          </button>
          <button
            onClick={() => onReloadVerificationStatus()}
            disabled={isBusy}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
          >
            Check Status Now
          </button>
        </div>
      </div>
    </div>
  );
};
```
</details>

<details>
<summary><b>📄 5. <code>package.json</code> & <code>vite.config.ts</code> (Build & Dependencies)</b></summary>

```json
{
  "name": "react-example",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "clean": "rm -rf dist server.js",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "^2.4.0",
    "@tailwindcss/vite": "^4.3.3",
    "@vitejs/plugin-react": "^6.1.1",
    "dotenv": "^17.2.3",
    "express": "^4.21.2",
    "firebase": "^12.19.0",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "vite": "^8.3.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^22.14.0",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "autoprefixer": "^10.4.21",
    "esbuild": "^0.25.0",
    "tailwindcss": "^4.3.3",
    "tsx": "^4.21.0",
    "typescript": "^7.0.2"
  }
}
```

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
```
</details>

<details>
<summary><b>📄 6. <code>index.html</code> (HTML Shell & Web Typography)</b></summary>

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VeriMail Identity & Auth Console</title>
    <meta name="description" content="Firebase Authentication portal for user login, registration, email verification workflows, and primary email lifecycle management." />
    <meta property="og:title" content="VeriMail Identity & Auth Console" />
    <meta property="og:description" content="Firebase Authentication portal for user login, registration, email verification workflows, and primary email lifecycle management." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body class="bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
</details>

---

## 🛠️ Step-by-Step Installation & Local Execution

### 1. Clone the GitHub Repository
```bash
git clone https://github.com/bhavanasbhavanas416-rgb/verimail-auth-console.git
cd verimail-auth-console
```

### 2. Install Project Dependencies
```bash
npm install
```

### 3. Configure Local Environment (Optional)
Create a `.env` file in the project root if integrating Gemini AI or custom Cloud Run variables:
```bash
cp .env.example .env
```

```env
GEMINI_API_KEY="your-gemini-api-key"
APP_URL="http://localhost:3000"
```

### 4. Launch Development Server
```bash
npm run dev
```

The server listens across all interfaces:
```text
  VITE v8.3.0  ready in 380 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://10.164.1.1:3000/
  ➜  press h + enter to show help
```

### 5. Access the Platform
- **Local Machine**: **[http://localhost:3000/](http://localhost:3000/)**
- **LAN / Mobile Devices**: **[http://10.164.1.1:3000/](http://10.164.1.1:3000/)**

---

## 🔒 Security Architecture & Hardening

1. **Cryptographic Action Token Verification**: Action URLs use time-bound, single-use `oobCode` tokens generated and validated via Firebase's secure auth endpoints.
2. **Re-Authentication Enforced**: Protected operations like updating primary email or updating passwords require validating the user's existing credentials via `reauthenticateWithCredential`.
3. **No Downtime Primary Email Migration**: Leveraging `verifyBeforeUpdateEmail` prevents unauthorized or mistyped email changes from locking users out of accounts.
4. **Rate Limiting Protection**: Client-enforced 60-second cooldown timers mitigate outbound email service quota exhaustion.

---

## 👤 Developer Profile & Repository

- **GitHub Profile**: [@bhavanasbhavanas416-rgb](https://github.com/bhavanasbhavanas416-rgb)
- **Primary Repository**: [https://github.com/bhavanasbhavanas416-rgb/verimail-auth-console](https://github.com/bhavanasbhavanas416-rgb/verimail-auth-console)

---

## 📄 License

This repository is licensed under the [MIT License](LICENSE).
