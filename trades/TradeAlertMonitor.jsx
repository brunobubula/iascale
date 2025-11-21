import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCryptoPrice } from "./useCryptoPrice";
import { AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AlertNotification from "./AlertNotification";

export default function TradeAlertMonitor({ trades = [] }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeNotifications, setActiveNotifications] = useState([]);
  
  const triggeredAlertsRef = useRef(new Set());
  const dismissTimersRef = useRef(new Map());
  const [hoveredNotifications, setHoveredNotifications] = useState(new Set());

  const { data: alerts = [] } = useQuery({
    queryKey: ['tradeAlerts'],
    queryFn: () => base44.entities.TradeAlert.list(),
    initialData: [],
    refetchInterval: 5000,
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const validTrades = Array.isArray(trades) ? trades : [];
  const activeTrades = validTrades.filter(t => t?.status === "ACTIVE");
  const tradePairs = [...new Set(activeTrades.map(t => t?.pair).filter(Boolean))];
  
  const prices = useCryptoPrice(tradePairs);

  const triggerAlertMutation = useMutation({
    mutationFn: async (alertId) => {
      return await base44.entities.TradeAlert.update(alertId, {
        is_active: false,
        triggered_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradeAlerts'] });
    }
  });

  const sendBrowserNotification = (alert, trade) => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const notificationsEnabled = user?.notifications_enabled !== false;
    if (!notificationsEnabled) return;

    let conditionText = "";
    if (alert.condition_type === "price") {
      conditionText = `Preço ultrapassou $${alert.condition_value.toFixed(2)}`;
    } else if (alert.condition_type === "pl_percentage") {
      conditionText = `P/L ultrapassou ${alert.condition_value >= 0 ? '+' : ''}${alert.condition_value}%`;
    } else if (alert.condition_type === "pl_usd") {
      conditionText = `P/L ultrapassou ${alert.condition_value >= 0 ? '+$' : '$'}${alert.condition_value.toFixed(2)}`;
    }

    new Notification(`🔔 ${alert.name}`, {
      body: `${trade.pair} - ${conditionText}`,
      icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/57f18d4cb_Art-ScaleCriptoiA-LOGO6mini.png',
      badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/57f18d4cb_Art-ScaleCriptoiA-LOGO6mini.png',
      tag: `alert-${alert.id}`,
      requireInteraction: false
    });
  };

  const showNotification = (alert, trade) => {
    const notificationId = `${alert.id}-${Date.now()}`;
    
    setActiveNotifications(prev => [
      ...prev,
      { id: notificationId, alert, trade, isTPSL: false }
    ]);

    const timerId = setTimeout(() => {
      dismissNotification(notificationId);
    }, 7000);
    
    dismissTimersRef.current.set(notificationId, timerId);
  };

  const dismissNotification = (notificationId) => {
    if (dismissTimersRef.current.has(notificationId)) {
      clearTimeout(dismissTimersRef.current.get(notificationId));
      dismissTimersRef.current.delete(notificationId);
    }
    
    setActiveNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    setHoveredNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(notificationId);
      return newSet;
    });
  };

  const handleHoverChange = (notificationId, isHovering) => {
    if (isHovering) {
      if (dismissTimersRef.current.has(notificationId)) {
        clearTimeout(dismissTimersRef.current.get(notificationId));
        dismissTimersRef.current.delete(notificationId);
      }
      
      setHoveredNotifications(prev => new Set(prev).add(notificationId));
    } else {
      const timerId = setTimeout(() => {
        dismissNotification(notificationId);
      }, 7000);
      
      dismissTimersRef.current.set(notificationId, timerId);
      
      setHoveredNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleNavigateToTrade = (tradeId, notificationId) => {
    dismissNotification(notificationId);
    
    const isDashboard = location.pathname === createPageUrl("Dashboard");
    
    if (isDashboard) {
      window.history.replaceState({}, '', `${createPageUrl("Dashboard")}?alert_trade=${tradeId}`);
      window.dispatchEvent(new CustomEvent('scrollToTrade', { detail: { tradeId } }));
    } else {
      navigate(`${createPageUrl("Dashboard")}?alert_trade=${tradeId}`);
    }
  };

  useEffect(() => {
    const validAlerts = Array.isArray(alerts) ? alerts : [];
    if (validAlerts.length === 0 || activeTrades.length === 0) return;

    const activeAlerts = validAlerts.filter(a => a?.is_active && !a?.triggered_at);

    activeAlerts.forEach(alert => {
      if (!alert?.trade_id || !alert?.id) return;
      
      if (triggeredAlertsRef.current.has(alert.id)) {
        return;
      }
      
      const trade = activeTrades.find(t => t?.id === alert.trade_id);
      if (!trade || !trade.pair) return;

      const priceData = prices[trade.pair];
      const currentPrice = priceData?.price || trade.current_price;
      if (!currentPrice) return;

      const isBuy = trade.type === "BUY";
      const entryAmount = trade.entry_amount || 0;
      const leverage = trade.leverage || 1;
      const totalOperatedValue = entryAmount * leverage;

      const profitLossPercentage = isBuy
        ? ((currentPrice - trade.entry_price) / trade.entry_price) * 100
        : ((trade.entry_price - currentPrice) / trade.entry_price) * 100;

      const profitLossUSD = (profitLossPercentage / 100) * totalOperatedValue;

      let conditionMet = false;

      if (alert.condition_type === "price") {
        conditionMet = currentPrice >= alert.condition_value;
      } else if (alert.condition_type === "pl_percentage") {
        if (alert.condition_value >= 0) {
          conditionMet = profitLossPercentage >= alert.condition_value;
        } else {
          conditionMet = profitLossPercentage <= alert.condition_value;
        }
      } else if (alert.condition_type === "pl_usd") {
        if (alert.condition_value >= 0) {
          conditionMet = profitLossUSD >= alert.condition_value;
        } else {
          conditionMet = profitLossUSD <= alert.condition_value;
        }
      }

      if (conditionMet) {
        triggeredAlertsRef.current.add(alert.id);
        
        showNotification(alert, {
          ...trade,
          current_price: currentPrice,
          profit_loss_percentage: profitLossPercentage,
          profit_loss_usd: profitLossUSD
        });
        
        sendBrowserNotification(alert, trade);
        
        triggerAlertMutation.mutate(alert.id);
      }
    });
  }, [alerts, activeTrades, prices, user]);

  useEffect(() => {
    const validAlerts = Array.isArray(alerts) ? alerts : [];
    const activeAlertIds = new Set(validAlerts.filter(a => a?.is_active && !a?.triggered_at).map(a => a.id));
    
    triggeredAlertsRef.current.forEach(alertId => {
      if (!activeAlertIds.has(alertId)) {
        triggeredAlertsRef.current.delete(alertId);
      }
    });
  }, [alerts]);

  useEffect(() => {
    return () => {
      dismissTimersRef.current.forEach(timer => clearTimeout(timer));
      dismissTimersRef.current.clear();
    };
  }, []);

  return (
    <AnimatePresence>
      {activeNotifications.map((notification) => (
        <AlertNotification
          key={notification.id}
          alert={notification.alert}
          trade={notification.trade}
          onDismiss={() => dismissNotification(notification.id)}
          onNavigate={() => handleNavigateToTrade(notification.trade.id, notification.id)}
          onHoverChange={(isHovering) => handleHoverChange(notification.id, isHovering)}
        />
      ))}
    </AnimatePresence>
  );
}