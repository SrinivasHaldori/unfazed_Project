import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { Shield, FileText, Calendar, MessageSquare, Video, CheckCircle, Clock } from 'lucide-react';

export const ClientPortal = () => {
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'sessions' | 'chat'
  const [sharedNotes, setSharedNotes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientInfo, setClientInfo] = useState({
    id: 'client-demo-id',
    name: 'Ananya Roy',
    email: 'ananya@example.com',
    therapistId: 'therapist-demo-id',
    therapistName: 'Dr. Sharma',
  });

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        setLoading(true);
        // In real portal session, client token is injected in axios headers
        const notesRes = await api.get('/notes/portal/my-notes').catch(() => ({ data: { data: [] } }));
        setSharedNotes(notesRes.data?.data || []);
      } catch (err) {
        console.error('Error loading portal data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortalData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Portal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-400">
              <Shield className="h-4 w-4" />
              <span>Unfazed Client Portal</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-white mt-1">
              Welcome, {clientInfo.name}
            </h1>
            <p className="text-xs text-slate-400">
              Therapist: <span className="text-brand-300 font-medium">{clientInfo.therapistName}</span>
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-900 p-1.5 border border-slate-800">
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                activeTab === 'notes'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Shared Clinical Notes</span>
            </button>

            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                activeTab === 'sessions'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>My Appointments</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Direct Chat</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Shared Notes (Zero Leakage Guarantee) */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4 text-xs text-teal-300 flex items-center gap-3">
              <Shield className="h-5 w-5 shrink-0" />
              <span>
                <strong>Confidential Shared Notes:</strong> These are summary takeaways, homework assignments, and treatment goals shared by your therapist. Private clinician notes remain strictly confidential and quarantined on the therapist server.
              </span>
            </div>

            {sharedNotes.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
                <FileText className="mx-auto h-10 w-10 text-slate-600 mb-3" />
                <h4 className="text-sm font-semibold text-white">No Shared Notes Yet</h4>
                <p className="text-xs mt-1">Your therapist will post shared action items and reflections here following your sessions.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {sharedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs text-slate-400">
                      <span className="font-semibold text-brand-300">
                        Shared Care Summary ({note.templateType})
                      </span>
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="text-sm leading-relaxed text-slate-200">
                      {note.content?.body ? (
                        <p>{note.content.body}</p>
                      ) : note.content?.plan ? (
                        <div>
                          <strong className="text-brand-300">Agreed Action Plan:</strong>
                          <p className="mt-1">{note.content.plan}</p>
                        </div>
                      ) : (
                        <p className="italic text-slate-500">Summary note recorded.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Sessions */}
        {activeTab === 'sessions' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
            <h3 className="font-serif text-lg font-bold text-white mb-4">Confirmed Telehealth Appointments</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-850 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">50-Min Psychotherapy Session</h4>
                    <p className="text-xs text-slate-400">Status: <span className="text-emerald-400 font-medium">Confirmed (No Payment Needed)</span></p>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500">
                  <Video className="h-3.5 w-3.5" />
                  <span>Join Video Room</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Real-Time Chat */}
        {activeTab === 'chat' && (
          <ChatWindow
            therapistId={clientInfo.therapistId}
            clientId={clientInfo.id}
            currentUserRole="client"
            currentUserName={clientInfo.name}
          />
        )}
      </div>
    </div>
  );
};
