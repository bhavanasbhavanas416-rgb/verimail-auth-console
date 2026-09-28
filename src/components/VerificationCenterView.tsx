import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  RefreshCw,
  Send,
  MailCheck,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
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
  onNavigateToAuth,
  onNavigateToEmailManagement,
  onNavigateToActionHandler,
}) => {
  const [autoPoll, setAutoPoll] = useState<boolean>(false);
  const [pollCountdown, setPollCountdown] = useState<number>(5);
  const [continueUrl, setContinueUrl] = useState<string>(
    typeof window !== 'undefined' ? window.location.origin : ''
  );
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Auto-polling effect for reload(auth.currentUser) when user is waiting for email verification
  useEffect(() => {
    if (!autoPoll || !user || user.emailVerified) {
      return;
    }
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

  if (!user) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <span>Email Verification Center</span>
          <span aria-hidden="true">·</span>
          <span>No Active Session</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">
          Sign in or register an account to manage email verification
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Firebase Email Verification (<span className="font-mono text-xs">sendEmailVerification</span> and <span className="font-mono text-xs">reload</span>) requires an authenticated user session.
        </p>
        <div className="pt-2">
          <button
            onClick={onNavigateToAuth}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <span>Go to Login & Registration</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const latestVerificationEmail = outbox.find(
    (item) =>
      (item.type === 'VERIFY_EMAIL' || item.type === 'VERIFY_NEW_EMAIL') &&
      item.recipient.toLowerCase() === (user.pendingNewEmail || user.email).toLowerCase()
  );

  const copyActionUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  return (
    <div className="space-y-8">
      {/* Top Status Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Verification Status</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{user.email}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">UID: {user.uid.slice(0, 12)}...</span>
            </div>
            <div className="flex items-center gap-3">
              {user.emailVerified ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <Clock className="w-6 h-6 text-amber-600 shrink-0" />
              )}
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                {user.emailVerified
                  ? 'Primary Email Address Verified'
                  : 'Primary Email Verification Pending'}
              </h1>
            </div>
            <p className="text-sm text-slate-600 max-w-2xl">
              {user.emailVerified
                ? `Your email address (${user.email}) is verified in Firebase Auth. Full email lifecycle management, alias routing, and security features are unlocked.`
                : `A verification link has been sent to ${user.email}. Click the link in your email inbox and press "Check Verification Status" below to sync your Firebase Auth token.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onReloadVerificationStatus}
              disabled={isBusy}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
              <span>Check Verification Status</span>
            </button>

            {!user.emailVerified && (
              <button
                onClick={() => onSendVerification(continueUrl)}
                disabled={isBusy || resendCooldown > 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap tabular-nums"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {resendCooldown > 0
                    ? `Resend Link (${resendCooldown}s)`
                    : 'Send Verification Email'}
                </span>
              </button>
            )}

            {user.emailVerified && (
              <button
                onClick={onNavigateToEmailManagement}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <span>Manage Email Settings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Verification Metadata Row */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-slate-500">Verification State</p>
            <p
              className={`text-sm font-semibold mt-1 flex items-center gap-1.5 ${
                user.emailVerified ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              <span>
                {user.emailVerified ? 'emailVerified: true' : 'emailVerified: false'}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Primary Email</p>
            <p className="text-sm font-mono text-slate-900 mt-1 truncate">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Pending Email Change</p>
            <p className="text-sm font-mono text-slate-900 mt-1 truncate">
              {user.pendingNewEmail || 'None'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Live Status Auto-Polling</p>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoPoll((prev) => !prev)}
                disabled={user.emailVerified}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors tabular-nums ${
                  autoPoll
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50'
                }`}
              >
                {user.emailVerified
                  ? 'Verified'
                  : autoPoll
                  ? `Polling Active (${pollCountdown}s)`
                  : 'Enable 5s Auto-Poll'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Grid: Left = Verification Lifecycle & ActionCodeSettings, Right = Email Preview & Instant Verifier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>ActionCodeSettings Configuration</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">sendEmailVerification(user, settings)</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              01. Verification Dispatch & Redirect Configuration
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="continue-url" className="block text-xs font-medium text-slate-700 mb-1.5">
                Post-Verification Redirect URL (<span className="font-mono">continueUrl</span>)
              </label>
              <input
                id="continue-url"
                type="url"
                value={continueUrl}
                onChange={(e) => setContinueUrl(e.target.value)}
                placeholder="https://your-app-domain.run.app"
                className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Passed inside <span className="font-mono">ActionCodeSettings</span> when dispatching verification emails so users return directly to this workspace after verifying.
              </p>
            </div>

            {/* 3-Step Verification Workflow Explanation */}
            <div className="pt-2 space-y-3 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-900">
                How Firebase Email Verification Works
              </p>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">01.</span>
                  <p>
                    <strong>Dispatch:</strong> Calling <span className="font-mono text-slate-800">sendEmailVerification(auth.currentUser)</span> generates a signed out-of-band token (<span className="font-mono text-slate-800">oobCode</span>) and dispatches an email from <span className="font-mono text-slate-800">noreply@{firebaseConfig.authDomain}</span>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">02.</span>
                  <p>
                    <strong>User Action:</strong> The user clicks the verification link in their email client (or applies the <span className="font-mono text-slate-800">oobCode</span> in the Action Handler tab via <span className="font-mono text-slate-800">applyActionCode</span>).
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">03.</span>
                  <p>
                    <strong>Token Sync:</strong> Calling <span className="font-mono text-slate-800">reload(auth.currentUser)</span> refreshes the local ID token and updates <span className="font-mono text-slate-800">user.emailVerified</span> to <span className="font-mono text-emerald-700 font-medium">true</span>.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onSendVerification(continueUrl)}
                disabled={isBusy || resendCooldown > 0}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors tabular-nums"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {resendCooldown > 0
                    ? `Cooldown Active (${resendCooldown}s)`
                    : 'Dispatch Verification Link Now'}
                </span>
              </button>
              <button
                type="button"
                onClick={onNavigateToActionHandler}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <span>Open oobCode Handler</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Dispatched Email Message Preview & Interactive Verification Trigger */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span>Dispatched Email Preview</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">
                  {engineMode === 'firebase' ? 'Live Firebase SMTP + Inspector' : 'Sandbox Outbox'}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                02. Verification Email Template & Instant Test
              </h2>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="space-y-1.5 pb-3 border-b border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">From:</span>
                <span className="font-mono text-slate-800">
                  noreply@{firebaseConfig.authDomain}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">To:</span>
                <span className="font-mono text-slate-900 font-medium">
                  {user.pendingNewEmail || user.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Subject:</span>
                <span className="text-slate-900 font-medium">
                  Verify your email for {firebaseConfig.projectId}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>Hello {user.displayName || user.email.split('@')[0]},</p>
              <p>
                Follow this link to verify your email address for{' '}
                <span className="font-mono font-medium">{firebaseConfig.projectId}</span>:
              </p>

              <div className="bg-white border border-slate-200 rounded-md p-2.5 flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-blue-700 truncate">
                  {latestVerificationEmail?.actionUrl ||
                    `https://${firebaseConfig.authDomain}/__/auth/action?mode=verifyEmail&oobCode=verimail_${user.uid.slice(0, 8)}`}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyActionUrl(
                      latestVerificationEmail?.actionUrl ||
                        `https://${firebaseConfig.authDomain}/__/auth/action?mode=verifyEmail&oobCode=verimail_${user.uid.slice(0, 8)}`
                    )
                  }
                  className="text-slate-500 hover:text-slate-900 p-1 shrink-0"
                  title="Copy Verification URL"
                >
                  {copiedLink ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <p className="text-slate-500">
                If you didn’t ask to verify this address, you can ignore this email.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {user.emailVerified
                  ? 'Status: Email link already verified'
                  : 'Testing flow? Simulate clicking the inbox link:'}
              </div>
              {!user.emailVerified ? (
                <button
                  type="button"
                  onClick={onSimulateVerifyCurrentUser}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
                >
                  <MailCheck className="w-3.5 h-3.5" />
                  <span>Confirm & Verify Email Now</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified & Active</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
