import React from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function EnterpriseSalesChart({ sales }) {
  const approvedSales = sales.filter(s => s.status === "approved");

  // Últimos 30 dias
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 29 - i));
    const daySales = approvedSales.filter(s => {
      const saleDate = startOfDay(new Date(s.sale_date || s.created_date));
      return saleDate.getTime() === date.getTime();
    });
    
    const revenue = daySales.reduce((sum, s) => sum + (s.amount || 0), 0);
    
    return {
      date: format(date, "dd/MM", { locale: ptBR }),
      vendas: daySales.length,
      receita: revenue,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <h3 className="text-white font-bold text-lg mb-4">Vendas - Últimos 30 dias</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={last30Days}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#fff"
              }}
            />
            <Bar dataKey="vendas" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <h3 className="text-white font-bold text-lg mb-4">Receita - Últimos 30 dias</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={last30Days}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#fff"
              }}
              formatter={(value) => `R$ ${value.toFixed(2)}`}
            />
            <Line type="monotone" dataKey="receita" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: "#8b5cf6", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}