import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { useEntitlement } from '../../hooks/useEntitlement';
import { AggregationCharts } from '../../components/analytics/AggregationCharts';
import { UpgradePrompt } from '../../components/common/UpgradePrompt';
import { TrendingUp, Sparkles, RefreshCw } from 'lucide-react';

export const Analytics = () => {
  const { entitlements, switchTier, upgradeModal, openUpgradeModal, closeUpgradeModal } =
    useEntitlement();

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hasEntitlement = Boolean(entitlements?.features?.advancedAnalytics);

  const fetchAnalytics = async () => {
    if (!hasEntitlement) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/analytics/dashboard');
      if (data.success) {
        setAnalyticsData(data.data);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError('UPGRADE_REQUIRED');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [hasEntitlement]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white">Practice Analytics Hub</h1>
          <p className="text-xs text-slate-400 mt-1">
            Pure MongoDB aggregation pipelines for monthly volume, client retention cohorts, and attendance reliability
          </p>
        </div>

        {hasEntitlement && (
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Pipelines</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Computing MongoDB analytics pipelines...</div>
      ) : (
        <AggregationCharts
          analyticsData={analyticsData}
          hasEntitlement={hasEntitlement}
          onUnlockClick={openUpgradeModal}
        />
      )}

      <UpgradePrompt
        isOpen={upgradeModal.isOpen}
        onClose={closeUpgradeModal}
        title={upgradeModal.title}
        message={upgradeModal.message}
        targetTier={upgradeModal.targetTier}
        onUpgrade={async (t) => {
          await switchTier(t);
          fetchAnalytics();
        }}
      />
    </div>
  );
};
