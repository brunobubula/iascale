import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUpDown, Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function FloatingPLCard({ openPLData, hideBalances, setHideBalances, user, activeTrades = [], realtimePrices = {} }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const queryClient = useQueryClient();

  const closeAllPositionsMutation = useMutation({
    mutationFn: async () => {
      const validTrades = Array.isArray(activeTrades) ? activeTrades : [];
      const closePromises = validTrades.map(async (trade) => {
        const isBuy = trade?.type === "BUY";
        const leverage = trade?.leverage || 1;
        const entryAmount = trade?.entry_amount || 0;
        const totalOperatedValue = entryAmount * leverage;
        const entry = trade?.entry_price || 0;
        const realtimePrice = realtimePrices[trade?.pair]?.price;
        const current = realtimePrice || trade?.current_price || trade?.entry_price || 0;

        let profitLoss = 0;
        if (entry !== 0) {
          if (isBuy) {
            profitLoss = ((current - entry) / entry) * 100;
          } else {
            profitLoss = ((entry - current) / entry) * 100;
          }
        }

        const profitLossUSD = (profitLoss / 100) * totalOperatedValue;

        return await base44.entities.TradeSignal.update(trade.id, {
          status: "CLOSED",
          current_price: current,
          profit_loss_percentage: profitLoss,
          profit_loss_usd: profitLossUSD
        });
      });

      return await Promise.all(closePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      setShowCloseDialog(false);
      setIsExpanded(false);
    },
    onError: (error) => {
      console.error("Erro ao fechar todas as posições:", error);
      alert("❌ Erro ao fechar posições. Tente novamente.");
    }
  });

  const validActiveTrades = Array.isArray(activeTrades) ? activeTrades : [];

  if (!openPLData || validActiveTrades.length === 0) return null;

  const initialBalance = user?.initial_balance || 0;
  const profitabilityPercent = initialBalance > 0 
    ? (openPLData.totalPLUSD / initialBalance) * 100 
    : 0;
  const showFireEmoji = profitabilityPercent > 2;

  const handleCloseAll = () => {
    closeAllPositionsMutation.mutate();
  };

  return (
    <>
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", damping: 20 }}
            className="md:hidden fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40 w-[calc(100%-2rem)]"
          >
            <Card className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
              <div className="px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-md flex-shrink-0 ${
                      openPLData.totalPLUSD >= 0
                        ? "bg-gradient-to-br from-blue-500 to-blue-600"
                        : "bg-gradient-to-br from-red-500 to-red-600"
                    }`}>
                      <TrendingUpDown className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-slate-400 text-[9px] leading-tight font-medium">
                          Lucro
                        </p>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCloseDialog(true);
                          }}
                          className={`text-sm font-black leading-tight cursor-pointer hover:opacity-80 transition-opacity ${
                            openPLData.totalPLUSD >= 0 ? "text-emerald-400" : "text-red-400"
                          }`}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {hideBalances ? "****" : `${openPLData.totalPLUSD >= 0 ? '+' : ''}${Math.abs(openPLData.totalPLUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </button>
                        <button
                          onClick={() => setHideBalances(!hideBalances)}
                          className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                        >
                          {hideBalances ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className={`text-[9px] font-bold ${
                      openPLData.avgPercentage >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {openPLData.avgPercentage >= 0 ? '+' : ''}{openPLData.avgPercentage.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="md:hidden fixed bottom-20 right-4 z-40"
          >
            <button
              onClick={() => setIsExpanded(true)}
              className="bg-slate-900/95 backdrop-blur-xl border-2 border-slate-700/50 rounded-lg px-2 py-2 shadow-2xl shadow-slate-950/50 hover:border-emerald-500/50 transition-all"
            >
              <div className="flex items-center gap-1.5">
                <TrendingUpDown className={`w-3.5 h-3.5 ${
                  openPLData.totalPLUSD >= 0 ? "text-emerald-400" : "text-red-400"
                }`} />
                <span className={`text-[10px] font-bold ${
                  openPLData.totalPLUSD >= 0 ? "text-emerald-400" : "text-red-400"
                }`} style={{ whiteSpace: 'nowrap' }}>
                  {hideBalances ? "****" : `${openPLData.totalPLUSD >= 0 ? '+' : ''}${Math.abs(openPLData.totalPLUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
                <ChevronUp className="w-3 h-3 text-slate-400" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              Fechar Todas as Posições
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className={`${
              openPLData.totalPLUSD >= 0
                ? 'bg-emerald-500/20 border-emerald-500/50'
                : 'bg-red-500/20 border-red-500/50'
            } border-2 rounded-xl p-4 mb-4 text-center`}>
              <p className="text-slate-300 text-xs mb-1">P/L Total Atual</p>
              <div className={`text-3xl font-black ${
                openPLData.totalPLUSD >= 0 ? "text-emerald-400" : "text-red-400"
              }`}>
                {openPLData.totalPLUSD >= 0 ? "+" : ""}{Math.abs(openPLData.totalPLUSD).toLocaleString('en-US', { 
                 minimumFractionDigits: 2, 
                 maximumFractionDigits: 2 
                })}
              </div>
              <div className={`text-lg font-semibold ${
                openPLData.avgPercentage >= 0 ? "text-emerald-400" : "text-red-400"
              }`}>
                {openPLData.avgPercentage >= 0 ? "+" : ""}{openPLData.avgPercentage.toFixed(2)}%
              </div>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50 mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Posições Abertas:</span>
                <span className="text-white font-bold">{validActiveTrades.length}</span>
              </div>
              {initialBalance > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Rentabilidade:</span>
                  <span className={`font-bold ${
                    profitabilityPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {profitabilityPercent >= 0 ? '+' : ''}{profitabilityPercent.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>

            <p className="text-slate-300 text-sm">
              {showFireEmoji 
                ? "🎉 Ótimo resultado! Deseja realizar o lucro agora?"
                : "Tem certeza que deseja fechar todas as posições no momento?"
              }
            </p>
          </div>

          <DialogFooter className="flex flex-col gap-2">
            <Button
              onClick={handleCloseAll}
              disabled={closeAllPositionsMutation.isPending}
              className={`w-full font-bold text-sm h-10 ${
                showFireEmoji
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30"
              }`}
            >
              {closeAllPositionsMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Fechando Posições...
                </>
              ) : (
                <>
                  {showFireEmoji ? "🔥 Fechar Lucro" : "Fechar Todas Posições"}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCloseDialog(false)}
              className="w-full bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}