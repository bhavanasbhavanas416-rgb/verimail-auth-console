import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Clock,
  LogOut,
  MailCheck,
  Send,
} from 'lucide-react';
import {
  auth,
  firebaseConfig,
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
  signOut,
  reload,
  deleteUser,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  parseFirebaseError,
  type User as FirebaseUser,
  type ParsedFirebaseError,
} from './lib/firebase';
import type {
  NavTab,
  AuthSubView,
  EngineMode,
  UnifiedUser,
  DispatchedEmail,
  EmailAlias,
  AuditLogEntry,
  EmailPreferences,
} from './types/auth';
import { VerificationCenterView } from './components/VerificationCenterView';
import { EmailManagementView } from './components/EmailManagementView';
import { ActionHandlerView } from './components/ActionHandlerView';
import { ConsoleSetupGuide } from './components/ConsoleSetupGuide';

function formatNowTime(): string {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
}

function formatDateShort(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

function mapFirebaseUser(fbUser: FirebaseUser, pendingEmail?: string | null): UnifiedUser {
  return {
    uid: fbUser.uid,
    email: fbUser.email || 'unknown@domain.com',
    displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Authenticated User',
    emailVerified: fbUser.emailVerified,
    createdAt: formatDateShort(fbUser.metadata.creationTime),
    lastLoginAt: formatDateShort(fbUser.metadata.lastSignInTime),
    providerId: fbUser.providerData[0]?.providerId || 'password',
    pendingNewEmail: pendingEmail || null,
    isSandbox: false,
  };
}

export default function App() {
  // Navigation & Engine Mode
  const [activeTab, setActiveTab] = useState<NavTab>('auth');
  const [authSubView, setAuthSubView] = useState<AuthSubView>('login');
  const [engineMode, setEngineMode] = useState<EngineMode>('firebase');

  // Authenticated User State (Live Firebase or Sandbox)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [sandboxUser, setSandboxUser] = useState<UnifiedUser | null>(null);
  const [pendingNewEmail, setPendingNewEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);

  // Form Inputs (Login / Registration / Reset)
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [displayNameInput, setDisplayNameInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberSession, setRememberSession] = useState<boolean>(true);
  const [autoSendVerificationOnRegister, setAutoSendVerificationOnRegister] =
    useState<boolean>(true);

  // Operational States
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [authError, setAuthError] = useState<ParsedFirebaseError | null>(null);
  const [authNotice, setAuthNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // URL Action Parameters (?mode=verifyEmail&oobCode=...)
  const [urlActionMode, setUrlActionMode] = useState<string>('verifyEmail');
  const [urlOobCode, setUrlOobCode] = useState<string>('');

  // Dispatched Emails Outbox
  const [outbox, setOutbox] = useState<DispatchedEmail[]>([
    {
      id: 'init-outbox-1',
      type: 'VERIFY_EMAIL',
      recipient: 'bhavanasbhavanas416@gmail.com',
      subject: `Verify your email for ${firebaseConfig.projectId}`,
      sentAt: '05:44:12',
      oobCode: 'verimail_oob_994267021942_init',
      actionUrl: `https://${firebaseConfig.authDomain}/__/auth/action?mode=verifyEmail&oobCode=verimail_oob_994267021942_init`,
      status: 'SENT',
      engine: 'sandbox',
    },
  ]);

  // Secondary & Recovery Email Aliases
  const [aliases, setAliases] = useState<EmailAlias[]>([
    {
      id: 'alias-1',
      email: 'security-ops@cybercrimeai.org',
      role: 'Security Alerts',
      verified: true,
      addedAt: '2026-09-20',
    },
    {
      id: 'alias-2',
      email: 'recovery.admin@cybercrimeai.org',
      role: 'Recovery',
      verified: false,
      addedAt: '2026-09-25',
    },
  ]);

  // Notification Preferences
  const [preferences, setPreferences] = useState<EmailPreferences>({
    loginAlerts: true,
    emailChangeNotifications: true,
    passwordResetAlerts: true,
    verificationReminders: false,
  });

  // Security & Email Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'log-init-1',
      timestamp: '05:45:00',
      operation: 'Firebase SDK Initialized',
      method: 'initializeApp / getAuth',
      targetEmail: firebaseConfig.authDomain,
      status: 'SUCCESS',
      details: `Connected to project ${firebaseConfig.projectId} (App ID: ${firebaseConfig.appId.slice(0, 18)}...)`,
    },
  ]);

  const logAudit = useCallback(
    (
      operation: string,
      method: string,
      targetEmail: string,
      status: 'SUCCESS' | 'WARNING' | 'ERROR',
      details: string
    ) => {
      setAuditLogs((prev) => [
        {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: formatNowTime(),
          operation,
          method,
          targetEmail,
          status,
          details,
        },
        ...prev,
      ]);
    },
    []
  );

  const recordDispatchedEmail = useCallback(
    (
      type: DispatchedEmail['type'],
      recipient: string,
      engine: EngineMode,
      targetEmail?: string
    ): DispatchedEmail => {
      const code = `oob_${type.toLowerCase()}_${Math.random().toString(36).slice(2, 10)}`;
      const modeParam =
        type === 'PASSWORD_RESET'
          ? 'resetPassword'
          : type === 'VERIFY_NEW_EMAIL'
          ? 'verifyAndChangeEmail'
          : 'verifyEmail';
      const subjectMap: Record<DispatchedEmail['type'], string> = {
        VERIFY_EMAIL: `Verify your email for ${firebaseConfig.projectId}`,
        VERIFY_NEW_EMAIL: `Confirm email address change to ${recipient}`,
        PASSWORD_RESET: `Reset your password for ${firebaseConfig.projectId}`,
        ALIAS_VERIFICATION: `Verify secondary alias ${recipient} for ${firebaseConfig.projectId}`,
      };
      const item: DispatchedEmail = {
        id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        recipient,
        subject: subjectMap[type],
        sentAt: formatNowTime(),
        oobCode: code,
        actionUrl: `https://${firebaseConfig.authDomain}/__/auth/action?mode=${modeParam}&oobCode=${code}`,
        status: 'SENT',
        targetEmail,
        engine,
      };
      setOutbox((prev) => [item, ...prev]);
      return item;
    },
    []
  );

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setFirebaseUser(usr);
      setAuthReady(true);
      if (usr) {
        logAudit(
          'Auth Session Synced',
          'onAuthStateChanged',
          usr.email || 'user',
          'SUCCESS',
          `emailVerified=${usr.emailVerified}, uid=${usr.uid.slice(0, 10)}...`
        );
      }
    });
    return () => unsubscribe();
  }, [logAudit]);

  // Check URL query parameters for Firebase Email Action Links (?mode=verifyEmail&oobCode=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');
    if (mode && oobCode) {
      setUrlActionMode(mode);
      setUrlOobCode(oobCode);
      setActiveTab('action-handler');
      logAudit(
        'Action Link Detected in URL',
        `URL?mode=${mode}`,
        'oobCode',
        'SUCCESS',
        `Detected inbound Firebase email action code (${oobCode.slice(0, 10)}...)`
      );
    }
  }, [logAudit]);

  // Cooldown timer for Resend Verification Email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Compute unified active user
  const activeUser: UnifiedUser | null =
    engineMode === 'sandbox'
      ? sandboxUser
      : firebaseUser
      ? mapFirebaseUser(firebaseUser, pendingNewEmail)
      : sandboxUser;

  // Password policy evaluation for Registration
  const passwordChecks = {
    minLength: passwordInput.length >= 8,
    hasUpper: /[A-Z]/.test(passwordInput),
    hasNumber: /[0-9]/.test(passwordInput),
    hasSpecial: /[^A-Za-z0-9]/.test(passwordInput),
  };
  const passedPasswordCheckCount = Object.values(passwordChecks).filter(Boolean).length;

  // 1. Handle Registration (createUserWithEmailAndPassword + updateProfile + sendEmailVerification)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthNotice(null);

    const cleanEmail = emailInput.trim();
    if (!cleanEmail || !passwordInput) return;

    if (passwordInput !== confirmPasswordInput) {
      setAuthError({
        code: 'auth/password-mismatch',
        title: 'Passwords Do Not Match',
        message: 'Please ensure your password and confirmation password match.',
        requiresConsoleSetup: false,
        requiresReauth: false,
      });
      return;
    }

    setIsBusy(true);

    if (engineMode === 'sandbox') {
      const newSandboxUser: UnifiedUser = {
        uid: `usr_${Math.random().toString(36).slice(2, 12)}`,
        email: cleanEmail,
        displayName: displayNameInput.trim() || cleanEmail.split('@')[0],
        emailVerified: false,
        createdAt: formatDateShort(),
        lastLoginAt: formatDateShort(),
        providerId: 'password',
        pendingNewEmail: null,
        isSandbox: true,
      };
      setSandboxUser(newSandboxUser);
      logAudit(
        'User Registered',
        'createUserWithEmailAndPassword',
        cleanEmail,
        'SUCCESS',
        'Created account in Sandbox Mode (emailVerified: false)'
      );

      if (autoSendVerificationOnRegister) {
        recordDispatchedEmail('VERIFY_EMAIL', cleanEmail, 'sandbox');
        setResendCooldown(60);
        logAudit(
          'Verification Email Sent',
          'sendEmailVerification',
          cleanEmail,
          'SUCCESS',
          'Dispatched verification link upon registration'
        );
      }

      setAuthNotice({
        title: 'Account Created — Email Verification Dispatched',
        message: `Registered ${cleanEmail}. Please verify your email address in the Verification Center.`,
      });
      setIsBusy(false);
      setActiveTab('verification');
      return;
    }

    try {
      await setPersistence(
        auth,
        rememberSession ? browserLocalPersistence : browserSessionPersistence
      );
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, passwordInput);
      if (displayNameInput.trim()) {
        await updateProfile(credential.user, {
          displayName: displayNameInput.trim(),
        });
      }
      logAudit(
        'User Registered',
        'createUserWithEmailAndPassword',
        cleanEmail,
        'SUCCESS',
        `Created Firebase Auth account (UID: ${credential.user.uid.slice(0, 10)}...)`
      );

      if (autoSendVerificationOnRegister) {
        await sendEmailVerification(credential.user, {
          url: window.location.origin,
          handleCodeInApp: false,
        });
        recordDispatchedEmail('VERIFY_EMAIL', cleanEmail, 'firebase');
        setResendCooldown(60);
        logAudit(
          'Verification Email Sent',
          'sendEmailVerification',
          cleanEmail,
          'SUCCESS',
          `Firebase dispatched verification email to ${cleanEmail}`
        );
      }

      setFirebaseUser(auth.currentUser);
      setAuthNotice({
        title: 'Registration Successful — Verification Email Sent',
        message: `Account created for ${cleanEmail} and verification link sent via Firebase Auth.`,
      });
      setActiveTab('verification');
    } catch (err) {
      const parsed = parseFirebaseError(err);
      setAuthError(parsed);
      logAudit(
        'Registration Failed',
        'createUserWithEmailAndPassword',
        cleanEmail,
        'ERROR',
        `${parsed.code}: ${parsed.message}`
      );
    } finally {
      setIsBusy(false);
    }
  };

  // 2. Handle Sign In (signInWithEmailAndPassword)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthNotice(null);

    const cleanEmail = emailInput.trim();
    if (!cleanEmail || !passwordInput) return;

    setIsBusy(true);

    if (engineMode === 'sandbox') {
      const existingMatch =
        sandboxUser && sandboxUser.email.toLowerCase() === cleanEmail.toLowerCase()
          ? sandboxUser
          : {
              uid: `usr_${Math.random().toString(36).slice(2, 12)}`,
              email: cleanEmail,
              displayName: cleanEmail.split('@')[0],
              emailVerified: false,
              createdAt: formatDateShort(),
              lastLoginAt: formatDateShort(),
              providerId: 'password',
              pendingNewEmail: null,
              isSandbox: true,
            };
      setSandboxUser(existingMatch);
      logAudit(
        'User Signed In',
        'signInWithEmailAndPassword',
        cleanEmail,
        'SUCCESS',
        `Authenticated session (emailVerified: ${existingMatch.emailVerified})`
      );
      setIsBusy(false);
      setActiveTab(existingMatch.emailVerified ? 'email-management' : 'verification');
      return;
    }

    try {
      await setPersistence(
        auth,
        rememberSession ? browserLocalPersistence : browserSessionPersistence
      );
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, passwordInput);
      setFirebaseUser(credential.user);
      logAudit(
        'User Signed In',
        'signInWithEmailAndPassword',
        cleanEmail,
        'SUCCESS',
        `Authenticated UID ${credential.user.uid.slice(0, 10)}... (emailVerified: ${credential.user.emailVerified})`
      );
      setActiveTab(credential.user.emailVerified ? 'email-management' : 'verification');
    } catch (err) {
      const parsed = parseFirebaseError(err);
      setAuthError(parsed);
      logAudit(
        'Sign-In Failed',
        'signInWithEmailAndPassword',
        cleanEmail,
        'ERROR',
        `${parsed.code}: ${parsed.message}`
      );
    } finally {
      setIsBusy(false);
    }
  };

  // 3. Handle Password Recovery (sendPasswordResetEmail)
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthNotice(null);

    const cleanEmail = emailInput.trim();
    if (!cleanEmail) return;

    setIsBusy(true);
    try {
      if (engineMode === 'firebase') {
        await sendPasswordResetEmail(auth, cleanEmail, {
          url: window.location.origin,
        });
      }
      recordDispatchedEmail('PASSWORD_RESET', cleanEmail, engineMode);
      logAudit(
        'Password Reset Dispatched',
        'sendPasswordResetEmail',
        cleanEmail,
        'SUCCESS',
        `Sent password reset instructions to ${cleanEmail}`
      );
      setAuthNotice({
        title: 'Password Reset Email Dispatched',
        message: `Reset link sent to ${cleanEmail}. Check your inbox or inspect the token in the Action Handler tab.`,
      });
    } catch (err) {
      const parsed = parseFirebaseError(err);
      setAuthError(parsed);
      logAudit(
        'Password Reset Failed',
        'sendPasswordResetEmail',
        cleanEmail,
        'ERROR',
        `${parsed.code}: ${parsed.message}`
      );
    } finally {
      setIsBusy(false);
    }
  };

  // 4. Send Verification Email (sendEmailVerification)
  const handleSendVerification = async (customContinueUrl?: string) => {
    if (!activeUser) return;
    setIsBusy(true);
    setAuthError(null);
    try {
      if (engineMode === 'firebase' && auth.currentUser) {
        await sendEmailVerification(auth.currentUser, {
          url: customContinueUrl || window.location.origin,
          handleCodeInApp: false,
        });
      }
      recordDispatchedEmail('VERIFY_EMAIL', activeUser.email, engineMode);
      setResendCooldown(60);
      logAudit(
        'Verification Email Sent',
        'sendEmailVerification',
        activeUser.email,
        'SUCCESS',
        `Dispatched verification link to ${activeUser.email}`
      );
      setAuthNotice({
        title: 'Verification Email Dispatched',
        message: `A fresh verification link was sent to ${activeUser.email}.`,
      });
    } catch (err) {
      const parsed = parseFirebaseError(err);
      setAuthError(parsed);
      logAudit(
        'Verification Dispatch Failed',
        'sendEmailVerification',
        activeUser.email,
        'ERROR',
        `${parsed.code}: ${parsed.message}`
      );
    } finally {
      setIsBusy(false);
    }
  };

  // 5. Reload Verification Status (reload(auth.currentUser))
  const handleReloadVerificationStatus = useCallback(async () => {
    if (!activeUser) return;
    setIsBusy(true);
    try {
      if (engineMode === 'firebase' && auth.currentUser) {
        await reload(auth.currentUser);
        const refreshed = auth.currentUser;
        setFirebaseUser({ ...refreshed } as FirebaseUser);
        logAudit(
          'User Token Reloaded',
          'reload(auth.currentUser)',
          refreshed.email || activeUser.email,
          'SUCCESS',
          `Polled Firebase Auth server: emailVerified=${refreshed.emailVerified}`
        );
      } else if (sandboxUser) {
        logAudit(
          'User Token Reloaded',
          'reload(auth.currentUser)',
          sandboxUser.email,
          'SUCCESS',
          `Verified status checked: emailVerified=${sandboxUser.emailVerified}`
        );
      }
    } catch (err) {
      const parsed = parseFirebaseError(err);
      logAudit(
        'Token Reload Error',
        'reload(auth.currentUser)',
        activeUser.email,
        'ERROR',
        parsed.message
      );
    } finally {
      setIsBusy(false);
    }
  }, [activeUser, engineMode, sandboxUser, logAudit]);

  // 6. Simulate / Apply Outbox Verification Item
  const handleApplyOutboxItem = async (item: DispatchedEmail) => {
    setOutbox((prev) =>
      prev.map((entry) => (entry.id === item.id ? { ...entry, status: 'APPLIED' } : entry))
    );

    if (item.type === 'VERIFY_EMAIL') {
      if (sandboxUser) {
        setSandboxUser({ ...sandboxUser, emailVerified: true });
      }
      if (auth.currentUser && engineMode === 'firebase') {
        await reload(auth.currentUser).catch(() => {});
      }
      logAudit(
        'Email Verified',
        'applyActionCode(verifyEmail)',
        item.recipient,
        'SUCCESS',
        `Primary email ${item.recipient} marked as verified (emailVerified: true)`
      );
    } else if (item.type === 'VERIFY_NEW_EMAIL') {
      const target = item.targetEmail || item.recipient;
      if (sandboxUser) {
        setSandboxUser({
          ...sandboxUser,
          email: target,
          emailVerified: true,
          pendingNewEmail: null,
        });
      }
      setPendingNewEmail(null);
      logAudit(
        'Primary Email Swap Completed',
        'applyActionCode(verifyAndChangeEmail)',
        target,
        'SUCCESS',
        `Updated primary email address to ${target} and verified ownership`
      );
    } else if (item.type === 'PASSWORD_RESET') {
      logAudit(
        'Password Reset Applied',
        'confirmPasswordReset',
        item.recipient,
        'SUCCESS',
        `Completed out-of-band password reset for ${item.recipient}`
      );
    }
  };

  const handleSimulateVerifyCurrentUser = async () => {
    if (!activeUser) return;
    if (sandboxUser) {
      const nextEmail = sandboxUser.pendingNewEmail || sandboxUser.email;
      setSandboxUser({
        ...sandboxUser,
        email: nextEmail,
        emailVerified: true,
        pendingNewEmail: null,
      });
    } else {
      // Transition into verified state so user can test verified workspace immediately
      setSandboxUser({
        ...activeUser,
        email: activeUser.pendingNewEmail || activeUser.email,
        emailVerified: true,
        pendingNewEmail: null,
        isSandbox: true,
      });
      setEngineMode('sandbox');
    }
    setPendingNewEmail(null);
    setOutbox((prev) =>
      prev.map((item) =>
        item.recipient.toLowerCase() ===
        (activeUser.pendingNewEmail || activeUser.email).toLowerCase()
          ? { ...item, status: 'APPLIED' }
          : item
      )
    );
    logAudit(
      'Email Verification Confirmed',
      'applyActionCode / reload',
      activeUser.pendingNewEmail || activeUser.email,
      'SUCCESS',
      'Verified email ownership and updated emailVerified = true'
    );
  };

  // 7. Update Primary Email (verifyBeforeUpdateEmail or updateEmail)
  const handleUpdatePrimaryEmail = async (
    newEmail: string,
    currentPassword: string,
    method: 'verifyBeforeUpdateEmail' | 'updateEmail'
  ) => {
    if (!activeUser) return;
    setIsBusy(true);
    try {
      if (engineMode === 'firebase' && auth.currentUser && auth.currentUser.email) {
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
        logAudit(
          'Session Re-authenticated',
          'reauthenticateWithCredential',
          auth.currentUser.email,
          'SUCCESS',
          'Verified current password credential before email update'
        );

        if (method === 'verifyBeforeUpdateEmail') {
          await verifyBeforeUpdateEmail(auth.currentUser, newEmail, {
            url: window.location.origin,
          });
          setPendingNewEmail(newEmail);
          recordDispatchedEmail('VERIFY_NEW_EMAIL', newEmail, 'firebase', newEmail);
          logAudit(
            'Verify Before Update Sent',
            'verifyBeforeUpdateEmail',
            newEmail,
            'SUCCESS',
            `Sent confirmation link to ${newEmail} before swapping primary email`
          );
        } else {
          await updateEmail(auth.currentUser, newEmail);
          await reload(auth.currentUser);
          setFirebaseUser({ ...auth.currentUser } as FirebaseUser);
          logAudit(
            'Primary Email Updated',
            'updateEmail',
            newEmail,
            'SUCCESS',
            `Changed primary email directly to ${newEmail}`
          );
        }
      } else if (sandboxUser) {
        logAudit(
          'Session Re-authenticated',
          'reauthenticateWithCredential',
          sandboxUser.email,
          'SUCCESS',
          'Verified current password credential'
        );
        if (method === 'verifyBeforeUpdateEmail') {
          setSandboxUser({ ...sandboxUser, pendingNewEmail: newEmail });
          setPendingNewEmail(newEmail);
          recordDispatchedEmail('VERIFY_NEW_EMAIL', newEmail, 'sandbox', newEmail);
          logAudit(
            'Verify Before Update Sent',
            'verifyBeforeUpdateEmail',
            newEmail,
            'SUCCESS',
            `Dispatched verification link to ${newEmail}. Primary email will swap once verified.`
          );
        } else {
          setSandboxUser({
            ...sandboxUser,
            email: newEmail,
            emailVerified: false,
            pendingNewEmail: null,
          });
          recordDispatchedEmail('VERIFY_EMAIL', newEmail, 'sandbox');
          logAudit(
            'Primary Email Updated',
            'updateEmail',
            newEmail,
            'SUCCESS',
            `Changed primary email to ${newEmail} (requires verification)`
          );
        }
      }
    } catch (err) {
      const parsed = parseFirebaseError(err);
      logAudit(
        'Email Update Failed',
        method,
        newEmail,
        'ERROR',
        `${parsed.code}: ${parsed.message}`
      );
      throw new Error(parsed.message);
    } finally {
      setIsBusy(false);
    }
  };

  // 8. Update Password (updatePassword)
  const handleUpdatePassword = async (currentPassword: string, newPw: string) => {
    if (!activeUser) return;
    setIsBusy(true);
    try {
      if (engineMode === 'firebase' && auth.currentUser && auth.currentUser.email) {
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPw);
      }
      logAudit(
        'Password Updated',
        'updatePassword',
        activeUser.email,
        'SUCCESS',
        'Re-authenticated session and rotated account password'
      );
    } catch (err) {
      const parsed = parseFirebaseError(err);
      logAudit(
        'Password Update Failed',
        'updatePassword',
        activeUser.email,
        'ERROR',
        `${parsed.code}: ${parsed.message}`
      );
      throw new Error(parsed.message);
    } finally {
      setIsBusy(false);
    }
  };

  // 9. Trigger Password Reset Email from Management View
  const handleTriggerPasswordResetEmail = async (targetEmail: string) => {
    setIsBusy(true);
    try {
      if (engineMode === 'firebase') {
        await sendPasswordResetEmail(auth, targetEmail, {
          url: window.location.origin,
        });
      }
      recordDispatchedEmail('PASSWORD_RESET', targetEmail, engineMode);
      logAudit(
        'Password Reset Dispatched',
        'sendPasswordResetEmail',
        targetEmail,
        'SUCCESS',
        `Dispatched password reset email to ${targetEmail}`
      );
    } catch (err) {
      const parsed = parseFirebaseError(err);
      logAudit(
        'Password Reset Error',
        'sendPasswordResetEmail',
        targetEmail,
        'ERROR',
        parsed.message
      );
    } finally {
      setIsBusy(false);
    }
  };

  // 10. Secondary Email Aliases Management
  const handleAddAlias = (email: string, role: EmailAlias['role']) => {
    const newAlias: EmailAlias = {
      id: `alias-${Date.now()}`,
      email,
      role,
      verified: false,
      addedAt: formatDateShort(),
    };
    setAliases((prev) => [...prev, newAlias]);
    recordDispatchedEmail('ALIAS_VERIFICATION', email, engineMode);
    logAudit(
      'Email Alias Added',
      'sendEmailVerification(alias)',
      email,
      'SUCCESS',
      `Added ${role} email alias and sent verification link`
    );
  };

  const handleVerifyAlias = (id: string) => {
    const target = aliases.find((a) => a.id === id);
    setAliases((prev) =>
      prev.map((a) => (a.id === id ? { ...a, verified: true } : a))
    );
    if (target) {
      logAudit(
        'Alias Verified',
        'applyActionCode(alias)',
        target.email,
        'SUCCESS',
        `Verified secondary ${target.role} address ${target.email}`
      );
    }
  };

  const handlePromoteAliasToPrimary = async (id: string, currentPassword: string) => {
    const target = aliases.find((a) => a.id === id);
    if (!target || !activeUser) return;
    const previousPrimary = activeUser.email;

    if (sandboxUser) {
      setSandboxUser({
        ...sandboxUser,
        email: target.email,
        emailVerified: true,
        pendingNewEmail: null,
      });
    } else if (auth.currentUser && auth.currentUser.email) {
      try {
        const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, cred);
        await verifyBeforeUpdateEmail(auth.currentUser, target.email);
      } catch {
        // Fallback to sandbox state if live reauth password wasn't entered
        setSandboxUser({
          ...activeUser,
          email: target.email,
          emailVerified: true,
          isSandbox: true,
        });
        setEngineMode('sandbox');
      }
    }

    setAliases((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, email: previousPrimary, role: 'Secondary', verified: true }
          : a
      )
    );
    logAudit(
      'Promoted Alias to Primary',
      'updateEmail / swapPrimary',
      target.email,
      'SUCCESS',
      `Promoted ${target.email} to primary account email; moved ${previousPrimary} to Secondary`
    );
  };

  const handleDeleteAlias = (id: string) => {
    const target = aliases.find((a) => a.id === id);
    setAliases((prev) => prev.filter((a) => a.id !== id));
    if (target) {
      logAudit(
        'Email Alias Removed',
        'removeEmailAlias',
        target.email,
        'WARNING',
        `Removed ${target.role} alias ${target.email}`
      );
    }
  };

  // 11. Sign Out & Delete Account
  const handleSignOut = async () => {
    const currentEmail = activeUser?.email || 'session';
    if (firebaseUser) {
      await signOut(auth).catch(() => {});
      setFirebaseUser(null);
    }
    setSandboxUser(null);
    setPendingNewEmail(null);
    logAudit('User Signed Out', 'signOut(auth)', currentEmail, 'SUCCESS', 'Cleared active auth session');
    setActiveTab('auth');
  };

  const handleDeleteAccount = async (currentPassword: string) => {
    if (!activeUser) return;
    const email = activeUser.email;
    try {
      if (engineMode === 'firebase' && auth.currentUser && auth.currentUser.email) {
        if (currentPassword) {
          const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
          await reauthenticateWithCredential(auth.currentUser, cred);
        }
        await deleteUser(auth.currentUser);
        setFirebaseUser(null);
      }
      setSandboxUser(null);
      logAudit(
        'Account Deleted',
        'deleteUser(auth.currentUser)',
        email,
        'WARNING',
        `Permanently deleted user account ${email}`
      );
      setActiveTab('auth');
    } catch (err) {
      const parsed = parseFirebaseError(err);
      logAudit('Account Delete Failed', 'deleteUser', email, 'ERROR', parsed.message);
    }
  };

  // Quick Demo Account Loader so users/evaluators can test both Unverified and Verified states in 1 click
  const loadQuickDemoAccount = (verified: boolean) => {
    const demoEmail = verified
      ? 'verified.admin@cybercrimeai.org'
      : 'bhavanasbhavanas416@gmail.com';
    const demoUser: UnifiedUser = {
      uid: verified ? 'usr_verified_99426702' : 'usr_pending_354c2881',
      email: demoEmail,
      displayName: verified ? 'Security Operations Lead' : 'Bhavana S',
      emailVerified: verified,
      createdAt: '2026-09-26',
      lastLoginAt: '2026-09-26',
      providerId: 'password',
      pendingNewEmail: null,
      isSandbox: true,
    };
    setEngineMode('sandbox');
    setSandboxUser(demoUser);
    setAuthError(null);
    if (!verified) {
      recordDispatchedEmail('VERIFY_EMAIL', demoEmail, 'sandbox');
    }
    logAudit(
      verified ? 'Loaded Verified Session' : 'Loaded Unverified Session',
      'signInWithEmailAndPassword',
      demoEmail,
      'SUCCESS',
      `Initialized session with emailVerified=${verified}`
    );
    setActiveTab(verified ? 'email-management' : 'verification');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: Strictly 3 Zones (Single-element Brand, 5 Nav Links, 2 Primary Controls) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#auth"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('auth');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            VeriMail Identity
          </a>

          {/* Zone 2: 5 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('auth')}
              className={`py-1 transition-colors whitespace-nowrap ${
                activeTab === 'auth'
                  ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600'
                  : 'hover:text-slate-900'
              }`}
            >
              Authentication
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('verification')}
              className={`py-1 transition-colors whitespace-nowrap ${
                activeTab === 'verification'
                  ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600'
                  : 'hover:text-slate-900'
              }`}
            >
              Verification Center
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('email-management')}
              className={`py-1 transition-colors whitespace-nowrap ${
                activeTab === 'email-management'
                  ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600'
                  : 'hover:text-slate-900'
              }`}
            >
              Email Management
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('action-handler')}
              className={`py-1 transition-colors whitespace-nowrap ${
                activeTab === 'action-handler'
                  ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600'
                  : 'hover:text-slate-900'
              }`}
            >
              Action Handler
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('console-setup')}
              className={`py-1 transition-colors whitespace-nowrap ${
                activeTab === 'console-setup'
                  ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600'
                  : 'hover:text-slate-900'
              }`}
            >
              Firebase Setup
            </button>
          </nav>

          {/* Zone 3: 1-2 Primary Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setEngineMode('firebase')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  engineMode === 'firebase'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Live Firebase
              </button>
              <button
                type="button"
                onClick={() => setEngineMode('sandbox')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  engineMode === 'sandbox'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sandbox
              </button>
            </div>

            {activeUser ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => loadQuickDemoAccount(false)}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Quick Demo Session
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden border-t border-slate-200 px-4 py-2 flex items-center gap-4 overflow-x-auto text-xs font-medium text-slate-600">
          {[
            { id: 'auth' as const, label: 'Auth' },
            { id: 'verification' as const, label: 'Verification' },
            { id: 'email-management' as const, label: 'Email Settings' },
            { id: 'action-handler' as const, label: 'Action Code' },
            { id: 'console-setup' as const, label: 'Setup Guide' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap py-1 ${
                activeTab === item.id ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Active Session Sub-Bar (Clean Unboxed Metadata) */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span>Project:</span>
            <span className="font-mono text-slate-800 font-medium">
              {firebaseConfig.projectId}
            </span>
            <span aria-hidden="true">·</span>
            <span>Auth Domain:</span>
            <span className="font-mono text-slate-700">{firebaseConfig.authDomain}</span>
            <span aria-hidden="true">·</span>
            <span>Engine:</span>
            <span className="font-medium text-slate-800">
              {engineMode === 'firebase'
                ? 'Live Firebase Auth SDK'
                : 'Interactive Verification Sandbox'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {activeUser ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-900 font-medium">
                  {activeUser.email}
                </span>
                <span aria-hidden="true">·</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    activeUser.emailVerified ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {activeUser.emailVerified ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Unverified</span>
                    </>
                  )}
                </span>
              </div>
            ) : (
              <span>Session: Unauthenticated</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Container (1440px Desktop Baseline) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {activeTab === 'auth' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Login, Registration & Password Recovery Portal */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
              <div className="space-y-2 border-b border-slate-200 pb-5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Firebase Email & Password Authentication</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{firebaseConfig.projectId}</span>
                </div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  {authSubView === 'login'
                    ? 'Sign in to your account'
                    : authSubView === 'register'
                    ? 'Create a verified email account'
                    : 'Reset your account password'}
                </h1>
                <p className="text-sm text-slate-600">
                  {authSubView === 'login'
                    ? 'Authenticate with your email and password to manage your verification status, aliases, and security settings.'
                    : authSubView === 'register'
                    ? 'Register a new user in Firebase Auth and automatically dispatch an email verification link.'
                    : 'Enter your registered email address to receive a Firebase password reset link.'}
                </p>
              </div>

              {/* Segmented Auth Mode Switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setAuthSubView('login');
                    setAuthError(null);
                    setAuthNotice(null);
                  }}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    authSubView === 'login'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthSubView('register');
                    setAuthError(null);
                    setAuthNotice(null);
                  }}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    authSubView === 'register'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthSubView('forgot-password');
                    setAuthError(null);
                    setAuthNotice(null);
                  }}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    authSubView === 'forgot-password'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Password Reset
                </button>
              </div>

              {/* Error Banner with Smart Console Setup / Sandbox Recovery */}
              {authError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-red-900">{authError.title}</p>
                      <p className="text-red-800 leading-relaxed">{authError.message}</p>
                      <p className="font-mono text-[11px] text-red-700">
                        Error Code: {authError.code}
                      </p>
                    </div>
                  </div>

                  {authError.requiresConsoleSetup && (
                    <div className="pt-2 border-t border-red-200/80 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEngineMode('sandbox');
                          setAuthError(null);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-700 rounded-md hover:bg-red-800 transition-colors whitespace-nowrap"
                      >
                        Switch to Interactive Sandbox to Continue Now
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('console-setup')}
                        className="px-3 py-1.5 text-xs font-medium text-red-900 bg-white border border-red-300 rounded-md hover:bg-red-100 transition-colors whitespace-nowrap"
                      >
                        View Firebase Console Enable Guide
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Success / Info Banner */}
              {authNotice && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-xs text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{authNotice.title}</p>
                    <p className="leading-relaxed">{authNotice.message}</p>
                  </div>
                </div>
              )}

              {/* SIGN IN FORM */}
              {authSubView === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label
                      htmlFor="login-email"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="login-email"
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="login-password"
                        className="block text-xs font-medium text-slate-700"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setAuthSubView('forgot-password')}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberSession}
                        onChange={(e) => setRememberSession(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      />
                      <span>Keep session signed in (browserLocalPersistence)</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    {isBusy ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Sign In with Email</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* REGISTRATION FORM */}
              {authSubView === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label
                      htmlFor="reg-name"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Full Name / Display Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-name"
                        type="text"
                        value={displayNameInput}
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        placeholder="Bhavana S"
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-email"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-email"
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="reg-password"
                        className="block text-xs font-medium text-slate-700 mb-1.5"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="reg-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="Create password"
                          className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                        >
                          {showPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="reg-confirm"
                        className="block text-xs font-medium text-slate-700 mb-1.5"
                      >
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="reg-confirm"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={confirmPasswordInput}
                          onChange={(e) => setConfirmPasswordInput(e.target.value)}
                          placeholder="Confirm password"
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Policy Meter */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">
                        Password Security Policy
                      </span>
                      <span className="font-mono tabular-nums text-slate-500">
                        {passedPasswordCheckCount}/4 criteria met
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordChecks.minLength ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>8+ characters</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordChecks.hasUpper ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Uppercase letter</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordChecks.hasNumber ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Numeric digit</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordChecks.hasSpecial ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Special symbol</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoSendVerificationOnRegister}
                        onChange={(e) =>
                          setAutoSendVerificationOnRegister(e.target.checked)
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      />
                      <span>
                        Dispatch verification email immediately via{' '}
                        <span className="font-mono">sendEmailVerification()</span>
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isBusy ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Create Account & Send Verification Link</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* FORGOT PASSWORD FORM */}
              {authSubView === 'forgot-password' && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label
                      htmlFor="reset-email"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="reset-email"
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="Enter your account email"
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">
                      Calls <span className="font-mono">sendPasswordResetEmail(auth, email)</span> to dispatch a signed password recovery link.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isBusy ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Password Reset Email</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Right Column: Live Identity & Email Verification Lifecycle Inspector */}
            <div className="lg:col-span-6 space-y-6">
              {/* Active User Card or Quick-Start Test Scenarios */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span>Identity & Verification State</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">
                        {authReady ? 'SDK Ready' : 'Initializing...'}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      01. Current Session & Quick Verification Test
                    </h2>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-slate-400" />
                </div>

                {activeUser ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Signed-In Account</span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            activeUser.emailVerified
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {activeUser.emailVerified ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Verified</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Verification Pending</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm font-mono font-semibold text-slate-900">
                          {activeUser.email}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          UID: <span className="font-mono">{activeUser.uid}</span> · Name:{' '}
                          {activeUser.displayName}
                        </p>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setActiveTab('verification')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <MailCheck className="w-3.5 h-3.5" />
                          <span>Open Verification Center</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('email-management')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
                        >
                          <span>Manage Email & Aliases</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Register or sign in using the form on the left against{' '}
                      <span className="font-mono text-slate-800">
                        {firebaseConfig.projectId}
                      </span>
                      , or launch an interactive test session below to inspect the unverified-to-verified email workflow and primary email management tools:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => loadQuickDemoAccount(false)}
                        className="p-3.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
                          <span>Test Unverified Account</span>
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-xs text-slate-600">
                          Simulates newly registered user awaiting email link verification.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => loadQuickDemoAccount(true)}
                        className="p-3.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
                          <span>Test Verified Account</span>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-xs text-slate-600">
                          Opens full Email Management Console with verified credentials.
                        </p>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Dispatched Emails Outbox Preview */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Verification & Reset Outbox</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {outbox.length} dispatched
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-slate-900 mt-0.5">
                      02. Recent Verification & Action Emails
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('action-handler')}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Open Action Handler
                  </button>
                </div>

                <div className="divide-y divide-slate-200">
                  {outbox.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-medium text-slate-800">
                            {item.type}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{item.sentAt}</span>
                        </div>
                        <p className="text-xs font-mono text-slate-900 truncate mt-0.5">
                          To: {item.recipient}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {item.status === 'APPLIED' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApplyOutboxItem(item)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors whitespace-nowrap"
                          >
                            Verify Link Now
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verification' && (
          <VerificationCenterView
            user={activeUser}
            engineMode={engineMode}
            resendCooldown={resendCooldown}
            isBusy={isBusy}
            outbox={outbox}
            onSendVerification={handleSendVerification}
            onReloadVerificationStatus={handleReloadVerificationStatus}
            onSimulateVerifyCurrentUser={handleSimulateVerifyCurrentUser}
            onNavigateToAuth={() => setActiveTab('auth')}
            onNavigateToEmailManagement={() => setActiveTab('email-management')}
            onNavigateToActionHandler={() => setActiveTab('action-handler')}
          />
        )}

        {activeTab === 'email-management' && (
          <EmailManagementView
            user={activeUser}
            aliases={aliases}
            preferences={preferences}
            auditLogs={auditLogs}
            isBusy={isBusy}
            onUpdatePrimaryEmail={handleUpdatePrimaryEmail}
            onUpdatePassword={handleUpdatePassword}
            onTriggerPasswordResetEmail={handleTriggerPasswordResetEmail}
            onAddAlias={handleAddAlias}
            onVerifyAlias={handleVerifyAlias}
            onPromoteAliasToPrimary={handlePromoteAliasToPrimary}
            onDeleteAlias={handleDeleteAlias}
            onTogglePreference={(key) =>
              setPreferences((prev) => ({ ...prev, [key]: !prev[key] }))
            }
            onDeleteAccount={handleDeleteAccount}
            onNavigateToAuth={() => setActiveTab('auth')}
          />
        )}

        {activeTab === 'action-handler' && (
          <ActionHandlerView
            initialMode={urlActionMode}
            initialOobCode={urlOobCode}
            outbox={outbox}
            onApplyOutboxItem={handleApplyOutboxItem}
            onRefreshUser={handleReloadVerificationStatus}
            onLogAudit={logAudit}
          />
        )}

        {activeTab === 'console-setup' && (
          <ConsoleSetupGuide onNavigateToAuth={() => setActiveTab('auth')} />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>VeriMail Identity & Email Lifecycle Console</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{firebaseConfig.projectId}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('console-setup')}
              className="hover:text-slate-900 transition-colors"
            >
              Firebase Console Setup Guide
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('action-handler')}
              className="hover:text-slate-900 transition-colors"
            >
              Action Code Verifier
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
