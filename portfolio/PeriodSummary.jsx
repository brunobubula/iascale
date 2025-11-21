import React from "react";
import { Card } from "@/components/ui/card";
import { Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { startOfDay, startOfWeek, startOfMonth, isWithinInterval, parseISO } from "date-fns";

export default function PeriodSummary({ trades }) {
  const completedTrades = trades.filter(t =>
    t.status === "TAKE_PROFIT_HIT" || t.status === "STOP_LOSS_HIT" || t.status === "CLOSED"
  );

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const calculatePeriod = (startDate) => {
    const periodTrades = completedTrades.filter(t => {
      const tradeDate = parseISO(t.created_date);
      return isWithinInterval(tradeDate, { start: startDate, end: now });
    });

    const profit = periodTrades.reduce((sum, t) => sum + (t.profit_loss_usd || 0), 0);
    const wins = periodTrades.filter(t => (t.profit_loss_usd || 0) > 0).length;
    const losses = periodTrades.length - wins;

    return { profit, wins, losses, total: periodTrades.length };
  };

  const daily = calculatePeriod(todayStart);
  const weekly = calculatePeriod(weekStart);
  const monthly = calculatePeriod(monthStart);

  const periods = [
    {
      label: "Hoje",
      icon: Calendar,
      data: daily,
      color: "blue"
    },
    {
      label: "Esta Semana",
      icon: Calendar,
      data: weekly,
      color: "purple"
    },
    {
      label: "Este Mês",
      icon: Calendar,
      data: monthly,
      color: "emerald"
    }
  ];

  const colorMap = {
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    emerald: "from-emerald-500 to-emerald-600"
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {periods.map((period, index) => (
        <Card key={index} className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[period.color]} flex items-center justify-center`}>
              <period.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold">{period.label}</h3>
              <p className="text-xs text-slate-400">{period.data.total} trades</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Resultado</span>
              <span className={`font-bold text-lg ${
                period.data.profit >= 0 ? "text-emerald-400" : "text-red-400"
              }`}>
                {period.data.profit >= 0 ? "+" : ""}${period.data.profit.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-slate-400">Wins</span>
                </div>
                <span className="text-emerald-400 font-bold">{period.data.wins}</span>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingDown className="w-3 h-3 text-red-400" />
                  <span className="text-xs text-slate-400">Losses</span>
                </div>
                <span className="text-red-400 font-bold">{period.data.losses}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}