import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, Users, AlertTriangle, CheckCircle, Lock } from 'lucide-react';

export const AggregationCharts = ({
  analyticsData = null,
  hasEntitlement = false,
  onUnlockClick,
}) => {
  if (!hasEntitlement) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 p-12 text-center backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 mb-4 border border-brand-500/20">
          <Lock className="h-8 w-8" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-white mb-2">
          Clinical & Operational Practice Analytics
        </h3>
        <p className="mx-auto max-w-md text-sm text-slate-400 mb-6">
          Access high-resolution MongoDB aggregation pipelines computing your monthly session volume, client retention cohorts, and attendance reliability rates.
        </p>
        <button
          onClick={() =>
            onUnlockClick({
              title: 'Unlock Advanced Practice Analytics',
              message: 'Practice Analytics is available on Pro and Clinic tiers.',
              targetTier: 'pro',
            })
          }
          className="rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 hover:opacity-95"
        >
          Upgrade to View Practice Analytics
        </button>
      </div>
    );
  }

  const { monthlySessions = [], retentionMetrics = {}, reliabilityRates = {} } =
    analyticsData || {};
  const summary = retentionMetrics.summary || {};
  const cohorts = retentionMetrics.cohorts || [];

  const pieData = [
    { name: 'Completed', value: reliabilityRates.completed || 0, color: '#14b8a6' },
    { name: 'Cancelled', value: reliabilityRates.cancelled || 0, color: '#f43f5e' },
    { name: 'No-Show', value: reliabilityRates.noShows || 0, color: '#f59e0b' },
    { name: 'Upcoming', value: reliabilityRates.upcomingBooked || 0, color: '#38bdf8' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-850 p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
            <span>Client Retention Rate</span>
            <TrendingUp className="h-4 w-4 text-brand-400" />
          </div>
          <div className="mt-3 font-serif text-3xl font-bold text-white">
            {summary.retentionRatePercentage || 0}%
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {summary.retainedClients || 0} of {summary.totalClientsEngaged || 0} clients completed 2+ sessions
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-850 p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
            <span>Avg Sessions / Client</span>
            <Users className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-3 font-serif text-3xl font-bold text-white">
            {summary.avgSessionsPerClient || 0}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {summary.longTermRetainedClients || 0} clients with 5+ ongoing sessions
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-850 p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
            <span>No-Show Rate</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 font-serif text-3xl font-bold text-amber-400">
            {reliabilityRates.noShowRate || 0}%
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {reliabilityRates.noShows || 0} unexcused missed appointments
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-850 p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
            <span>Cancellation Rate</span>
            <CheckCircle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-3 font-serif text-3xl font-bold text-rose-400">
            {reliabilityRates.cancellationRate || 0}%
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {reliabilityRates.cancelled || 0} cancelled by therapist or client
          </p>
        </div>
      </div>

      {/* Chart Section: Monthly Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-850 p-6 shadow-xl">
          <h4 className="font-serif text-lg font-bold text-white mb-1">
            Monthly Session Trajectory (India IST)
          </h4>
          <p className="text-xs text-slate-400 mb-6">Aggregated via pure MongoDB pipeline</p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySessions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Bar dataKey="completedSessions" name="Completed" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bookedUpcoming" name="Booked" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelledSessions" name="Cancelled" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="noShowSessions" name="No-Show" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointment Status Breakdown Pie */}
        <div className="rounded-2xl border border-slate-800 bg-slate-850 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="font-serif text-lg font-bold text-white mb-1">
              Attendance Distribution
            </h4>
            <p className="text-xs text-slate-400 mb-4">Total scheduled appointments</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-300">
                  {d.name}: {d.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
