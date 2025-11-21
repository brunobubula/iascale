import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { format as formatDate } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RecentManualTrades({ trades = [] }) {
  // Filtra apenas trades manuais e pega os 3 mais recentes
  const recentManualTrades = (trades || [])
    .filter(t => t.from_ai_trader !== true)
    .slice(0, 3);

  if (recentManualTrades.length === 0) return null;

  return (
    <div className="space-y-2">
      {recentManualTrades.map((trade, index) => {
        const profitLoss = trade.profit_loss_usd || 0;
        const isProfit = profitLoss >= 0;

        return (
          <motion.div
            key={trade.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-slate-800/30 rounded-lg p-2.5 border border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600/50 transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  trade.status === "TAKE_PROFIT_HIT" ? "bg-emerald-400" : 
                  trade.status === "STOP_LOSS_HIT" ? "bg-red-400" : 
                  trade.status === "ACTIVE" ? "bg-yellow-400" :
                  "bg-slate-400"
                }`}></div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-white font-bold text-sm truncate">{trade.pair}</span>
                    
                    <Badge className={`${
                      trade.type === "BUY" 
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    } border text-[10px] px-1.5 py-0 h-4 leading-none`}>
                      {trade.type === "BUY" ? "BUY" : "SELL"}
                    </Badge>
                    
                    {(trade.leverage || 1) > 1 && (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 border text-[10px] px-1.5 py-0 h-4 leading-none">
                        {trade.leverage}x
                      </Badge>
                    )}
                  </div>

                  <div className="text-slate-400 text-[10px]">
                    {formatDate(new Date(trade.created_date), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                <div className="text-center">
                  <div className="text-slate-500 text-[9px]">Margem</div>
                  <div className="text-white text-xs font-semibold">$ {(trade.entry_amount || 0).toFixed(0)}</div>
                </div>

                <div className="text-center">
                  <div className="text-slate-500 text-[9px]">Entrada</div>
                  <div className="text-white text-xs font-semibold">$ {(trade.entry_price || 0).toFixed(2)}</div>
                </div>

                <div className="text-center">
                  <div className="text-slate-500 text-[9px]">Saída</div>
                  <div className="text-white text-xs font-semibold">$ {(trade.current_price || 0).toFixed(2)}</div>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className={`text-sm font-black ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                  {isProfit ? "+" : ""}$ {Math.abs(profitLoss).toFixed(2)}
                </div>
                <div className={`text-[9px] font-semibold ${isProfit ? "text-emerald-400/70" : "text-red-400/70"}`}>
                  {isProfit ? "+" : ""}{(trade.profit_loss_percentage || 0).toFixed(2)}%
                </div>
                <div className={`text-[9px] font-bold ${
                  trade.status === "TAKE_PROFIT_HIT" ? "text-emerald-400" :
                  trade.status === "STOP_LOSS_HIT" ? "text-red-400" :
                  trade.status === "ACTIVE" ? "text-yellow-400" :
                  "text-slate-400"
                }`}>
                  {trade.status === "ACTIVE" ? "ATIVO" : 
                   trade.status === "TAKE_PROFIT_HIT" ? "TP" :
                   trade.status === "STOP_LOSS_HIT" ? "SL" : "FECHADO"}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}