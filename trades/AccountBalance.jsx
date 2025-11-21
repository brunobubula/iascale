import React from "react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Wallet, TrendingUp, TrendingDown, Eye, EyeOff, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AccountBalance({ trades = [], hideBalances, setHideBalances }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const validTrades = Array.isArray(trades) ? trades : [];
  const completedTrades = validTrades.filter(t => 
    t?.status === "TAKE_PROFIT_HIT" || 
    t?.status === "STOP_LOSS_HIT" || 
    t?.status === "CLOSED"
  );

  const totalProfitLoss = completedTrades.reduce((sum, trade) => {
    return sum + (trade?.profit_loss_usd || 0);
  }, 0);

  const currentBalance = (user?.initial_balance || 0) + totalProfitLoss;
  const initialBalance = user?.initial_balance || 0;
  const hasInitialBalance = initialBalance > 0;

  const winningTrades = completedTrades.filter(t => (t?.profit_loss_usd || 0) > 0).length;
  const winRate = completedTrades.length > 0 
    ? ((winningTrades / completedTrades.length) * 100).toFixed(1)
    : 0;

  const profitPercentage = user?.initial_balance && user.initial_balance > 0
    ? ((totalProfitLoss / user.initial_balance) * 100).toFixed(1)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full"
    >
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl border-slate-700/50 overflow-hidden shadow-2xl h-full flex items-center">
        <div className="p-3 w-full">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
                <Wallet className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-xs leading-tight">Saldo da Conta</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <h2 className="text-lg font-bold text-white truncate leading-tight">
                    {hideBalances ? "****" : `${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </h2>
                  <button
                    onClick={() => setHideBalances(!hideBalances)}
                    className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                  >
                    {hideBalances ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            {hasInitialBalance && (
              <div className="flex flex-col gap-1 flex-shrink-0 text-right">
                <div className="flex items-center justify-end gap-1">
                  <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
                  <span className="text-slate-400 text-[10px]">WRT:</span>
                  <span className="text-white font-bold text-xs">{winRate}%</span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <div className={`w-1 h-1 rounded-full ${profitPercentage >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                  <span className="text-slate-400 text-[10px]">ROI:</span>
                  <span className={`font-bold text-xs ${profitPercentage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {profitPercentage >= 0 ? '+' : ''}{profitPercentage}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {hasInitialBalance && (
            <div className="mt-2 pt-2 border-t border-slate-700/30">
              <div className="flex items-center justify-center gap-1.5">
                {totalProfitLoss >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                )}
                <span className="text-slate-400 text-xs">Lucro Total:</span>
                <span className={`font-bold text-xs ${totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}