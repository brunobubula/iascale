
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useCryptoPrice } from "./useCryptoPrice";
import { AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AlertNotification from "./AlertNotification";

export default function TradeMonitor({ trades = [] }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeNotifications, setActiveNotifications] = useState([]);
  
  const triggeredAlertsRef = useRef(new Set()); // This will now track both processing status and shown notifications
  const dismissTimersRef = useRef(new Map());
  const [hoveredNotifications, setHoveredNotifications] = useState(new Set());

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const activeTrades = Array.isArray(trades) ? trades.filter(t => t?.status === "ACTIVE") : [];
  const tradePairs = [...new Set(activeTrades.map(t => t?.pair).filter(Boolean))];
  
  const prices = useCryptoPrice(tradePairs);

  const sendBrowserNotification = (trade, statusType) => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const notificationsEnabled = user?.notifications_enabled !== false;
    if (!notificationsEnabled) return;

    const title = statusType === "TAKE_PROFIT_HIT" 
      ? "🎉 Take Profit Atingido!" 
      : "⚠️ Stop Loss Atingido!";
    
    const profitLoss = trade.profit_loss_usd || 0;
    const body = `${trade.pair} - ${profitLoss >= 0 ? '+' : ''}$${profitLoss.toFixed(2)}`;

    new Notification(title, {
      body: body,
      icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/57f18d4cb_Art-ScaleCriptoiA-LOGO6mini.png',
      badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/57f18d4cb_Art-ScaleCriptoiA-LOGO6mini.png',
      tag: `trade-${trade.id}`,
      requireInteraction: false
    });
  };

  const showNotification = (trade, statusType) => {
    const notificationKey = `tpsl-notification-${trade.id}-${statusType}`; // Unique key for this specific notification type
    if (triggeredAlertsRef.current.has(notificationKey)) {
      return; // Already showed this specific notification
    }
    
    triggeredAlertsRef.current.add(notificationKey); // Mark this specific notification as shown
    
    const notificationId = `trade-${trade.id}-${statusType}`; // ID for the UI component
    
    setActiveNotifications(prev => {
      const filtered = prev.filter(n => n.id !== notificationId);
      return [
        ...filtered,
        { 
          id: notificationId, 
          trade: trade,
          statusType: statusType,
          isTPSL: true
        }
      ];
    });

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

    // Optionally remove the notificationKey from triggeredAlertsRef if we want to allow showing it again
    // For TP/SL, it's usually a one-time event per trade, so we keep it.
  };

  const handleHoverChange = (notificationId, isHovering) => {
    if (isHovering) {
      if (dismissTimersRef.current.has(notificationId)) {
        clearTimeout(dismissTimersRef.current.get(notificationId));
        dismissTimersRef.current.delete(notificationId);
      }
      
      setHoveredNotifications(prev => new Set(prev).add(notificationId));
    } else {
      // Only set a timer to dismiss if it's not already dismissed or going to be dismissed
      if (!dismissTimersRef.current.has(notificationId)) {
        const timerId = setTimeout(() => {
          dismissNotification(notificationId);
        }, 7000);
        
        dismissTimersRef.current.set(notificationId, timerId);
      }
      
      setHoveredNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleNavigateToAnalisePL = (notificationId) => {
    dismissNotification(notificationId);
    navigate(createPageUrl("AnalisePL"));
  };

  const updateTradeMutation = useMutation({
    mutationFn: async ({ tradeId, updateData }) => {
      return await base44.entities.TradeSignal.update(tradeId, updateData);
    },
    onMutate: async (variables) => {
      // Mark trade as processing
      triggeredAlertsRef.current.add(variables.tradeId);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      
      // If this was a TP/SL update, keep it marked so we don't re-trigger it.
      // If it was just a background price update, remove the processing flag.
      if (variables.updateData.status !== "TAKE_PROFIT_HIT" && variables.updateData.status !== "STOP_LOSS_HIT") {
        triggeredAlertsRef.current.delete(variables.tradeId);
      }

      if (variables.updateData.status === "TAKE_PROFIT_HIT" || variables.updateData.status === "STOP_LOSS_HIT") {
        const statusType = variables.updateData.status;
        const trade = activeTrades.find(t => t?.id === variables.tradeId);
        
        if (trade) {
          showNotification({...trade, ...variables.updateData}, statusType);
          sendBrowserNotification({...trade, ...variables.updateData}, statusType);
        }
      }
    },
    onError: (error, variables) => {
      console.error("Erro ao atualizar trade:", error);
      // Remove processing flag on error
      if (variables.tradeId) {
        triggeredAlertsRef.current.delete(variables.tradeId);
      }
    }
  });

  useEffect(() => {
    if (!Array.isArray(activeTrades) || activeTrades.length === 0) {
      return;
    }

    const backgroundTimers = {};

    const checkTrades = () => {
      activeTrades.forEach(trade => {
        // If trade is already being processed or has already triggered a TP/SL alert, skip.
        if (!trade?.id || !trade?.pair || triggeredAlertsRef.current.has(trade.id)) {
          return;
        }

        const priceData = prices[trade.pair];
        const currentPrice = priceData?.price;
        
        if (!currentPrice || currentPrice === 0) return;

        // Calculate P&L regardless of previous price, as this is used for TP/SL check and for background updates
        const isBuy = trade.type === "BUY";
        const entryAmount = trade.entry_amount || 0;
        const leverage = trade.leverage || 1;
        const totalOperatedValue = entryAmount * leverage;

        const profitLossPercentage = isBuy
          ? ((currentPrice - trade.entry_price) / trade.entry_price) * 100
          : ((trade.entry_price - currentPrice) / trade.entry_price) * 100;

        const profitLossUSD = (profitLossPercentage / 100) * totalOperatedValue;

        const updateData = {
          current_price: currentPrice,
          profit_loss_percentage: profitLossPercentage,
          profit_loss_usd: profitLossUSD
        };

        const takeProfitHit = trade.take_profit && (isBuy 
          ? currentPrice >= trade.take_profit * 0.9999
          : currentPrice <= trade.take_profit * 1.0001);

        const stopLossHit = trade.stop_loss && (isBuy 
          ? currentPrice <= trade.stop_loss * 1.0001
          : currentPrice >= trade.stop_loss * 0.9999);

        if (takeProfitHit || stopLossHit) {
          // Mark trade as processing/handled by an alert
          triggeredAlertsRef.current.add(trade.id);
          
          updateData.status = takeProfitHit ? "TAKE_PROFIT_HIT" : "STOP_LOSS_HIT";
          
          updateTradeMutation.mutate({ tradeId: trade.id, updateData });
        } else {
          // Schedule a background update for current price and P&L if not already scheduled
          if (!backgroundTimers[trade.id]) {
            backgroundTimers[trade.id] = setTimeout(() => {
              // Only update if the trade hasn't already triggered an alert or been updated by another process
              if (!triggeredAlertsRef.current.has(trade.id)) {
                updateTradeMutation.mutate({ tradeId: trade.id, updateData });
              }
              delete backgroundTimers[trade.id];
            }, 30000); // Update every 30 seconds
          }
        }
      });
    };

    checkTrades();
    
    const intervalId = setInterval(checkTrades, 1000); // Check for TP/SL hits every second

    return () => {
      clearInterval(intervalId);
      Object.values(backgroundTimers).forEach(timer => clearTimeout(timer));
    };
  }, [activeTrades, prices, updateTradeMutation]);

  useEffect(() => {
    return () => {
      dismissTimersRef.current.forEach(timer => clearTimeout(timer));
      dismissTimersRef.current.clear();
      triggeredAlertsRef.current.clear(); // Clear all processing/shown flags on unmount
    };
  }, []);

  return (
    <AnimatePresence>
      {activeNotifications.map((notification) => (
        <AlertNotification
          key={notification.id}
          alert={notification.isTPSL ? { 
            name: notification.statusType === "TAKE_PROFIT_HIT" ? "Take Profit Atingido!" : "Stop Loss Atingido!",
            isTPSL: true 
          } : notification.alert}
          trade={notification.trade}
          onDismiss={() => dismissNotification(notification.id)}
          onNavigate={() => handleNavigateToAnalisePL(notification.id)}
          onHoverChange={(isHovering) => handleHoverChange(notification.id, isHovering)}
        />
      ))}
    </AnimatePresence>
  );
}
