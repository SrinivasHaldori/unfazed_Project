import React, { useState } from 'react';
import { Lock, Eye, EyeOff, FileText, CheckCircle2, Shield } from 'lucide-react';

export const SoapDapForm = ({
  initialNote = null,
  onSave,
  hasTemplateEntitlement = false,
  onLockedClick,
}) => {
  const [templateType, setTemplateType] = useState(initialNote?.templateType || 'freeform');
  const [privacyType, setPrivacyType] = useState(initialNote?.type || 'private');

  const [freeformBody, setFreeformBody] = useState(initialNote?.content?.body || '');
  const [soap, setSoap] = useState(
    initialNote?.content?.soap || { subjective: '', objective: '', assessment: '', plan: '' }
  );
  const [dap, setDap] = useState(
    initialNote?.content?.dap || { data: '', assessment: '', plan: '' }
  );
  const [saving, setSaving] = useState(false);

  const handleSelectTemplate = (type) => {
    if ((type === 'SOAP' || type === 'DAP') && !hasTemplateEntitlement) {
      onLockedClick({
        title: 'Unlock Clinical SOAP & DAP Templates',
        message: 'SOAP and DAP clinical templates require a Pro subscription. Free tier includes freeform notes.',
        targetTier: 'pro',
      });
      return;
    }
    setTemplateType(type);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        type: privacyType,
        templateType,
        content: {
          body: freeformBody,
          soap,
          dap,
        },
      };
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-md">
      {/* Top Bar: Privacy & Template Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelectTemplate('freeform')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              templateType === 'freeform'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Freeform Note
          </button>

          <button
            type="button"
            onClick={() => handleSelectTemplate('SOAP')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              templateType === 'SOAP'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>SOAP Format</span>
            {!hasTemplateEntitlement && <Lock className="h-3.5 w-3.5 text-amber-400" />}
          </button>

          <button
            type="button"
            onClick={() => handleSelectTemplate('DAP')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              templateType === 'DAP'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>DAP Format</span>
            {!hasTemplateEntitlement && <Lock className="h-3.5 w-3.5 text-amber-400" />}
          </button>
        </div>

        {/* Privacy Selector */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-850 p-1.5 border border-slate-800">
          <button
            type="button"
            onClick={() => setPrivacyType('private')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              privacyType === 'private'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span>Private Clinician Note</span>
          </button>

          <button
            type="button"
            onClick={() => setPrivacyType('shared')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              privacyType === 'shared'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Shared with Client</span>
          </button>
        </div>
      </div>

      {privacyType === 'shared' && (
        <div className="flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 p-3 text-xs text-teal-300">
          <Shield className="h-4 w-4 shrink-0" />
          <span>This note will be visible to the client on their Unfazed Client Portal. Private clinical reflections remain hidden.</span>
        </div>
      )}

      {/* Editor Content Area */}
      {templateType === 'freeform' && (
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Clinical Notes & Observations (Freeform)
          </label>
          <textarea
            value={freeformBody}
            onChange={(e) => setFreeformBody(e.target.value)}
            rows={10}
            placeholder="Document session dialogue, behavioral observations, therapeutic interventions, and homework assignments..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-100 placeholder-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      )}

      {templateType === 'SOAP' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-brand-400 uppercase tracking-wide">
              S — Subjective
            </label>
            <textarea
              value={soap.subjective}
              onChange={(e) => setSoap({ ...soap, subjective: e.target.value })}
              rows={4}
              placeholder="Client's reported mood, chief complaint, statements..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-brand-400 uppercase tracking-wide">
              O — Objective
            </label>
            <textarea
              value={soap.objective}
              onChange={(e) => setSoap({ ...soap, objective: e.target.value })}
              rows={4}
              placeholder="Clinician observations, affect, eye contact, speech rate..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-brand-400 uppercase tracking-wide">
              A — Assessment
            </label>
            <textarea
              value={soap.assessment}
              onChange={(e) => setSoap({ ...soap, assessment: e.target.value })}
              rows={4}
              placeholder="Clinical synthesis, progression toward treatment goals, response to intervention..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-brand-400 uppercase tracking-wide">
              P — Plan
            </label>
            <textarea
              value={soap.plan}
              onChange={(e) => setSoap({ ...soap, plan: e.target.value })}
              rows={4}
              placeholder="Action steps, next session focus, between-session exercises..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {templateType === 'DAP' && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-brand-400 uppercase tracking-wide">
              D — Data
            </label>
            <textarea
              value={dap.data}
              onChange={(e) => setDap({ ...dap, data: e.target.value })}
              rows={3}
              placeholder="Subjective experience and objective clinician observations..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-brand-400 uppercase tracking-wide">
              A — Assessment
            </label>
            <textarea
              value={dap.assessment}
              onChange={(e) => setDap({ ...dap, assessment: e.target.value })}
              rows={3}
              placeholder="Clinical evaluation and treatment response..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-brand-400 uppercase tracking-wide">
              P — Plan
            </label>
            <textarea
              value={dap.plan}
              onChange={(e) => setDap({ ...dap, plan: e.target.value })}
              rows={3}
              placeholder="Treatment interventions and scheduling plan..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 hover:opacity-95 disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Save Clinical Note'}</span>
        </button>
      </div>
    </form>
  );
};
