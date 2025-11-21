import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Calculator, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { motion } from "framer-motion";

export default function CompoundCalculator({ initialBalance, averageMonthlyReturn }) {
  const [capital, setCapital] = useState(initialBalance || 1000);
  const [monthlyReturn, setMonthlyReturn] = useState(averageMonthlyReturn || 10);
  const [selectedPeriod, setSelectedPeriod] = useState(12);

  const periods = [3, 6, 12, 15, 18, 24, 36, 48];

  const calculateProjection = () => {
    const data = [];
    let currentBalance = capital;

    data.push({ month: 0, balance: currentBalance });

    for (let month = 1; month <= selectedPeriod; month++) {
      const monthlyGain = (currentBalance * monthlyReturn) / 100;
      currentBalance += monthlyGain;
      data.push({ 
        month, 
        balance: currentBalance,
        gain: monthlyGain 
      });
    }

    return data;
  };

  const projectionData = calculateProjection();
  const finalBalance = projectionData[projectionData.length - 1]?.balance || capital;
  const totalGain = finalBalance - capital;
  const totalReturnPercentage = capital > 0 ? ((totalGain / capital) * 100) : 0;

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/70 backdrop-blur-xl border-slate-800/50 overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Calculadora de Juros Compostos</h2>
            <p className="text-slate-400 text-sm">Projete seu crescimento futuro</p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label className="text-slate-300 text-sm mb-2">Capital Inicial ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={capital}
              onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
              className="bg-slate-800/50 border-slate-700 text-white h-11"
            />
          </div>

          <div>
            <Label className="text-slate-300 text-sm mb-2">Retorno Mensal (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={monthlyReturn}
              onChange={(e) => setMonthlyReturn(parseFloat(e.target.value) || 0)}
              className="bg-slate-800/50 border-slate-700 text-white h-11"
            />
          </div>
        </div>

        {/* Period Selector */}
        <div className="mb-6">
          <Label className="text-slate-300 text-sm mb-3 block">Projeção de Período</Label>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {periods.map((period) => (
              <Button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                variant={selectedPeriod === period ? "default" : "outline"}
                size="sm"
                className={`${
                  selectedPeriod === period
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                    : "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700"
                } text-xs font-bold h-9`}
              >
                {period}M
              </Button>
            ))}
          </div>
        </div>

        {/* Resultado da Projeção */}
        <motion.div
          key={selectedPeriod}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50 rounded-2xl p-6 mb-6 text-center"
        >
          <div className="text-slate-300 text-sm mb-2">Projeção em {selectedPeriod} meses</div>
          <div className="text-5xl font-black text-emerald-400 mb-2">
            {finalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-center gap-4 text-sm">
            <div>
              <span className="text-slate-400">Ganho: </span>
              <span className="text-emerald-300 font-bold">+{totalGain.toFixed(2)}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-600"></div>
            <div>
              <span className="text-slate-400">Retorno: </span>
              <span className="text-emerald-300 font-bold">+{totalReturnPercentage.toFixed(2)}%</span>
            </div>
          </div>
        </motion.div>

        {/* Gráfico de Projeção */}
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="projectionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="month" 
                stroke="#94a3b8" 
                label={{ value: 'Meses', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
              />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value, name) => {
                  if (name === "balance") return [`${value.toFixed(2)}`, "Saldo Projetado"];
                  return [value, name];
                }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#projectionGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Info sobre Juros Compostos */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-blue-300 text-xs leading-relaxed">
              <strong>Juros Compostos:</strong> Com {monthlyReturn}% ao mês, seu capital de {capital.toFixed(2)} 
              pode crescer para <strong>{finalBalance.toFixed(2)}</strong> em {selectedPeriod} meses. 
              Isso representa um ganho total de <strong>+{totalGain.toFixed(2)}</strong> ({totalReturnPercentage.toFixed(2)}% de retorno).
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}