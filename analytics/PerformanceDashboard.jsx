import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Sparkles, 
  Download,
  Activity,
  BarChart3,
  Percent,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Brain,
  Zap,
  Award
} from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { format, subHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function PerformanceDashboard({ trades, user }) {
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [exportingPDF, setExportingPDF] = useState(false);

  const { data: predictions = [] } = useQuery({
    queryKey: ['pairPredictions'],
    queryFn: () => base44.entities.PairPrediction.list("-created_date", 100),
    initialData: [],
  });

  const completedTrades = trades.filter(t => 
    t.status === "TAKE_PROFIT_HIT" || t.status === "STOP_LOSS_HIT" || t.status === "CLOSED"
  );

  const aiCreatedTrades = completedTrades.filter(t => t.from_ai_trader === true);
  const manualTrades = completedTrades.filter(t => !t.from_ai_trader);

  const totalPL = completedTrades.reduce((sum, t) => sum + (t.profit_loss_usd || 0), 0);
  const totalWins = completedTrades.filter(t => (t.profit_loss_usd || 0) > 0).length;
  const totalLosses = completedTrades.filter(t => (t.profit_loss_usd || 0) < 0).length;
  const winRate = completedTrades.length > 0 ? (totalWins / completedTrades.length) * 100 : 0;

  const aiWins = aiCreatedTrades.filter(t => (t.profit_loss_usd || 0) > 0).length;
  const aiLosses = aiCreatedTrades.filter(t => (t.profit_loss_usd || 0) < 0).length;
  const aiWinRate = aiCreatedTrades.length > 0 ? (aiWins / aiCreatedTrades.length) * 100 : 0;
  const aiTotalPL = aiCreatedTrades.reduce((sum, t) => sum + (t.profit_loss_usd || 0), 0);

  const manualWins = manualTrades.filter(t => (t.profit_loss_usd || 0) > 0).length;
  const manualLosses = manualTrades.filter(t => (t.profit_loss_usd || 0) < 0).length;
  const manualWinRate = manualTrades.length > 0 ? (manualWins / manualTrades.length) * 100 : 0;
  const manualTotalPL = manualTrades.reduce((sum, t) => sum + (t.profit_loss_usd || 0), 0);

  const topWinningTrades = [...completedTrades]
    .sort((a, b) => (b.profit_loss_usd || 0) - (a.profit_loss_usd || 0))
    .slice(0, 5);

  const topLosingTrades = [...completedTrades]
    .sort((a, b) => (a.profit_loss_usd || 0) - (b.profit_loss_usd || 0))
    .slice(0, 5);

  const predictionsWithActual = predictions.map(pred => {
    const relatedTrade = aiCreatedTrades.find(t => 
      t.pair === pred.pair_display_name && 
      new Date(t.created_date) >= new Date(pred.created_date)
    );

    const wasAccurate = relatedTrade ? 
      (pred.prediction_type === 'bullish' && (relatedTrade.profit_loss_usd || 0) > 0) ||
      (pred.prediction_type === 'bearish' && (relatedTrade.profit_loss_usd || 0) > 0)
      : null;

    return {
      ...pred,
      relatedTrade,
      wasAccurate
    };
  });

  const accuratePredictions = predictionsWithActual.filter(p => p.wasAccurate === true).length;
  const inaccuratePredictions = predictionsWithActual.filter(p => p.wasAccurate === false).length;
  const predictionAccuracy = predictions.length > 0 
    ? (accuratePredictions / (accuratePredictions + inaccuratePredictions)) * 100 
    : 0;

  const performanceData = [
    { name: "IA Trader", wins: aiWins, losses: aiLosses, profitUSD: aiTotalPL, winRate: aiWinRate },
    { name: "Manual", wins: manualWins, losses: manualLosses, profitUSD: manualTotalPL, winRate: manualWinRate }
  ];

  const predictionData = [
    { name: "Acertos", value: accuratePredictions, color: "#10b981" },
    { name: "Erros", value: inaccuratePredictions, color: "#ef4444" }
  ];

  const exportToPDF = async () => {
    setExportingPDF(true);
    try {
      alert("Funcionalidade de exportação em desenvolvimento!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Dashboard de Performance</h2>
              <p className="text-slate-400 text-xs">Análise completa dos seus trades e previsões</p>
            </div>
          </div>
          <Button
            onClick={exportToPDF}
            disabled={exportingPDF}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-500/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 text-xs font-semibold">P/L Total</span>
              </div>
              <div className={`text-2xl font-black ${totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalPL >= 0 ? '+' : ''}${totalPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-slate-400 text-xs mt-1">{completedTrades.length} trades</p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 text-xs font-semibold">Taxa de Acerto</span>
              </div>
              <div className="text-2xl font-black text-white">
                {winRate.toFixed(1)}%
              </div>
              <p className="text-slate-400 text-xs mt-1">
                {totalWins} vitórias / {totalLosses} derrotas
              </p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <span className="text-purple-400 text-xs font-semibold">Previsões IA</span>
              </div>
              <div className="text-2xl font-black text-white">
                {predictionAccuracy.toFixed(1)}%
              </div>
              <p className="text-slate-400 text-xs mt-1">
                {accuratePredictions} acertos / {inaccuratePredictions} erros
              </p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-500/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-5 h-5 text-orange-400" />
                <span className="text-orange-400 text-xs font-semibold">ROI</span>
              </div>
              <div className={`text-2xl font-black ${
                totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {user?.initial_balance && user.initial_balance > 0 
                  ? `${((totalPL / user.initial_balance) * 100).toFixed(2)}%`
                  : '0%'
                }
              </div>
              <p className="text-slate-400 text-xs mt-1">Retorno sobre investimento</p>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-yellow-400" />
              <div>
                <h3 className="text-lg font-bold text-white">IA Trader vs Manual</h3>
                <p className="text-slate-400 text-xs">Comparação de performance</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {performanceData.map((data) => (
                <div key={data.name} className={`${
                  data.name === "IA Trader" 
                    ? "bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30" 
                    : "bg-slate-800/30 border-slate-700/30"
                } border rounded-xl p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    {data.name === "IA Trader" ? (
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    ) : (
                      <Activity className="w-5 h-5 text-slate-400" />
                    )}
                    <h4 className="text-white font-bold">{data.name}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Win Rate</div>
                      <div className="text-emerald-400 font-bold text-lg">{data.winRate.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs mb-1">P/L Total</div>
                      <div className={`font-bold text-lg ${data.profitUSD >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {data.profitUSD >= 0 ? '+' : ''}${data.profitUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Vitórias</div>
                      <div className="text-white font-semibold">{data.wins}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Derrotas</div>
                      <div className="text-white font-semibold">{data.losses}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={performanceData}>
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                />
                <Bar dataKey="profitUSD" radius={[8, 8, 0, 0]}>
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.profitUSD >= 0 ? "#10b981" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">Top 5 Lucros</h3>
                  <p className="text-slate-400 text-xs">Trades mais lucrativos</p>
                </div>
              </div>
              <div className="space-y-2">
                {topWinningTrades.map((trade, index) => (
                  <div 
                    key={trade.id}
                    onClick={() => setSelectedTrade(trade)}
                    className="bg-gradient-to-r from-emerald-500/5 to-transparent border-l-2 border-emerald-500/50 rounded-lg p-3 cursor-pointer hover:bg-emerald-500/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg ${
                          index === 0 ? "bg-yellow-500" :
                          index === 1 ? "bg-slate-400" :
                          index === 2 ? "bg-orange-600" : "bg-slate-600"
                        } flex items-center justify-center font-bold text-white text-xs`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-bold text-sm">{trade.pair}</span>
                            <Badge className={`${
                              trade.type === "BUY" 
                                ? "bg-emerald-500/20 text-emerald-400" 
                                : "bg-red-500/20 text-red-400"
                            } text-[10px] px-1 py-0`}>
                              {trade.type}
                            </Badge>
                            {trade.from_ai_trader && (
                              <Badge className="bg-purple-500/20 text-purple-400 text-[10px] px-1 py-0">
                                <Sparkles className="w-2.5 h-2.5" />
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-400 text-[10px] mt-0.5">
                            {format(subHours(new Date(trade.created_date), 3), "dd/MM/yy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="text-emerald-400 font-black text-base">
                        +${(trade.profit_loss_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">Top 5 Perdas</h3>
                  <p className="text-slate-400 text-xs">Trades com maior perda</p>
                </div>
              </div>
              <div className="space-y-2">
                {topLosingTrades.map((trade, index) => (
                  <div 
                    key={trade.id}
                    onClick={() => setSelectedTrade(trade)}
                    className="bg-gradient-to-r from-red-500/5 to-transparent border-l-2 border-red-500/50 rounded-lg p-3 cursor-pointer hover:bg-red-500/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-white text-xs">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-bold text-sm">{trade.pair}</span>
                            <Badge className={`${
                              trade.type === "BUY" 
                                ? "bg-emerald-500/20 text-emerald-400" 
                                : "bg-red-500/20 text-red-400"
                            } text-[10px] px-1 py-0`}>
                              {trade.type}
                            </Badge>
                            {trade.from_ai_trader && (
                              <Badge className="bg-purple-500/20 text-purple-400 text-[10px] px-1 py-0">
                                <Sparkles className="w-2.5 h-2.5" />
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-400 text-[10px] mt-0.5">
                            {format(subHours(new Date(trade.created_date), 3), "dd/MM/yy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="text-red-400 font-black text-base">
                        ${Math.abs(trade.profit_loss_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {predictions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-purple-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">Performance das Previsões IA</h3>
                  <p className="text-slate-400 text-xs">Comparação: Previsão vs Resultado Real</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={predictionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {predictionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-col justify-center space-y-3">
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-white font-semibold">Acertos</span>
                    </div>
                    <span className="text-emerald-400 font-black text-xl">{accuratePredictions}</span>
                  </div>

                  <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="text-white font-semibold">Erros</span>
                    </div>
                    <span className="text-red-400 font-black text-xl">{inaccuratePredictions}</span>
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-center">
                    <div className="text-slate-400 text-xs mb-1">Taxa de Acerto</div>
                    <div className="text-purple-400 font-black text-2xl">
                      {predictionAccuracy.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Histórico Detalhado</h3>
                <p className="text-slate-400 text-xs">Últimos 10 trades finalizados</p>
              </div>
            </div>

            <div className="space-y-2">
              {completedTrades.slice(0, 10).map((trade) => {
                const isWin = (trade.profit_loss_usd || 0) > 0;
                const tradeDate = trade.status === "CLOSED" 
                  ? subHours(new Date(trade.updated_date), 3)
                  : subHours(new Date(trade.created_date), 3);

                return (
                  <div
                    key={trade.id}
                    onClick={() => setSelectedTrade(trade)}
                    className={`cursor-pointer transition-all hover:bg-slate-800/50 ${
                      isWin 
                        ? 'bg-gradient-to-r from-emerald-900/10 to-transparent border-l-2 border-emerald-500/50' 
                        : 'bg-gradient-to-r from-red-900/10 to-transparent border-l-2 border-red-500/50'
                    } rounded-lg p-3`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <div className={`w-2 h-2 rounded-full ${
                          isWin ? 'bg-emerald-400' : 'bg-red-400'
                        }`}></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-bold text-sm">{trade.pair}</span>
                            <Badge className={`${
                              trade.type === "BUY" 
                                ? "bg-emerald-500/20 text-emerald-400" 
                                : "bg-red-500/20 text-red-400"
                            } text-[10px] px-1.5 py-0`}>
                              {trade.type}
                            </Badge>
                            {(trade.leverage || 1) > 1 && (
                              <Badge className="bg-purple-500/20 text-purple-400 text-[10px] px-1.5 py-0">
                                {trade.leverage}x
                              </Badge>
                            )}
                            {trade.from_ai_trader && (
                              <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 text-[10px] px-1.5 py-0">
                                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                                iA
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-400 text-[10px] mt-0.5">
                            {format(tradeDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-base font-black ${
                          isWin ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {isWin ? '+' : ''}${Math.abs(trade.profit_loss_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-slate-400 text-xs">
                          {(trade.profit_loss_percentage || 0) >= 0 ? '+' : ''}{(trade.profit_loss_percentage || 0).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }}>
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6 text-cyan-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Estatísticas Rápidas</h3>
                <p className="text-slate-400 text-xs">Visão geral da performance</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-800/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs">Maior Lucro Único</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    +$ {(topWinningTrades[0]?.profit_loss_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-slate-500 text-[10px]">
                  {topWinningTrades[0]?.pair || 'N/A'}
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs">Maior Perda Única</span>
                  <span className="text-red-400 font-bold text-sm">
                    $ {Math.abs(topLosingTrades[0]?.profit_loss_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-slate-500 text-[10px]">
                  {topLosingTrades[0]?.pair || 'N/A'}
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs">Total de Trades</span>
                  <span className="text-white font-bold text-sm">{completedTrades.length}</span>
                </div>
                <div className="text-slate-500 text-[10px]">
                  {aiCreatedTrades.length} IA • {manualTrades.length} Manual
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 text-xs font-semibold">Eficiência IA</span>
                  </div>
                  <span className="text-purple-400 font-black text-lg">{aiWinRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <Dialog open={!!selectedTrade} onOpenChange={() => setSelectedTrade(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          {selectedTrade && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  {selectedTrade.pair}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge className={`${
                    selectedTrade.type === "BUY" 
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  } border`}>
                    {selectedTrade.type}
                  </Badge>
                  {(selectedTrade.leverage || 1) > 1 && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 border">
                      {selectedTrade.leverage}x
                    </Badge>
                  )}
                  {selectedTrade.from_ai_trader && (
                    <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30 border">
                      <Sparkles className="w-3 h-3 mr-1" />
                      iA Trader
                    </Badge>
                  )}
                </div>

                <div className={`${
                  (selectedTrade.profit_loss_usd || 0) >= 0 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                } border rounded-xl p-4 text-center`}>
                  <div className={`text-3xl font-black ${
                    (selectedTrade.profit_loss_usd || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {(selectedTrade.profit_loss_usd || 0) >= 0 ? '+' : ''}${Math.abs(selectedTrade.profit_loss_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-lg font-semibold ${
                    (selectedTrade.profit_loss_percentage || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {(selectedTrade.profit_loss_percentage || 0) >= 0 ? '+' : ''}{(selectedTrade.profit_loss_percentage || 0).toFixed(2)}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800/30 rounded-lg p-2">
                    <div className="text-slate-400 mb-1">Entrada</div>
                    <div className="text-white font-semibold">${(selectedTrade.entry_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div className="bg-slate-800/30 rounded-lg p-2">
                    <div className="text-slate-400 mb-1">Saída</div>
                    <div className="text-white font-semibold">${(selectedTrade.current_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div className="bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/30">
                    <div className="text-emerald-400 mb-1">TP</div>
                    <div className="text-emerald-400 font-semibold">${(selectedTrade.take_profit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-2 border border-red-500/30">
                    <div className="text-red-400 mb-1">SL</div>
                    <div className="text-red-400 font-semibold">${(selectedTrade.stop_loss || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedTrade(null)}
                  className="w-full bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
                >
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}