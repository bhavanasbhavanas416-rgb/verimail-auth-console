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
