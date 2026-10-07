import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { useEntitlement } from '../../hooks/useEntitlement';
import { UpgradePrompt } from '../../components/common/UpgradePrompt';
import {
  Users,
  Search,
  Tag,
  ShieldCheck,
  Calendar,
  FileText,
  UserPlus,
  ChevronRight,
  X,
  Phone,
  Mail,
  AlertCircle,
} from 'lucide-react';

export const Clients = () => {
  const { entitlements, switchTier, upgradeModal, openUpgradeModal, closeUpgradeModal } =
    useEntitlement();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetailData, setClientDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (searchTerm) query.append('search', searchTerm);
      if (statusFilter) query.append('status', statusFilter);

      const { data } = await api.get(`/clients?${query.toString()}`);
      if (data.success) {
        setClients(data.data);
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [searchTerm, statusFilter]);

  const handleSelectClient = async (client) => {
    setSelectedClient(client);
    try {
      setLoadingDetail(true);
      const { data } = await api.get(`/clients/${client._id}`);
      if (data.success) {
        setClientDetailData(data.data);
      }
    } catch (err) {
      console.error('Failed to load client details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const activeCap = entitlements?.caps?.activeClients;
  const isCapExceeded = activeCap?.isCapExceeded;

  return (
    <div className="space-y-6">
      {/* Header and Cap Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white">Client CRM & Intakes</h1>
          <p className="text-xs text-slate-400 mt-1">
            Auditable consent records, intake assessments, and longitudinal care tracking
          </p>
        </div>

        {/* Active Client Cap Badge */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-850 px-4 py-2 text-xs">
            <span className="text-slate-400">Active Clients: </span>
            <span className="font-bold text-white">
              {activeCap?.current || clients.length} / {activeCap?.limit || 5}
            </span>
          </div>

          {isCapExceeded && (
            <button
              onClick={() =>
                openUpgradeModal({
                  title: 'Active Client Limit Reached',
                  message: 'Your current tier has reached its active client capacity. Upgrade to accept more clients.',
                  targetTier: 'pro',
                })
              }
              className="rounded-xl bg-amber-500/20 border border-amber-500/30 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-all"
            >
              Upgrade Cap →
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by client name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:border-brand-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Main CRM Table & Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden ${selectedClient ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-850/80 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Tags</th>
                  <th className="py-3.5 px-4">Digital Consent</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Loading clients roster...
                    </td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No clients found.
                    </td>
                  </tr>
                ) : (
                  clients.map((c) => (
                    <tr
                      key={c._id}
                      onClick={() => handleSelectClient(c)}
                      className={`cursor-pointer hover:bg-slate-850/60 transition-colors ${
                        selectedClient?._id === c._id ? 'bg-brand-500/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/20 text-brand-300 font-bold text-xs">
                            {c.name.charAt(0)}
                          </div>
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div>{c.email}</div>
                        <div className="text-[11px] text-slate-500">{c.phone || 'No phone'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            c.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {c.tags?.map((t, idx) => (
                            <span key={idx} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {c.consentGiven ? (
                          <div className="flex items-center gap-1 text-emerald-400 text-[11px]">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Signed ({new Date(c.consentTimestamp).toLocaleDateString()})</span>
                          </div>
                        ) : (
                          <span className="text-amber-400 text-[11px]">Pending</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <ChevronRight className="h-4 w-4 text-slate-500 inline" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client Detail Drawer */}
        {selectedClient && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">{selectedClient.name}</h3>
                <p className="text-xs text-slate-400">{selectedClient.email}</p>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading full client dossier...</div>
            ) : clientDetailData ? (
              <div className="space-y-4 text-xs">
                {/* Auditable Consent Record */}
                <div className="rounded-xl border border-slate-800 bg-slate-850 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-brand-400 font-semibold uppercase text-[10px]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Auditable Digital Consent Record</span>
                  </div>
                  <p className="text-slate-300">
                    Timestamp: {new Date(selectedClient.consentTimestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                  </p>
                  <p className="text-slate-500 font-mono text-[10px]">
                    IP Address: {selectedClient.consentIpAddress || 'Verified Telehealth Origin'} • Version: {selectedClient.consentTextVersion}
                  </p>
                </div>

                {/* Intake Data */}
                <div>
                  <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] mb-2">
                    Intake Information:
                  </h4>
                  <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-850 p-3.5">
                    <div>
                      <span className="text-slate-500">Presenting Concern:</span>
                      <p className="text-slate-200 mt-0.5">
                        {clientDetailData.client.intakeData?.presentingConcern || 'None specified'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Goals for Therapy:</span>
                      <p className="text-slate-200 mt-0.5">
                        {clientDetailData.client.intakeData?.goals || 'None specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Aggregated Care Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="rounded-xl bg-slate-850 p-3 text-center border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Sessions</span>
                    <div className="font-serif text-xl font-bold text-white mt-1">
                      {clientDetailData.metrics.totalSessions}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-850 p-3 text-center border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Completed</span>
                    <div className="font-serif text-xl font-bold text-emerald-400 mt-1">
                      {clientDetailData.metrics.completedSessions}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

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
