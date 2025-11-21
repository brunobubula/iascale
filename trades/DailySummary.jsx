import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Eye, EyeOff, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { startOfDay, endOfDay, subHours } from "date-fns";

export default function DailySummary({ trades = [], hideBalances, setHideBalances }) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const validTrades = Array.isArray(trades) ? trades : [];
  const todayCompletedTrades = validTrades.filter(t => {
    if (!t || t.status === "ACTIVE" || !t.status) return false;

    let dateToCheck;
    if (t.closed_date) {
      dateToCheck = subHours(new Date(t.closed_date), 3);
    } else if (t.status === "CLOSED") {
      dateToCheck = t.updated_date ? subHours(new Date(t.updated_date), 3) : null;
    } else {
      dateToCheck = t.created_date ? subHours(new Date(t.created_date), 3) : null;
    }

    if (!dateToCheck || isNaN(dateToCheck.getTime())) return false;

    return dateToCheck >= todayStart && dateToCheck <= todayEnd;
  });

  const todayWins = todayCompletedTrades.filter(t => (t?.profit_loss_usd || 0) > 0).length;
  const todayLosses = todayCompletedTrades.filter(t => (t?.profit_loss_usd || 0) < 0).length;
  const todayTotalPL = todayCompletedTrades.reduce((sum, t) => sum + (t?.profit_loss_usd || 0), 0);

  const isProfit = todayTotalPL >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="h-full"
    >
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl border-slate-700/50 overflow-hidden shadow-2xl h-full flex items-center">
        <div className="p-3 w-full">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0 ${
                isProfit
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30"
                  : "bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30"
              }`}>
                {isProfit ? (
                  <TrendingUp className="w-4.5 h-4.5 text-white" />
                ) : (
                  <TrendingDown className="w-4.5 h-4.5 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-xs leading-tight">Resultado do Dia</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <h2 className={`text-lg font-bold truncate leading-tight ${
                    isProfit ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {hideBalances ? "****" : `${isProfit ? "+" : ""}${Math.abs(todayTotalPL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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

            <div className="flex flex-col gap-1 flex-shrink-0 text-right">
              <div className="flex items-center justify-end gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
                <span className="text-slate-400 text-[10px] w-[38px] text-left">Vitórias:</span>
                <span className="text-white font-bold text-xs w-[24px] text-right">{todayWins}</span>
              </div>
              <div className="flex items-center justify-end gap-1">
                <div className="w-1 h-1 rounded-full bg-red-400"></div>
                <span className="text-slate-400 text-[10px] w-[38px] text-left">Derrotas:</span>
                <span className="text-white font-bold text-xs w-[24px] text-right">{todayLosses}</span>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-700/30">
            <div className="flex items-center justify-center gap-1.5">
              <Activity className="w-3 h-3 text-blue-400" />
              <span className="text-slate-400 text-xs">
                {todayCompletedTrades.length} trade{todayCompletedTrades.length !== 1 ? 's' : ''} finalizados hoje
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}