import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  KeyRound,
  MailCheck,
  RefreshCw,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
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

  // Extract mode & oobCode if the user pastes a full Firebase verification/reset link
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
    if (!oobCode) {
      setStatusBanner({
        type: 'error',
        title: 'Action Code Required',
        message: 'Paste a Firebase action link or out-of-band code (oobCode) to execute.',
      });
      return;
    }

    setIsProcessing(true);
    setStatusBanner(null);

    try {
      // First check if this matches a session outbox item (for simulated or tracked links)
      const matchedOutbox = outbox.find((item) => item.oobCode === oobCode);
      if (matchedOutbox && matchedOutbox.engine === 'sandbox') {
        await onApplyOutboxItem(matchedOutbox, newPasswordForReset || undefined);
        setStatusBanner({
          type: 'success',
          title: 'Action Code Verified & Applied',
          message: `Completed ${matchedOutbox.type} for ${matchedOutbox.recipient}. Account state has been updated.`,
        });
        setIsProcessing(false);
        return;
      }

      // Live Firebase SDK Action Code execution
      if (mode === 'verifyEmail' || mode === 'verifyAndChangeEmail' || mode === 'recoverEmail') {
        const info = await checkActionCode(auth, oobCode);
        await applyActionCode(auth, oobCode);
        await onRefreshUser();
        const targetEmail = info.data.email || auth.currentUser?.email || 'user';
        onLogAudit(
          'Action Code Applied',
          `applyActionCode(${mode})`,
          targetEmail,
          'SUCCESS',
          `Successfully verified action code via Firebase Auth SDK`
        );
        setStatusBanner({
          type: 'success',
          title: 'Email Action Code Verified',
          message: `Firebase Auth successfully applied ${mode} for ${targetEmail}.`,
        });
      } else if (mode === 'resetPassword') {
        if (!newPasswordForReset || newPasswordForReset.length < 6) {
          setStatusBanner({
            type: 'error',
            title: 'New Password Required',
            message: 'Enter a new password (minimum 6 characters) to complete confirmPasswordReset.',
          });
          setIsProcessing(false);
          return;
        }
        const accountEmail = await verifyPasswordResetCode(auth, oobCode);
        await confirmPasswordReset(auth, oobCode, newPasswordForReset);
        onLogAudit(
          'Password Reset Confirmed',
          'confirmPasswordReset',
          accountEmail,
          'SUCCESS',
          'Password updated using valid oobCode'
        );
        setStatusBanner({
          type: 'success',
          title: 'Password Reset Complete',
          message: `Password for ${accountEmail} has been updated. You can now sign in with your new password.`,
        });
        setNewPasswordForReset('');
      }
    } catch (err) {
      const parsed = parseFirebaseError(err);
      onLogAudit(
        'Action Code Error',
        `applyActionCode(${mode})`,
        auth.currentUser?.email || 'unknown',
        'ERROR',
        `${parsed.code}: ${parsed.message}`
      );
      setStatusBanner({
        type: 'error',
        title: parsed.title,
        message: parsed.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Action Link / oobCode Processor */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Firebase Email Action Handler</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">applyActionCode / confirmPasswordReset</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900">
            Verify Email Link & Out-of-Band Token Processor
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Paste any verification link or <span className="font-mono text-xs text-slate-800">oobCode</span> from a Firebase verification, email change, or password reset email to execute it directly against Firebase Auth.
          </p>
        </div>

        {statusBanner && (
          <div
            className={`p-4 rounded-lg border flex items-start gap-3 ${
              statusBanner.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : statusBanner.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            {statusBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              <p className="font-semibold">{statusBanner.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed opacity-90">{statusBanner.message}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleExecuteActionCode} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Operation Mode
            </label>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {[
                { id: 'verifyEmail', label: 'Verify Email' },
                { id: 'verifyAndChangeEmail', label: 'Verify Email Change' },
                { id: 'resetPassword', label: 'Reset Password' },
                { id: 'recoverEmail', label: 'Recover Email' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActionMode(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    actionMode === tab.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="oob-input" className="block text-xs font-medium text-slate-700 mb-1.5">
              Firebase Action Link or <span className="font-mono">oobCode</span> Token
            </label>
            <input
              id="oob-input"
              type="text"
              value={inputCodeOrUrl}
              onChange={(e) => setInputCodeOrUrl(e.target.value)}
              placeholder="Paste full https://cybercrimeai-354c2.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=... or code"
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Accepts either a full Firebase email action URL or the extracted <span className="font-mono">oobCode</span> parameter.
            </p>
          </div>

          {actionMode === 'resetPassword' && (
            <div>
              <label htmlFor="reset-new-password" className="block text-xs font-medium text-slate-700 mb-1.5">
                New Account Password (for <span className="font-mono">confirmPasswordReset</span>)
              </label>
              <input
                id="reset-new-password"
                type="password"
                value={newPasswordForReset}
                onChange={(e) => setNewPasswordForReset(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          )}

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <MailCheck className="w-4 h-4" />
              )}
              <span>Execute Action Code</span>
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Dispatched Email Outbox Queue */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Dispatched Verification & Action Emails</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{outbox.length} recorded</span>
            </div>
          </div>
          <h2 className="text-base font-semibold text-slate-900 mt-1">
            Session Email Dispatch Inspector
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Every verification, email change, or password reset triggered in this session is logged below for rapid verification testing.
          </p>
        </div>

        {outbox.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <KeyRound className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-sm font-medium text-slate-700">No verification emails dispatched yet</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Register a new user, request a verification link, or initiate an email address change to inspect dispatched links here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {outbox.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-800 font-medium">{item.type}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{item.sentAt}</span>
                  </div>
                  <span
                    className={`font-medium ${
                      item.status === 'APPLIED' ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {item.status === 'APPLIED' ? 'Verified' : 'Pending Action'}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-900">{item.subject}</p>
                <p className="text-xs text-slate-600">
                  Recipient: <span className="font-mono text-slate-800">{item.recipient}</span>
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setInputCodeOrUrl(item.oobCode);
                      if (item.type === 'PASSWORD_RESET') {
                        setActionMode('resetPassword');
                      } else if (item.type === 'VERIFY_NEW_EMAIL') {
                        setActionMode('verifyAndChangeEmail');
                      } else {
                        setActionMode('verifyEmail');
                      }
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors whitespace-nowrap"
                  >
                    Load Token
                  </button>
                  {item.status !== 'APPLIED' && (
                    <button
                      type="button"
                      onClick={async () => {
                        await onApplyOutboxItem(item, 'NewPass123!');
                        setStatusBanner({
                          type: 'success',
                          title: 'Verification Link Applied',
                          message: `Applied ${item.type} for ${item.recipient}.`,
                        });
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      <span>Simulate Clicking Email Link</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {item.engine === 'firebase' && item.actionUrl.startsWith('http') && (
                    <a
                      href={item.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
