import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, Target, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function StatsOverview({ trades }) {
  const activeTrades = trades.filter(t => t.status === "ACTIVE");
  const completedTrades = trades.filter(t => t.status !== "ACTIVE");
  const wonTrades = trades.filter(t => t.status === "TAKE_PROFIT_HIT");
  const lostTrades = trades.filter(t => t.status === "STOP_LOSS_HIT");
  
  const totalProfitPercentage = trades.reduce((sum, trade) => {
    return sum + (trade.profit_loss_percentage || 0);
  }, 0);

  // Calcula lucros e perdas em dólares
  const totalProfitUSD = trades.reduce((sum, trade) => {
    const profitLoss = trade.profit_loss_usd || 0;
    return profitLoss > 0 ? sum + profitLoss : sum;
  }, 0);

  const totalLossUSD = Math.abs(trades.reduce((sum, trade) => {
    const profitLoss = trade.profit_loss_usd || 0;
    return profitLoss < 0 ? sum + profitLoss : sum;
  }, 0));

  const netProfitUSD = totalProfitUSD - totalLossUSD;

  const winRate = completedTrades.length > 0 
    ? (wonTrades.length / completedTrades.length) * 100 
    : 0;

  // Dados para o gráfico
  const chartData = [
    { name: "Lucros", value: totalProfitUSD, color: "#10b981" },
    { name: "Perdas", value: totalLossUSD, color: "#ef4444" }
  ];

  const stats = [
    {
      title: "Trades Ativos",
      value: activeTrades.length,
      icon: Activity,
      color: "blue",
      bgGradient: "from-blue-500 to-blue-600"
    },
    {
      title: "Lucro Líquido",
      value: `${netProfitUSD.toFixed(2)}`,
      subtitle: `${totalProfitPercentage >= 0 ? "+" : ""}${totalProfitPercentage.toFixed(2)}%`,
      icon: netProfitUSD >= 0 ? TrendingUp : TrendingDown,
      color: netProfitUSD >= 0 ? "emerald" : "red",
      bgGradient: netProfitUSD >= 0 ? "from-emerald-500 to-emerald-600" : "from-red-500 to-red-600"
    },
    {
      title: "Taxa de Acerto",
      value: `${winRate.toFixed(0)}%`,
      subtitle: `${wonTrades.length}/${completedTrades.length} trades`,
      icon: Target,
      color: "purple",
      bgGradient: "from-purple-500 to-purple-600"
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 overflow-hidden hover:border-slate-700/50 transition-all duration-300 shadow-xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-slate-400 text-sm mb-1">{stat.title}</div>
                <div className="text-white text-3xl font-bold">{stat.value}</div>
                {stat.subtitle && (
                  <div className="text-slate-500 text-sm mt-1">{stat.subtitle}</div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Gráfico de Lucros vs Perdas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 overflow-hidden shadow-xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Análise Financeira</h3>
                <p className="text-slate-400 text-sm">Lucros vs Perdas em USD</p>
              </div>
              <div className="text-right">
                <div className="text-slate-400 text-sm mb-1">Saldo</div>
                <div className={`text-2xl font-bold ${netProfitUSD >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {netProfitUSD >= 0 ? "+" : ""}{netProfitUSD.toFixed(2)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
                <div className="flex items-center gap-2 text-emerald-400 text-sm mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Total de Lucros
                </div>
                <div className="text-2xl font-bold text-emerald-400">
                  {totalProfitUSD.toFixed(2)}
                </div>
              </div>
              <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
                  <TrendingDown className="w-4 h-4" />
                  Total de Perdas
                </div>
                <div className="text-2xl font-bold text-red-400">
                  {totalLossUSD.toFixed(2)}
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => `$${value.toFixed(2)}`}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>
    </>
  );
}