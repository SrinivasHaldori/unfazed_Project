import { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

/**
 * Custom React hook for client-side entitlement evaluation and upgrade prompt state.
 */
export const useEntitlement = () => {
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgradeModal, setUpgradeModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    targetTier: 'pro',
    actionText: 'Upgrade Plan',
  });

  const fetchEntitlements = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.get('/therapists/entitlements');
      if (data.success) {
        setEntitlements(data.data);
      }
    } catch (err) {
      console.error('Failed to load entitlements:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  /**
   * Evaluates feature access synchronously on the client against loaded entitlements.
   */
  const canAccess = useCallback(
    (featureKey) => {
      if (!entitlements) return false;

      if (featureKey === 'active_clients_cap') {
        const { current, limit } = entitlements.caps.activeClients;
        return current < limit;
      }

      if (featureKey === 'soap_templates') {
        return Boolean(entitlements.features?.soapTemplates);
      }

      if (featureKey === 'advanced_analytics') {
        return Boolean(entitlements.features?.advancedAnalytics);
      }

      return false;
    },
    [entitlements]
  );

  const openUpgradeModal = (promptData = {}) => {
    setUpgradeModal({
      isOpen: true,
      title: promptData.title || 'Upgrade Required',
      message: promptData.message || 'This feature is available on the Pro plan.',
      targetTier: promptData.targetTier || 'pro',
      actionText: promptData.actionText || 'Upgrade to Pro',
    });
  };

  const closeUpgradeModal = () => {
    setUpgradeModal((prev) => ({ ...prev, isOpen: false }));
  };

  /**
   * Fast tier switch for instant testing/demo in non-payment environment
   */
  const switchTier = async (newTier) => {
    try {
      const { data } = await api.post('/therapists/tier/update', { tier: newTier });
      if (data.success) {
        setEntitlements(data.entitlements);
        closeUpgradeModal();
        return true;
      }
    } catch (err) {
      console.error('Failed to change tier:', err);
      return false;
    }
  };

  return {
    entitlements,
    loading,
    canAccess,
    upgradeModal,
    openUpgradeModal,
    closeUpgradeModal,
    switchTier,
    refreshEntitlements: fetchEntitlements,
  };
};
