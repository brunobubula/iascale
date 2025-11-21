import React from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, AlertTriangle, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

export default function CompletedTradesList({ trades }) {
  if (trades.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Nenhum trade finalizado neste período</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trades.map((trade, index) => {
        const isBuy = trade.type === "BUY";
        const leverage = trade.leverage || 1;
        const entryAmount = trade.entry_amount || 0;
        const totalOperatedValue = entryAmount * leverage;
        const profitLoss = trade.profit_loss_percentage || 0;
        const profitLossUSD = trade.profit_loss_usd || 0;
        const isProfit = profitLossUSD >= 0;

        return (
          <motion.div
            key={trade.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 hover:bg-slate-800/50 transition-all border border-slate-700/30"
          >
            <div className="flex items-center justify-between gap-4">
              {/* Par e Tipo */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  trade.status === "TAKE_PROFIT_HIT" ? "bg-emerald-400" : 
                  trade.status === "STOP_LOSS_HIT" ? "bg-red-400" : 
                  "bg-slate-500"
                }`}></div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold text-sm">{trade.pair}</span>
                    <Badge 
                      className={`${
                        isBuy 
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      } border text-xs`}
                    >
                      {isBuy ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {trade.type}
                    </Badge>
                    {leverage > 1 && (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 border text-xs">
                        {leverage}x
                      </Badge>
                    )}
                  </div>
                  <div className="text-slate-400 text-xs">
                    {format(new Date(trade.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>

              {/* Separador vertical discreto */}
              <div className="h-12 w-px bg-slate-700/30"></div>

              {/* Valores */}
              <div className="flex items-center gap-4 flex-shrink-0">
                {/* Margem e Entrada */}
                <div className="text-right">
                  <div className="text-slate-400 text-xs mb-1">Margem + Alav.</div>
                  <div className="text-white text-sm font-semibold">{totalOperatedValue.toFixed(2)}</div>
                </div>

                {/* Separador vertical discreto */}
                <div className="h-12 w-px bg-slate-700/30"></div>

                {/* Entrada e Saída */}
                <div className="text-right">
                  <div className="text-slate-400 text-xs mb-1">Entrada → Saída</div>
                  <div className="text-white text-sm font-semibold">
                    {(trade.entry_price || 0).toFixed(2)} → {(trade.current_price || 0).toFixed(2)}
                  </div>
                </div>

                {/* Separador vertical discreto */}
                <div className="h-12 w-px bg-slate-700/30"></div>

                {/* P/L */}
                <div className="text-right min-w-[120px]">
                  <div className={`text-2xl font-bold ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                    {isProfit ? "+" : ""}{profitLoss.toFixed(2)}%
                  </div>
                  <div className={`text-lg font-semibold flex items-center justify-end gap-1 ${
                    isProfit ? "text-emerald-400" : "text-red-400"
                  }`}>
                    <DollarSign className="w-4 h-4" />
                    {isProfit ? "+" : ""}{profitLossUSD.toFixed(2)}
                  </div>
                </div>

                {/* Separador vertical discreto */}
                <div className="h-12 w-px bg-slate-700/30"></div>

                {/* Status */}
                <div className="text-right min-w-[100px]">
                  {trade.status === "TAKE_PROFIT_HIT" && (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs">
                      <Target className="w-3 h-3" />
                      <span>TP Atingido</span>
                    </div>
                  )}
                  {trade.status === "STOP_LOSS_HIT" && (
                    <div className="flex items-center gap-1 text-red-400 text-xs">
                      <AlertTriangle className="w-3 h-3" />
                      <span>SL Atingido</span>
                    </div>
                  )}
                  {trade.status === "CLOSED" && (
                    <div className="text-slate-400 text-xs">
                      Fechado Manual
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notas */}
            {trade.notes && (
              <div className="mt-3 pt-3 border-t border-slate-700/30">
                <p className="text-slate-400 text-xs">{trade.notes}</p>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}