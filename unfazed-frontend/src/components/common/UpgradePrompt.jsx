import React from 'react';
import { Sparkles, Check, X, ShieldAlert } from 'lucide-react';

export const UpgradePrompt = ({
  isOpen,
  onClose,
  title = 'Unlock Practice Superpowers',
  message = 'Upgrade your practice plan to access this premium clinical feature.',
  targetTier = 'pro',
  onUpgrade,
}) => {
  if (!isOpen) return null;

  const features =
    targetTier === 'clinic'
      ? ['Unlimited active clients', 'SOAP / DAP templates', 'Advanced practice aggregations', 'Multi-clinician roster']
      : [
          'Up to 50 active clients (vs 5 on Free)',
          'Standardized SOAP & DAP clinical templates',
          'Practice retention & no-show analytics',
          'Priority WhatsApp/Email notification delivery',
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-brand-500/30 bg-slate-900 p-8 shadow-2xl shadow-brand-500/10">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-400 border border-brand-500/20">
          <Sparkles className="h-3.5 w-3.5" />
          <span>UPGRADE TO {targetTier.toUpperCase()}</span>
        </div>

        <h3 className="font-serif text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-300 mb-6">{message}</p>

        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-850 p-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Features Unlocked:</p>
          {features.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-slate-200">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/20 text-brand-400">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
              <span>{feat}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onUpgrade(targetTier)}
            className="flex-1 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:opacity-95 hover:scale-[1.02] active:scale-[0.98]"
          >
            Upgrade Practice Plan (Instant)
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
