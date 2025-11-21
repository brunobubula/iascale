import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  X, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProgressAlertMonitor({ activeTrades, realtimePrices, onCloseTrade }) {
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const navigate = useNavigate();
  const alertTimersRef = useRef({});

  useEffect(() => {
    if (!activeTrades || activeTrades.length === 0) return;

    const newAlerts = [];

    activeTrades.forEach(trade => {
      if (dismissedAlerts.has(trade.id)) return;

      const isBuy = trade.type === "BUY";
      const leverage = trade.leverage || 1;
      const entryAmount = trade.entry_amount || 0;
      const totalOperatedValue = entryAmount * leverage;
      const entry = trade.entry_price || 0;

      const realtimePrice = realtimePrices[trade.pair]?.price;
      const current = realtimePrice || trade.current_price || trade.entry_price || 0;

      if (entry === 0) return;

      let profitLossPercentage = 0;
      if (isBuy) {
        profitLossPercentage = ((current - entry) / entry) * 100;
      } else {
        profitLossPercentage = ((entry - current) / entry) * 100;
      }

      const profitLossUSD = (profitLossPercentage / 100) * totalOperatedValue;

      // Alerta quando atingir 60% de progresso
      // Progresso = distância até TP ou SL
      const tp = trade.take_profit || 0;
      const sl = trade.stop_loss || 0;

      let progressToTP = 0;
      let progressToSL = 0;

      if (profitLossPercentage > 0 && tp > 0) {
        // Calculando progresso até o TP
        const maxGain = isBuy ? ((tp - entry) / entry) * 100 : ((entry - tp) / entry) * 100;
        if (maxGain > 0) {
          progressToTP = (profitLossPercentage / maxGain) * 100;
        }
      }

      if (profitLossPercentage < 0 && sl > 0) {
        // Calculando progresso até o SL
        const maxLoss = isBuy ? ((sl - entry) / entry) * 100 : ((entry - sl) / entry) * 100;
        if (maxLoss < 0) {
          progressToSL = (profitLossPercentage / maxLoss) * 100;
        }
      }

      const finalProgress = Math.max(progressToTP, progressToSL);

      // Dispara alerta se atingir 60%
      if (finalProgress >= 60 && !alerts.find(a => a.tradeId === trade.id)) {
        newAlerts.push({
          tradeId: trade.id,
          trade: trade,
          profitLossPercentage,
          profitLossUSD,
          progress: finalProgress,
          currentPrice: current,
          timestamp: Date.now()
        });
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts]);
      
      // Enviar notificação do navegador
      newAlerts.forEach(alert => {
        if ("Notification" in window && Notification.permission === "granted") {
          const formattedUSD = `$${Math.abs(alert.profitLossUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          const notification = new Notification(`⚠️ ${alert.trade.pair} atingiu ${alert.progress.toFixed(0)}% do alvo!`, {
            body: `O ativo está em ${alert.profitLossUSD >= 0 ? '+' : ''}${alert.profitLossPercentage.toFixed(2)}% (${alert.profitLossUSD >= 0 ? '+' : ''}${formattedUSD})`,
            icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/57f18d4cb_Art-ScaleCriptoiA-LOGO6mini.png',
            tag: `trade-progress-${alert.tradeId}`
          });

          notification.onclick = () => {
            window.focus();
            navigate(createPageUrl("Dashboard"));
            setTimeout(() => {
              const event = new CustomEvent('scrollToTrade', { detail: { tradeId: alert.tradeId } });
              window.dispatchEvent(event);
            }, 100);
          };
        }
      });

      // Auto-dismiss após 30 segundos
      newAlerts.forEach(alert => {
        alertTimersRef.current[alert.tradeId] = setTimeout(() => {
          handleDismiss(alert.tradeId);
        }, 30000);
      });
    }
  }, [activeTrades, realtimePrices, dismissedAlerts]);

  useEffect(() => {
    return () => {
      Object.values(alertTimersRef.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const handleDismiss = (tradeId) => {
    setAlerts(prev => prev.filter(a => a.tradeId !== tradeId));
    setDismissedAlerts(prev => new Set([...prev, tradeId]));
    
    if (alertTimersRef.current[tradeId]) {
      clearTimeout(alertTimersRef.current[tradeId]);
      delete alertTimersRef.current[tradeId];
    }
  };

  const handleKeep = (tradeId) => {
    handleDismiss(tradeId);
  };

  const handleClose = async (alert) => {
    if (alertTimersRef.current[alert.tradeId]) {
      clearTimeout(alertTimersRef.current[alert.tradeId]);
      delete alertTimersRef.current[alert.tradeId];
    }

    await onCloseTrade(alert.trade, alert.currentPrice, alert.profitLossPercentage, alert.profitLossUSD);
    handleDismiss(alert.tradeId);
  };

  const handleNavigateToTrade = (tradeId) => {
    navigate(createPageUrl("Dashboard"));
    setTimeout(() => {
      const event = new CustomEvent('scrollToTrade', { detail: { tradeId } });
      window.dispatchEvent(event);
    }, 100);
  };

  if (alerts.length === 0) return null;

  // Mobile: agrupar múltiplas notificações
  const isMobile = window.innerWidth < 768;

  if (isMobile && alerts.length > 1) {
    return (
      <div className="fixed bottom-20 right-3 left-3 z-50">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
        >
          <Card className="bg-gradient-to-br from-slate-900/98 to-slate-800/98 border-emerald-500/50 backdrop-blur-xl border-2 shadow-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">
                    {alerts.length} trade{alerts.length > 1 ? 's' : ''} em alerta
                  </h3>
                  <p className="text-xs text-slate-400">Atingiram 60% do alvo</p>
                </div>
              </div>
              <button
                onClick={() => setAlerts([])}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {alerts.map((alert) => {
                const isProfit = alert.profitLossUSD >= 0;
                const formattedUSD = `$${Math.abs(alert.profitLossUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                
                return (
                  <div 
                    key={alert.tradeId}
                    className={`bg-slate-950/50 rounded-lg p-3 border ${
                      isProfit ? 'border-emerald-500/30' : 'border-red-500/30'
                    }`}
                  >
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-sm">{alert.trade.pair}</span>
                          <Badge className={`${
                            alert.trade.type === 'BUY' 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-red-500/20 text-red-400'
                          } text-[10px] px-1.5 py-0.5`}>
                            {alert.trade.type}
                          </Badge>
                        </div>
                        <div className={`text-base font-black ${
                          isProfit ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {isProfit ? '+' : ''}{formattedUSD}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">
                        O ativo atingiu {alert.progress.toFixed(0)}% do {isProfit ? 'Take Profit' : 'Stop Loss'} 
                        {' '}({isProfit ? '+' : ''}{alert.profitLossPercentage.toFixed(2)}%)
                      </p>
                    </div>
                    
                    <div className="flex gap-1.5">
                      <Button
                        onClick={() => handleNavigateToTrade(alert.tradeId)}
                        size="sm"
                        className="flex-1 h-8 text-xs bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500/30"
                      >
                        Ver Trade
                      </Button>
                      <Button
                        onClick={() => handleKeep(alert.tradeId)}
                        size="sm"
                        className="flex-1 h-8 text-xs bg-slate-700/50 text-white hover:bg-slate-700"
                      >
                        Manter Aberto
                      </Button>
                      <Button
                        onClick={() => handleClose(alert)}
                        size="sm"
                        className="flex-1 h-8 text-xs bg-emerald-500 text-white hover:bg-emerald-600"
                      >
                        Fechar Trade
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-3 md:right-6 z-50 space-y-2 max-w-md w-full md:w-auto px-3 md:px-0">
      <AnimatePresence>
        {alerts.map((alert) => {
          const isProfit = alert.profitLossUSD >= 0;
          
          return (
            <motion.div
              key={alert.tradeId}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Card className={`bg-gradient-to-br ${
                isProfit 
                  ? 'from-emerald-900/95 to-teal-900/95 border-emerald-500/50' 
                  : 'from-red-900/95 to-orange-900/95 border-red-500/50'
              } backdrop-blur-xl border-2 shadow-2xl p-4`}>
                {/* Desktop: layout horizontal */}
                <div className="hidden md:block">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${
                        isProfit ? 'bg-emerald-500/30' : 'bg-red-500/30'
                      } flex items-center justify-center flex-shrink-0`}>
                        {isProfit ? (
                          <TrendingUp className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-bold text-base">{alert.trade.pair}</h3>
                          <Badge className={`${
                            alert.trade.type === 'BUY' 
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          } border text-xs px-2 py-0.5`}>
                            {alert.trade.type}
                          </Badge>
                          {(alert.trade.leverage || 1) > 1 && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 border text-xs px-2 py-0.5">
                              {alert.trade.leverage}x
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-300">
                          O ativo atingiu <span className="font-bold text-white">{alert.progress.toFixed(0)}%</span> do {isProfit ? 'Take Profit' : 'Stop Loss'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDismiss(alert.tradeId)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-slate-950/50 rounded-lg p-3 mb-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-slate-400 text-xs mb-1">Lucro/Perda</div>
                        <div className={`text-xl font-black ${
                          isProfit ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {isProfit ? '+' : ''}{formattedUSD}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs mb-1">Percentual</div>
                        <div className={`text-xl font-black ${
                          isProfit ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {isProfit ? '+' : ''}{alert.profitLossPercentage.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleNavigateToTrade(alert.tradeId)}
                      size="sm"
                      className="flex-1 h-9 text-sm bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Ver Trade
                    </Button>
                    <Button
                      onClick={() => handleKeep(alert.tradeId)}
                      size="sm"
                      className="flex-1 h-9 text-sm bg-slate-700/50 border border-slate-600 text-white hover:bg-slate-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Manter
                    </Button>
                    <Button
                      onClick={() => handleClose(alert)}
                      size="sm"
                      className="flex-1 h-9 text-sm bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Fechar
                    </Button>
                  </div>
                </div>

                {/* Mobile: layout vertical */}
                <div className="md:hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-lg ${
                        isProfit ? 'bg-emerald-500/30' : 'bg-red-500/30'
                      } flex items-center justify-center`}>
                        {isProfit ? (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-white font-bold text-sm">{alert.trade.pair}</h3>
                          <Badge className={`${
                            alert.trade.type === 'BUY' 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-red-500/20 text-red-400'
                          } text-[10px] px-1.5 py-0.5`}>
                            {alert.trade.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400">Atingiu {alert.progress.toFixed(0)}%</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDismiss(alert.tradeId)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-slate-950/50 rounded-lg p-3 mb-3">
                    <div className={`text-xl font-black text-center mb-1 ${
                      isProfit ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {isProfit ? '+' : ''}${Math.abs(alert.profitLossUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs font-bold text-center ${
                      isProfit ? 'text-emerald-400/70' : 'text-red-400/70'
                    }`}>
                      {isProfit ? '+' : ''}{alert.profitLossPercentage.toFixed(2)}%
                    </div>
                    <p className="text-xs text-slate-400 text-center mt-1">
                      Atingiu {alert.progress.toFixed(0)}% do {isProfit ? 'TP' : 'SL'}
                    </p>
                  </div>

                  <div className="flex gap-1.5">
                    <Button
                      onClick={() => handleNavigateToTrade(alert.tradeId)}
                      size="sm"
                      className="flex-1 h-9 text-xs bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500/30"
                    >
                      Ver
                    </Button>
                    <Button
                      onClick={() => handleKeep(alert.tradeId)}
                      size="sm"
                      className="flex-1 h-9 text-xs bg-slate-700/50 text-white hover:bg-slate-700"
                    >
                      Manter
                    </Button>
                    <Button
                      onClick={() => handleClose(alert)}
                      size="sm"
                      className="flex-1 h-9 text-xs bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}