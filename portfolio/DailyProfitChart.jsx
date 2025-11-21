import React from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Calendar, TrendingUp } from "lucide-react";
import { format, startOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DailyProfitChart({ trades }) {
  const completedTrades = trades.filter(t =>
    t.status === "TAKE_PROFIT_HIT" || t.status === "STOP_LOSS_HIT" || t.status === "CLOSED"
  );

  // Agrupar por dia
  const dailyData = {};
  completedTrades.forEach(trade => {
    const date = format(startOfDay(parseISO(trade.created_date)), "dd/MM");
    if (!dailyData[date]) {
      dailyData[date] = { profit: 0, trades: 0 };
    }
    dailyData[date].profit += (trade.profit_loss_usd || 0);
    dailyData[date].trades += 1;
  });

  const chartData = Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      profit: data.profit,
      trades: data.trades,
      fill: data.profit >= 0 ? "#10b981" : "#ef4444"
    }))
    .slice(-30); // Últimos 30 dias

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Lucro Diário</h2>
          <p className="text-sm text-slate-400">Últimos 30 dias de operações</p>
        </div>
      </div>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value, name) => {
                if (name === "profit") return [`$${value.toFixed(2)}`, "Lucro"];
                return [value, name];
              }}
            />
            <Bar dataKey="profit" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-slate-400 py-12">Nenhum dado disponível</p>
      )}
    </Card>
  );
}