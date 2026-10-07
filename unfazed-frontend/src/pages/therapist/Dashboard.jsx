import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEntitlement } from '../../hooks/useEntitlement';
import { UpgradePrompt } from '../../components/common/UpgradePrompt';
import api from '../../api/axiosInstance';
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  ExternalLink,
  Sparkles,
  Clock,
  Video,
  ChevronRight,
  Shield,
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const { entitlements, switchTier, upgradeModal, openUpgradeModal, closeUpgradeModal } = useEntitlement();
  const [sessions, setSessions] = useState([]);
  const [clientsCount, setClientsCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sessRes, clientRes] = await Promise.all([
          api.get('/scheduling/sessions'),
          api.get('/clients?limit=1'),
        ]);
        setSessions(sessRes.data?.data || []);
        setClientsCount(clientRes.data?.total || 0);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };

    fetchDashboardData();
  }, []);

  const activeTier = user?.subscriptionTier || 'free';
  const slug = user?.slug || 'dr-sharma';

  return (
    <div className="space-y-8">
      {/* Top Welcome Header with Branded Public Link */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-bold text-white">Welcome back, {user?.name}</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                activeTier === 'clinic'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : activeTier === 'pro'
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {activeTier.toUpperCase()} PLAN
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Private Practice Management • India Telehealth Operations
          </p>
        </div>

        {/* Public Booking Link Badge */}
        <div className="flex items-center gap-3">
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-2.5 text-xs font-semibold text-brand-300 hover:bg-brand-500/20 transition-all shadow-sm"
          >
            <span>Public Booking Link: unfazed.in/{slug}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          {/* Instant Tier Switcher Demo Pill */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-850 p-1 border border-slate-800 text-xs">
            <span className="px-2 text-slate-500 font-mono">Test Tier:</span>
            {['free', 'pro', 'clinic'].map((t) => (
              <button
                key={t}
                onClick={() => switchTier(t)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold uppercase transition-all ${
                  activeTier === t
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-850/80 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
            <span>Active Clients</span>
            <Users className="h-4 w-4 text-brand-400" />
          </div>
          <div className="mt-3 font-serif text-3xl font-bold text-white">
            {entitlements?.caps?.activeClients?.current || clientsCount}
            <span className="text-sm text-slate-500 font-sans font-normal ml-1">
              / {entitlements?.caps?.activeClients?.limit || 5} cap
            </span>
          </div>
          {entitlements?.caps?.activeClients?.isCapExceeded && (
            <button
              onClick={() => openUpgradeModal({ title: 'Active Client Cap Reached', targetTier: 'pro' })}
              className="mt-2 text-xs font-semibold text-amber-400 hover:underline"
            >
              Cap Reached • Upgrade to accept more
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-850/80 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
            <span>Scheduled Sessions</span>
            <Calendar className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-3 font-serif text-3xl font-bold text-white">
            {sessions.filter((s) => s.status === 'booked').length}
          </div>
          <p className="mt-1 text-xs text-emerald-400">All instantly confirmed</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-850/80 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
            <span>Clinical Templates</span>
            <FileText className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-3 font-serif text-xl font-bold text-white">
            {entitlements?.features?.soapTemplates ? 'SOAP & DAP Active' : 'Freeform Only'}
          </div>
          {!entitlements?.features?.soapTemplates && (
            <button
              onClick={() => openUpgradeModal({ title: 'Clinical Templates Locked', targetTier: 'pro' })}
              className="mt-2 text-xs font-semibold text-brand-400 hover:underline"
            >
              Unlock SOAP / DAP Templates →
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-850/80 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
            <span>Practice Analytics</span>
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 font-serif text-xl font-bold text-white">
            {entitlements?.features?.advancedAnalytics ? 'Live Aggregations' : 'Locked (Free)'}
          </div>
          <Link to="/analytics" className="mt-2 block text-xs font-semibold text-brand-400 hover:underline">
            View Analytics Hub →
          </Link>
        </div>
      </div>

      {/* Upcoming Sessions List */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-white">Upcoming Therapy Sessions</h3>
            <p className="text-xs text-slate-400">Confirmed sessions ready for tele-consultation</p>
          </div>
          <Link
            to="/schedule"
            className="flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300"
          >
            <span>Manage Weekly Availability</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Calendar className="mx-auto h-8 w-8 text-slate-600 mb-2" />
            <p className="text-sm">No scheduled sessions. Share your booking link to accept appointments.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session._id}
                className="flex flex-wrap items-center justify-between rounded-2xl border border-slate-800 bg-slate-850/60 p-4 transition-all hover:border-slate-700"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 font-bold">
                    {session.client_id?.name ? session.client_id.name.charAt(0) : 'C'}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {session.client_id?.name || 'Private Client'}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-brand-400" />
                        {new Date(session.startTime).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                      <span>• {session.duration} mins</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3 sm:mt-0">
                  <a
                    href={session.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-500"
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>Join Room</span>
                  </a>
                  <Link
                    to={`/notes?session=${session._id}&client=${session.client_id?._id}`}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Clinical Note</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UpgradePrompt
        isOpen={upgradeModal.isOpen}
        onClose={closeUpgradeModal}
        title={upgradeModal.title}
        message={upgradeModal.message}
        targetTier={upgradeModal.targetTier}
        onUpgrade={(tier) => switchTier(tier)}
      />
    </div>
  );
};
