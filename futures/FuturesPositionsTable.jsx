import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, X, Edit2, Target, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function FuturesPositionsTable({ positions, account }) {
  if (!positions || positions.length === 0) {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-12">
        <div className="text-center">
          <Target className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-white font-bold text-lg mb-2">Nenhuma Posição Aberta</h3>
          <p className="text-slate-400">Abra sua primeira posição usando o formulário ao lado</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 overflow-hidden">
      <div className="p-6">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" />
          Posições Abertas
        </h3>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-slate-400 text-xs font-semibold uppercase py-3 px-2">Par</th>
                <th className="text-left text-slate-400 text-xs font-semibold uppercase py-3 px-2">Lado</th>
                <th className="text-right text-slate-400 text-xs font-semibold uppercase py-3 px-2">Quantidade</th>
                <th className="text-right text-slate-400 text-xs font-semibold uppercase py-3 px-2">Entrada</th>
                <th className="text-right text-slate-400 text-xs font-semibold uppercase py-3 px-2">Mark Price</th>
                <th className="text-right text-slate-400 text-xs font-semibold uppercase py-3 px-2">Liquidação</th>
                <th className="text-right text-slate-400 text-xs font-semibold uppercase py-3 px-2">P&L</th>
                <th className="text-center text-slate-400 text-xs font-semibold uppercase py-3 px-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position, index) => {
                const pnlColor = position.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400';
                const isNearLiquidation = position.mark_price && position.liquidation_price && 
                  Math.abs((position.mark_price - position.liquidation_price) / position.mark_price * 100) < 10;

                return (
                  <motion.tr
                    key={position.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div className="font-bold text-white">{position.symbol}</div>
                      <div className="text-xs text-slate-500">{position.leverage}x • {position.margin_mode}</div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        position.side === "LONG" 
                          ? "bg-emerald-500/20 text-emerald-400" 
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {position.side}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right text-white font-semibold">{position.quantity}</td>
                    <td className="py-3 px-2 text-right text-white">
                      $ {position.entry_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-2 text-right text-white">
                      $ {(position.mark_price || position.entry_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isNearLiquidation && (
                          <AlertTriangle className="w-3 h-3 text-yellow-400" />
                        )}
                        <span className={isNearLiquidation ? 'text-yellow-400' : 'text-slate-400'}>
                          $ {position.liquidation_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className={`font-bold ${pnlColor}`}>
                        {position.unrealized_pnl >= 0 ? '+' : ''}$ {position.unrealized_pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className={`text-xs ${pnlColor}`}>
                        {position.unrealized_pnl_percentage >= 0 ? '+' : ''}{position.unrealized_pnl_percentage.toFixed(2)}%
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-white h-7 px-2"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-500/20 border-red-500/50 hover:bg-red-500/30 text-red-400 h-7 px-2"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {positions.map((position, index) => {
            const pnlColor = position.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400';
            const isNearLiquidation = position.mark_price && position.liquidation_price && 
              Math.abs((position.mark_price - position.liquidation_price) / position.mark_price * 100) < 10;

            return (
              <motion.div
                key={position.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{position.symbol}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        position.side === "LONG" 
                          ? "bg-emerald-500/20 text-emerald-400" 
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {position.side}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {position.leverage}x • {position.margin_mode}
                    </div>
                  </div>
                  <div className={`text-right font-bold ${pnlColor}`}>
                    {position.unrealized_pnl >= 0 ? '+' : ''}$ {position.unrealized_pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    <div className="text-xs">
                      {position.unrealized_pnl_percentage >= 0 ? '+' : ''}{position.unrealized_pnl_percentage.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <div className="text-slate-500 text-xs">Entrada</div>
                    <div className="text-white font-semibold">${position.entry_price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs">Mark Price</div>
                    <div className="text-white font-semibold">${(position.mark_price || position.entry_price).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs">Quantidade</div>
                    <div className="text-white font-semibold">{position.quantity}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs flex items-center gap-1">
                      Liquidação
                      {isNearLiquidation && <AlertTriangle className="w-3 h-3 text-yellow-400" />}
                    </div>
                    <div className={`font-semibold ${isNearLiquidation ? 'text-yellow-400' : 'text-white'}`}>
                      $ {position.liquidation_price.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-slate-700/50 border-slate-600 hover:bg-slate-600 text-white"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-red-500/20 border-red-500/50 hover:bg-red-500/30 text-red-400"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Fechar
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}