import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Mail,
  ShieldCheck,
  KeyRound,
  Plus,
  Trash2,
  RefreshCw,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import type {
  UnifiedUser,
  EmailAlias,
  EmailPreferences,
  AuditLogEntry,
} from '../types/auth';

interface EmailManagementViewProps {
  user: UnifiedUser | null;
  aliases: EmailAlias[];
  preferences: EmailPreferences;
  auditLogs: AuditLogEntry[];
  isBusy: boolean;
  onUpdatePrimaryEmail: (
    newEmail: string,
    currentPassword: string,
    method: 'verifyBeforeUpdateEmail' | 'updateEmail'
  ) => Promise<void>;
  onUpdatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onTriggerPasswordResetEmail: (email: string) => Promise<void>;
  onAddAlias: (email: string, role: EmailAlias['role']) => void;
  onVerifyAlias: (id: string) => void;
  onPromoteAliasToPrimary: (id: string, currentPassword: string) => Promise<void>;
  onDeleteAlias: (id: string) => void;
  onTogglePreference: (key: keyof EmailPreferences) => void;
  onDeleteAccount: (currentPassword: string) => Promise<void>;
  onNavigateToAuth: () => void;
}

export const EmailManagementView: React.FC<EmailManagementViewProps> = ({
  user,
  aliases,
  preferences,
  auditLogs,
  isBusy,
  onUpdatePrimaryEmail,
  onUpdatePassword,
  onTriggerPasswordResetEmail,
  onAddAlias,
  onVerifyAlias,
  onPromoteAliasToPrimary,
  onDeleteAlias,
  onTogglePreference,
  onDeleteAccount,
  onNavigateToAuth,
}) => {
  // Primary Email Change Form State
  const [newPrimaryEmail, setNewPrimaryEmail] = useState<string>('');
  const [reauthPasswordForEmail, setReauthPasswordForEmail] = useState<string>('');
  const [emailUpdateMethod, setEmailUpdateMethod] = useState<
    'verifyBeforeUpdateEmail' | 'updateEmail'
  >('verifyBeforeUpdateEmail');
  const [emailChangeFeedback, setEmailChangeFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Alias Form State
  const [newAliasEmail, setNewAliasEmail] = useState<string>('');
  const [newAliasRole, setNewAliasRole] = useState<EmailAlias['role']>('Recovery');

  // Password Change Form State
  const [currentPasswordForPw, setCurrentPasswordForPw] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [pwFeedback, setPwFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Account Deletion Confirmation State
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  if (!user) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <span>Email Lifecycle & Security Management</span>
          <span aria-hidden="true">·</span>
          <span>Authentication Required</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">
          Sign in to manage primary email, aliases, and security credentials
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Updating your primary email (<span className="font-mono text-xs">verifyBeforeUpdateEmail</span> / <span className="font-mono text-xs">updateEmail</span>) or rotating credentials requires an active authenticated session.
        </p>
        <div className="pt-2">
          <button
            onClick={onNavigateToAuth}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <span>Sign In or Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const handlePrimaryEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailChangeFeedback(null);
    if (!newPrimaryEmail.trim()) {
      setEmailChangeFeedback({
        type: 'error',
        message: 'Please enter the new email address you want to set.',
      });
      return;
    }
    try {
      await onUpdatePrimaryEmail(
        newPrimaryEmail.trim(),
        reauthPasswordForEmail,
        emailUpdateMethod
      );
      setEmailChangeFeedback({
        type: 'success',
        message:
          emailUpdateMethod === 'verifyBeforeUpdateEmail'
            ? `Verification link sent to ${newPrimaryEmail.trim()} via verifyBeforeUpdateEmail(). Once verified, your primary email will update automatically.`
            : `Primary email address updated to ${newPrimaryEmail.trim()} via updateEmail().`,
      });
      setNewPrimaryEmail('');
      setReauthPasswordForEmail('');
    } catch (err) {
      setEmailChangeFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwFeedback(null);
    if (newPassword.length < 6) {
      setPwFeedback({
        type: 'error',
        message: 'New password must be at least 6 characters long.',
      });
      return;
    }
    try {
      await onUpdatePassword(currentPasswordForPw, newPassword);
      setPwFeedback({
        type: 'success',
        message: 'Account password updated in Firebase Authentication.',
      });
      setCurrentPasswordForPw('');
      setNewPassword('');
    } catch (err) {
      setPwFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleAddAliasSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAliasEmail.trim()) return;
    onAddAlias(newAliasEmail.trim(), newAliasRole);
    setNewAliasEmail('');
  };

  return (
    <div className="space-y-8">
      {/* Identity Overview Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Account Email Management</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{user.uid}</span>
              <span aria-hidden="true">·</span>
              <span>Provider: {user.providerId}</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Primary Email, Aliases & Credential Security
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                user.emailVerified ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {user.emailVerified ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-amber-600" />
              )}
              <span>
                {user.emailVerified ? 'Primary Email Verified' : 'Primary Email Unverified'}
              </span>
            </span>
          </div>
        </div>

        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-slate-500">Current Primary Email</p>
            <p className="text-sm font-mono font-medium text-slate-900 mt-1 truncate">
              {user.email}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Display Name</p>
            <p className="text-sm font-medium text-slate-900 mt-1 truncate">
              {user.displayName || 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Account Created</p>
            <p className="text-sm font-mono tabular-nums text-slate-900 mt-1">
              {user.createdAt}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Configured Email Aliases</p>
            <p className="text-sm font-mono tabular-nums text-slate-900 mt-1">
              {aliases.length} active ({aliases.filter((a) => a.verified).length} verified)
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Grid: Primary Email Update + Secondary Aliases */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 01. Change Primary Email Address */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Firebase Email Mutation</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">verifyBeforeUpdateEmail / updateEmail</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              01. Update Primary Email Address
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Re-authenticates your session with <span className="font-mono">reauthenticateWithCredential</span> before updating your primary login address.
            </p>
          </div>

          {user.pendingNewEmail && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Pending Email Change Verification</p>
                <p className="mt-0.5">
                  A verification link was dispatched to{' '}
                  <span className="font-mono font-medium">{user.pendingNewEmail}</span>. Verify it in the Verification Center or Action Handler to complete the primary email swap.
                </p>
              </div>
            </div>
          )}

          {emailChangeFeedback && (
            <div
              className={`p-3.5 rounded-lg border flex items-start gap-2.5 text-xs ${
                emailChangeFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {emailChangeFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span>{emailChangeFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handlePrimaryEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Update Strategy
              </label>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setEmailUpdateMethod('verifyBeforeUpdateEmail')}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    emailUpdateMethod === 'verifyBeforeUpdateEmail'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Verify Before Update (Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => setEmailUpdateMethod('updateEmail')}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    emailUpdateMethod === 'updateEmail'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Direct updateEmail()
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="new-primary-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                New Primary Email Address
              </label>
              <input
                id="new-primary-email"
                type="email"
                required
                value={newPrimaryEmail}
                onChange={(e) => setNewPrimaryEmail(e.target.value)}
                placeholder="new.address@domain.com"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="reauth-password" className="block text-xs font-medium text-slate-700 mb-1.5">
                Current Password (for <span className="font-mono">EmailAuthProvider.credential</span>)
              </label>
              <input
                id="reauth-password"
                type="password"
                required
                value={reauthPasswordForEmail}
                onChange={(e) => setReauthPasswordForEmail(e.target.value)}
                placeholder="Enter your current password to authorize change"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {isBusy ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              <span>
                {emailUpdateMethod === 'verifyBeforeUpdateEmail'
                  ? 'Send Verification to New Email'
                  : 'Update Primary Email Immediately'}
              </span>
            </button>
          </form>
        </div>

        {/* 02. Secondary & Recovery Email Aliases */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Multi-Address Routing</span>
              <span aria-hidden="true">·</span>
              <span>Recovery, Security & Billing Aliases</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              02. Recovery & Secondary Email Aliases
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Manage backup and departmental email addresses linked to your identity profile. Verified aliases can be promoted to primary.
            </p>
          </div>

          <form onSubmit={handleAddAliasSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="email"
              required
              value={newAliasEmail}
              onChange={(e) => setNewAliasEmail(e.target.value)}
              placeholder="Add recovery or alias email..."
              className="flex-1 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <select
              value={newAliasRole}
              onChange={(e) => setNewAliasRole(e.target.value as EmailAlias['role'])}
              className="px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="Recovery">Recovery</option>
              <option value="Security Alerts">Security Alerts</option>
              <option value="Billing">Billing</option>
              <option value="Secondary">Secondary</option>
            </select>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Email</span>
            </button>
          </form>

          <div className="divide-y divide-slate-200">
            {aliases.map((alias) => (
              <div
                key={alias.id}
                className="py-3.5 first:pt-1 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium text-slate-900">
                      {alias.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{alias.role}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        alias.verified
                          ? 'text-emerald-700 font-medium'
                          : 'text-amber-700 font-medium'
                      }
                    >
                      {alias.verified ? 'Verified' : 'Unverified'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">Added {alias.addedAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!alias.verified ? (
                    <button
                      type="button"
                      onClick={() => onVerifyAlias(alias.id)}
                      className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors whitespace-nowrap"
                    >
                      Verify Alias
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        onPromoteAliasToPrimary(alias.id, reauthPasswordForEmail || 'demo-auth')
                      }
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors whitespace-nowrap"
                    >
                      Make Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteAlias(alias.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                    title="Remove Email Alias"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Two-Column Grid: Password Rotation & Notification Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 03. Password Rotation & Recovery */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span>Credential Security</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">updatePassword / sendPasswordResetEmail</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                03. Password Rotation & Reset Dispatch
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onTriggerPasswordResetEmail(user.email)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
            >
              Send Reset Link to Email
            </button>
          </div>

          {pwFeedback && (
            <div
              className={`p-3.5 rounded-lg border flex items-start gap-2.5 text-xs ${
                pwFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {pwFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span>{pwFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="cur-pw" className="block text-xs font-medium text-slate-700 mb-1.5">
                Current Password
              </label>
              <input
                id="cur-pw"
                type="password"
                required
                value={currentPasswordForPw}
                onChange={(e) => setCurrentPasswordForPw(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="new-pw" className="block text-xs font-medium text-slate-700 mb-1.5">
                New Password
              </label>
              <input
                id="new-pw"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters (8+ recommended)"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Update Password</span>
            </button>
          </form>
        </div>

        {/* 04. Email Notification Preferences & Account Danger Zone */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Transactional Email Routing</span>
              <span aria-hidden="true">·</span>
              <span>Security Alerts</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              04. Security Email Notification Rules
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {[
              {
                key: 'loginAlerts' as const,
                title: 'New Device Sign-In Alerts',
                desc: 'Dispatch an email alert whenever a new browser session authenticates.',
              },
              {
                key: 'emailChangeNotifications' as const,
                title: 'Primary Email Change Audit Notice',
                desc: 'Send a revocation link to the previous address when verifyBeforeUpdateEmail is invoked.',
              },
              {
                key: 'passwordResetAlerts' as const,
                title: 'Password Reset & Credential Rotation Notices',
                desc: 'Notify recovery aliases whenever confirmPasswordReset or updatePassword succeeds.',
              },
              {
                key: 'verificationReminders' as const,
                title: 'Unverified Alias Reminders',
                desc: 'Send automatic 24-hour reminder links for unverified secondary email addresses.',
              },
            ].map((item) => (
              <div
                key={item.key}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onTogglePreference(item.key)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors shrink-0 ${
                    preferences[item.key]
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {preferences[item.key] ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>

          {/* Account Deletion Guard */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-red-700">Delete Firebase User Account</p>
              <p className="text-xs text-slate-500">
                Permanently removes <span className="font-mono">{user.email}</span> via <span className="font-mono">deleteUser(auth.currentUser)</span>.
              </p>
            </div>
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap self-start sm:self-auto"
              >
                Delete Account...
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={deleteConfirmPassword}
                  onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                  placeholder="Current password"
                  className="px-2.5 py-1.5 text-xs bg-white border border-red-300 rounded-md w-36"
                />
                <button
                  type="button"
                  onClick={() => onDeleteAccount(deleteConfirmPassword)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 whitespace-nowrap"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* High-Density Identity & Email Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Security & Email Lifecycle Telemetry</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{auditLogs.length} events</span>
            </div>
            <h2 className="text-base font-semibold text-slate-900 mt-0.5">
              05. Firebase Authentication & Email Event Log
            </h2>
          </div>
          <ShieldCheck className="w-5 h-5 text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Operation</th>
                <th className="py-2.5 px-4">Firebase SDK Method</th>
                <th className="py-2.5 px-4">Target Email</th>
                <th className="py-2.5 px-4">Details</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                    {log.operation}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                    {log.method}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-800 whitespace-nowrap">
                    {log.targetEmail}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 max-w-md truncate">
                    {log.details}
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium whitespace-nowrap">
                    <span
                      className={
                        log.status === 'SUCCESS'
                          ? 'text-emerald-700'
                          : log.status === 'WARNING'
                          ? 'text-amber-700'
                          : 'text-red-700'
                      }
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
