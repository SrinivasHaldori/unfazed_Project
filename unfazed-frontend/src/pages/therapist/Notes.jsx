import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useEntitlement } from '../../hooks/useEntitlement';
import { SoapDapForm } from '../../components/notes/SoapDapForm';
import { UpgradePrompt } from '../../components/common/UpgradePrompt';
import { FileText, Shield, CheckCircle2, Lock, Sparkles, User } from 'lucide-react';

export const Notes = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const clientId = searchParams.get('client');

  const { entitlements, switchTier, upgradeModal, openUpgradeModal, closeUpgradeModal } =
    useEntitlement();

  const [clients, setClients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(clientId || '');
  const [selectedSessionId, setSelectedSessionId] = useState(sessionId || '');
  const [currentNotes, setCurrentNotes] = useState({ privateNote: null, sharedNote: null });
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          api.get('/clients?limit=50'),
          api.get('/scheduling/sessions'),
        ]);
        setClients(cRes.data?.data || []);
        setSessions(sRes.data?.data || []);

        if (!selectedClientId && cRes.data?.data?.length > 0) {
          setSelectedClientId(cRes.data.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to load clients/sessions:', err);
      }
    };

    fetchDropdowns();
  }, []);

  useEffect(() => {
    if (!selectedSessionId) return;

    const fetchSessionNotes = async () => {
      try {
        const { data } = await api.get(`/notes/session/${selectedSessionId}`);
        if (data.success) {
          setCurrentNotes(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch session notes:', err);
      }
    };

    fetchSessionNotes();
  }, [selectedSessionId]);

  const handleSaveNote = async (notePayload) => {
    try {
      const activeSession = selectedSessionId || sessions[0]?._id;
      const activeClient = selectedClientId || clients[0]?._id;

      if (!activeSession || !activeClient) {
        alert('Please select or schedule a session first.');
        return;
      }

      const payload = {
        sessionId: activeSession,
        clientId: activeClient,
        type: notePayload.type,
        templateType: notePayload.templateType,
        content: notePayload.content,
      };

      const { data } = await api.post('/notes', payload);
      if (data.success) {
        setSaveSuccessMessage(`${notePayload.type === 'private' ? 'Private' : 'Shared'} note saved successfully!`);
        setTimeout(() => setSaveSuccessMessage(''), 3000);
      }
    } catch (err) {
      if (err.response?.data?.error === 'FEATURE_LOCKED') {
        openUpgradeModal(err.response.data.upgradePrompt);
      } else {
        alert(err.response?.data?.message || 'Failed to save note');
      }
    }
  };

  const hasTemplateEntitlement = Boolean(entitlements?.features?.soapTemplates);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white">Clinical Documentation</h1>
          <p className="text-xs text-slate-400 mt-1">
            Role-restricted clinical notes: Zero leakage guarantee for client portal.
          </p>
        </div>

        {/* Feature status badge */}
        <div className="flex items-center gap-2">
          {hasTemplateEntitlement ? (
            <span className="flex items-center gap-1.5 rounded-xl bg-brand-500/20 px-3 py-1.5 text-xs font-semibold text-brand-300 border border-brand-500/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span>SOAP & DAP Templates Enabled</span>
            </span>
          ) : (
            <button
              onClick={() =>
                openUpgradeModal({
                  title: 'Unlock Clinical SOAP/DAP Templates',
                  message: 'SOAP and DAP structured templates require a Pro subscription. Free tier includes freeform notes.',
                  targetTier: 'pro',
                })
              }
              className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Clinical Templates Locked (Upgrade to Pro)</span>
            </button>
          )}
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Target Session / Client Picker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Select Client:
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-850 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
          >
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Select Therapy Session:
          </label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-850 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
          >
            {sessions.map((s) => (
              <option key={s._id} value={s._id}>
                {new Date(s.startTime).toLocaleDateString()} - {s.duration} min ({s.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Note Editor Form */}
      <SoapDapForm
        onSave={handleSaveNote}
        hasTemplateEntitlement={hasTemplateEntitlement}
        onLockedClick={openUpgradeModal}
      />

      <UpgradePrompt
        isOpen={upgradeModal.isOpen}
        onClose={closeUpgradeModal}
        title={upgradeModal.title}
        message={upgradeModal.message}
        targetTier={upgradeModal.targetTier}
        onUpgrade={(t) => switchTier(t)}
      />
    </div>
  );
};
