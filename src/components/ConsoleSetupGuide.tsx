import React, { useState } from 'react';
import { CheckCircle2, Copy, ExternalLink, Check, ArrowRight } from 'lucide-react';
import { firebaseConfig } from '../lib/firebase';

interface ConsoleSetupGuideProps {
  onNavigateToAuth: () => void;
}

export const ConsoleSetupGuide: React.FC<ConsoleSetupGuideProps> = ({ onNavigateToAuth }) => {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({
    1: true,
    2: false,
    3: false,
    4: false,
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const actionUrlTemplate = `${currentOrigin}/?mode=%action%&oobCode=%code%`;

  const toggleStep = (step: number) => {
    setCompletedSteps((prev) => ({ ...prev, [step]: !prev[step] }));
  };

  const copyText = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Firebase Project Configuration</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{firebaseConfig.projectId}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{completedCount} of 4 steps verified</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Firebase Console Email Auth & Verification Setup
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Your web configuration for <span className="font-mono text-slate-800">{firebaseConfig.authDomain}</span> is connected. Complete the steps below in the Firebase Console to ensure live Email/Password registration, verification links, and email address updates are enabled.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <span>Open Firebase Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onNavigateToAuth}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
            >
              <span>Go to Auth Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Active Config Summary Table */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-slate-500 mb-1">Project ID</p>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <span className="font-mono text-xs text-slate-900 truncate">{firebaseConfig.projectId}</span>
              <button
                onClick={() => copyText('projectId', firebaseConfig.projectId)}
                className="text-slate-500 hover:text-slate-900 p-1"
                title="Copy Project ID"
              >
                {copiedField === 'projectId' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Auth Domain</p>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <span className="font-mono text-xs text-slate-900 truncate">{firebaseConfig.authDomain}</span>
              <button
                onClick={() => copyText('authDomain', firebaseConfig.authDomain)}
                className="text-slate-500 hover:text-slate-900 p-1"
                title="Copy Auth Domain"
              >
                {copiedField === 'authDomain' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">App ID</p>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <span className="font-mono text-xs text-slate-900 truncate">{firebaseConfig.appId}</span>
              <button
                onClick={() => copyText('appId', firebaseConfig.appId)}
                className="text-slate-500 hover:text-slate-900 p-1"
                title="Copy App ID"
              >
                {copiedField === 'appId' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Setup Instructions */}
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
        {/* Step 1 */}
        <div className="p-6 flex items-start justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono tabular-nums">01. SDK Initialization</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-medium">Connected in Codebase</span>
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              01. Web SDK & Analytics Initialized
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              The application is initialized with your <span className="font-mono text-xs text-slate-800">cybercrimeai-354c2</span> configuration using <span className="font-mono text-xs text-slate-800">initializeApp(firebaseConfig)</span>, <span className="font-mono text-xs text-slate-800">getAuth(app)</span>, and <span className="font-mono text-xs text-slate-800">getAnalytics(app)</span>.
            </p>
          </div>
          <button
            onClick={() => toggleStep(1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
              completedSteps[1]
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{completedSteps[1] ? 'Completed' : 'Mark Complete'}</span>
          </button>
        </div>

        {/* Step 2 */}
        <div className="p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono tabular-nums">02. Sign-In Provider</span>
              <span aria-hidden="true">·</span>
              <span>Required for createUserWithEmailAndPassword & signInWithEmailAndPassword</span>
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              02. Enable Email/Password Sign-In Method in Firebase Console
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              In the Firebase Console, navigate to <strong>Build → Authentication → Sign-in method</strong>. Click <strong>Add new provider</strong> (or select <strong>Email/Password</strong>), toggle <strong>Enable</strong> to ON, and click <strong>Save</strong>.
            </p>
            <div className="pt-1">
              <a
                href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                <span>Open Sign-in Providers for {firebaseConfig.projectId}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <button
            onClick={() => toggleStep(2)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 self-start transition-colors ${
              completedSteps[2]
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{completedSteps[2] ? 'Completed' : 'Mark Complete'}</span>
          </button>
        </div>

        {/* Step 3 */}
        <div className="p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono tabular-nums">03. Email Templates</span>
              <span aria-hidden="true">·</span>
              <span>Required for Custom Verification & Email Change Links</span>
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              03. Configure Email Verification, Password Reset & Email Change Templates
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Navigate to <strong>Authentication → Templates</strong> in the Firebase Console. Here you can customize the sender name, reply-to address, and subject lines for <strong>Email address verification</strong>, <strong>Password reset</strong>, and <strong>Email address change</strong>. If you want verification links to open directly inside this app's Action Handler, set the custom Action URL to:
            </p>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 max-w-xl">
              <span className="font-mono text-xs text-slate-800 truncate">{actionUrlTemplate}</span>
              <button
                onClick={() => copyText('actionUrl', actionUrlTemplate)}
                className="text-slate-500 hover:text-slate-900 p-1 shrink-0"
                title="Copy Action URL"
              >
                {copiedField === 'actionUrl' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="pt-1">
              <a
                href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/emails`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                <span>Open Email Templates in Firebase Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <button
            onClick={() => toggleStep(3)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 self-start transition-colors ${
              completedSteps[3]
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{completedSteps[3] ? 'Completed' : 'Mark Complete'}</span>
          </button>
        </div>

        {/* Step 4 */}
        <div className="p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono tabular-nums">04. Authorized Domains</span>
              <span aria-hidden="true">·</span>
              <span>Required for continueUrl Redirects</span>
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              04. Add Current Hostname to Firebase Authorized Domains
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Navigate to <strong>Authentication → Settings → Authorized domains</strong> and click <strong>Add domain</strong> to allowlist this preview host so <span className="font-mono text-xs text-slate-800">sendEmailVerification</span> and <span className="font-mono text-xs text-slate-800">verifyBeforeUpdateEmail</span> redirect back seamlessly:
            </p>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 max-w-xl">
              <span className="font-mono text-xs text-slate-800 truncate">{currentHost || 'localhost'}</span>
              <button
                onClick={() => copyText('host', currentHost || 'localhost')}
                className="text-slate-500 hover:text-slate-900 p-1 shrink-0"
                title="Copy Domain"
              >
                {copiedField === 'host' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="pt-1">
              <a
                href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                <span>Open Authorized Domains Settings</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <button
            onClick={() => toggleStep(4)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 self-start transition-colors ${
              completedSteps[4]
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{completedSteps[4] ? 'Completed' : 'Mark Complete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
