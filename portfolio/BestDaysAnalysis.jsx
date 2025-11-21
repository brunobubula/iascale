import React from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { format, parseISO, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function BestDaysAnalysis({ trades }) {
  const completedTrades = trades.filter(t =>
    t.status === "TAKE_PROFIT_HIT" || t.status === "STOP_LOSS_HIT" || t.status === "CLOSED"
  );

  // Análise por dia da semana
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const dayData = Array(7).fill(0).map((_, i) => ({
    day: dayNames[i],
    profit: 0,
    trades: 0
  }));

  completedTrades.forEach(trade => {
    const dayIndex = getDay(parseISO(trade.created_date));
    dayData[dayIndex].profit += (trade.profit_loss_usd || 0);
    dayData[dayIndex].trades += 1;
  });

  const sortedDays = [...dayData].sort((a, b) => b.profit - a.profit);
  const bestDay = sortedDays[0];
  const worstDay = sortedDays[sortedDays.length - 1];

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Análise por Dia da Semana</h2>
          <p className="text-sm text-slate-400">Performance por dia</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400 text-sm">Melhor Dia</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{bestDay.day}</div>
          <div className="text-sm text-slate-500">+${bestDay.profit.toFixed(2)}</div>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-slate-400 text-sm">Pior Dia</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{worstDay.day}</div>
          <div className="text-sm text-slate-500">{worstDay.profit >= 0 ? '+' : ''}${worstDay.profit.toFixed(2)}</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={dayData}>
          <XAxis dataKey="day" stroke="#94a3b8" />
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
          <Bar dataKey="profit" radius={[8, 8, 0, 0]}>
            {dayData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? "#10b981" : "#ef4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}