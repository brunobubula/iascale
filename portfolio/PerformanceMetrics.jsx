import React from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Target, Award, TrendingDown, Clock, DollarSign, TrendingUp, Activity, Percent } from "lucide-react";

export default function PerformanceMetrics({ trades, user }) {
  const completedTrades = trades.filter(t =>
    t.status === "TAKE_PROFIT_HIT" || t.status === "STOP_LOSS_HIT" || t.status === "CLOSED"
  );

  // KPIs Avançados
  const calculateMetrics = () => {
    if (completedTrades.length === 0) return null;

    const returns = completedTrades.map(t => t.profit_loss_percentage || 0);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;

    // Sharpe Ratio
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpe = stdDev !== 0 ? (avgReturn / stdDev) : 0;

    // Sortino Ratio
    const negativeReturns = returns.filter(r => r < 0);
    const downsideDev = negativeReturns.length > 0
      ? Math.sqrt(negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length)
      : 0;
    const sortino = downsideDev !== 0 ? (avgReturn / downsideDev) : 0;

    // Max Drawdown
    let peak = user?.initial_balance || 0;
    let maxDD = 0;
    let runningBalance = user?.initial_balance || 0;
    completedTrades.forEach(trade => {
      runningBalance += (trade.profit_loss_usd || 0);
      if (runningBalance > peak) peak = runningBalance;
      const drawdown = ((peak - runningBalance) / peak) * 100;
      if (drawdown > maxDD) maxDD = drawdown;
    });

    // Win Rate
    const winningTrades = completedTrades.filter(t => (t.profit_loss_usd || 0) > 0).length;
    const winRate = (winningTrades / completedTrades.length) * 100;

    // Profit Factor
    const grossProfit = completedTrades.reduce((sum, t) => sum + Math.max(0, t.profit_loss_usd || 0), 0);
    const grossLoss = Math.abs(completedTrades.reduce((sum, t) => sum + Math.min(0, t.profit_loss_usd || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    // Average Trade Duration
    const durations = completedTrades.map(t => {
      const start = new Date(t.created_date);
      const end = t.updated_date ? new Date(t.updated_date) : new Date();
      return (end - start) / (1000 * 60 * 60); // hours
    });
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    // Total Profit
    const totalProfit = completedTrades.reduce((sum, t) => sum + (t.profit_loss_usd || 0), 0);

    return {
      sharpe,
      sortino,
      maxDrawdown: maxDD,
      winRate,
      profitFactor,
      avgDuration,
      totalProfit
    };
  };

  const metrics = calculateMetrics();

  if (!metrics) {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-6 text-center">
        <p className="text-slate-400">Nenhum trade finalizado ainda</p>
      </Card>
    );
  }

  const metricsData = [
    {
      icon: DollarSign,
      label: "Lucro Total",
      value: `${metrics.totalProfit >= 0 ? '+' : ''}$${metrics.totalProfit.toFixed(2)}`,
      color: metrics.totalProfit >= 0 ? "emerald" : "red",
      delay: 0.1
    },
    {
      icon: Percent,
      label: "Win Rate",
      value: `${metrics.winRate.toFixed(1)}%`,
      color: "blue",
      delay: 0.15
    },
    {
      icon: Target,
      label: "Profit Factor",
      value: metrics.profitFactor.toFixed(2),
      color: "purple",
      delay: 0.2
    },
    {
      icon: Award,
      label: "Sharpe Ratio",
      value: metrics.sharpe.toFixed(2),
      color: "cyan",
      delay: 0.25
    },
    {
      icon: Activity,
      label: "Sortino Ratio",
      value: metrics.sortino.toFixed(2),
      color: "indigo",
      delay: 0.3
    },
    {
      icon: TrendingDown,
      label: "Drawdown Máximo",
      value: `${metrics.maxDrawdown.toFixed(2)}%`,
      color: "red",
      delay: 0.35
    },
    {
      icon: Clock,
      label: "Duração Média",
      value: `${metrics.avgDuration.toFixed(1)}h`,
      color: "yellow",
      delay: 0.4
    },
    {
      icon: TrendingUp,
      label: "Total de Trades",
      value: completedTrades.length,
      color: "emerald",
      delay: 0.45
    }
  ];

  const colorMap = {
    emerald: "from-emerald-500 to-emerald-600",
    red: "from-red-500 to-red-600",
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    cyan: "from-cyan-500 to-cyan-600",
    indigo: "from-indigo-500 to-indigo-600",
    yellow: "from-yellow-500 to-yellow-600"
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metricsData.map((metric, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: metric.delay }}
        >
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-4 hover:border-slate-700/50 transition-all">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[metric.color]} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <metric.icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-slate-400 text-xs truncate">{metric.label}</p>
                <p className="text-white font-bold text-lg truncate">{metric.value}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}