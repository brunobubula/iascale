import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Wallet, TrendingUp, Activity, AlertTriangle, Eye, EyeOff, DollarSign, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function FuturesAccountCard({ account, positions }) {
  const [hideBalance, setHideBalance] = useState(false);

  if (!account) return null;

  const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + (pos.unrealized_pnl || 0), 0);
  const accountEquity = account.wallet_balance + totalUnrealizedPnL;
  const marginRatio = account.wallet_balance > 0 ? (account.position_margin / account.wallet_balance) * 100 : 0;
  const winRate = account.total_trades > 0 ? (account.winning_trades / account.total_trades) * 100 : 0;

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border-slate-700/50 overflow-hidden">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Wallet Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-400" />
                <span className="text-slate-400 text-sm">Saldo da Carteira</span>
              </div>
              <button
                onClick={() => setHideBalance(!hideBalance)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-2xl font-black text-white">
              {hideBalance ? "$••••••" : `$ ${account.wallet_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <div className="text-xs text-slate-500">
              Equity: $ {accountEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </motion.div>

          {/* Available Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400 text-sm">Disponível</span>
            </div>
            <div className="text-2xl font-black text-emerald-400">
              $ {(account.wallet_balance - account.position_margin - account.order_margin).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500">
              Margem Posição: $ {account.position_margin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </motion.div>

          {/* Unrealized P&L */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className={`w-4 h-4 ${totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
              <span className="text-slate-400 text-sm">P&L Não Realizado</span>
            </div>
            <div className={`text-2xl font-black ${totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalUnrealizedPnL >= 0 ? '+' : ''}$ {totalUnrealizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500">
              Realizado: $ {account.realized_pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </motion.div>

          {/* Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-slate-400 text-sm">Estatísticas</span>
            </div>
            <div className="text-2xl font-black text-white">
              {winRate.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500">
              Win Rate • {account.total_trades} trades
            </div>
          </motion.div>
        </div>

        {/* Margin Ratio Warning */}
        {marginRatio > 70 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div className="text-sm">
              <span className="text-yellow-400 font-semibold">Atenção: </span>
              <span className="text-slate-300">
                Ratio de margem em {marginRatio.toFixed(1)}%. Considere reduzir exposição.
              </span>
            </div>
          </motion.div>
        )}

        {/* Account Settings */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Modo Margem:</span>
              <span className="text-white font-semibold uppercase">{account.margin_mode}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Alavancagem Padrão:</span>
              <span className="text-white font-semibold">{account.default_leverage}x</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Posições Abertas:</span>
              <span className="text-white font-semibold">{positions.length}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}