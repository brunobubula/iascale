import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, Download, Brain, Target, AlertTriangle, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";

export default function TradeInsightsPanel({ trades = [] }) {
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);

  const completedTrades = (trades || []).filter(t => 
    t.status === "TAKE_PROFIT_HIT" || t.status === "STOP_LOSS_HIT" || t.status === "CLOSED"
  );

  const activeTrades = (trades || []).filter(t => t.status === "ACTIVE");

  // P/L ao longo do tempo
  const plOverTime = useMemo(() => {
    const sortedTrades = [...completedTrades].sort((a, b) => 
      new Date(a.created_date) - new Date(b.created_date)
    );

    let cumulativePL = 0;
    return sortedTrades.map(trade => {
      cumulativePL += (trade.profit_loss_usd || 0);
      return {
        date: format(new Date(trade.created_date), "dd/MM", { locale: ptBR }),
        fullDate: format(new Date(trade.created_date), "dd/MM/yy HH:mm", { locale: ptBR }),
        pl: cumulativePL,
        pair: trade.pair
      };
    });
  }, [completedTrades]);

  // Distribuição de lucros por trade
  const profitDistribution = useMemo(() => {
    return completedTrades.map((trade, index) => ({
      index: index + 1,
      pair: trade.pair,
      pl: trade.profit_loss_usd || 0,
      type: trade.type
    }));
  }, [completedTrades]);

  // Análise de correlação entre pares
  const pairCorrelation = useMemo(() => {
    const pairStats = {};
    
    completedTrades.forEach(trade => {
      if (!pairStats[trade.pair]) {
        pairStats[trade.pair] = {
          count: 0,
          wins: 0,
          losses: 0,
          totalPL: 0,
          avgPL: 0
        };
      }
      
      pairStats[trade.pair].count++;
      pairStats[trade.pair].totalPL += (trade.profit_loss_usd || 0);
      
      if ((trade.profit_loss_usd || 0) > 0) {
        pairStats[trade.pair].wins++;
      } else {
        pairStats[trade.pair].losses++;
      }
    });

    Object.keys(pairStats).forEach(pair => {
      pairStats[pair].avgPL = pairStats[pair].totalPL / pairStats[pair].count;
      pairStats[pair].winRate = (pairStats[pair].wins / pairStats[pair].count) * 100;
    });

    return Object.entries(pairStats)
      .map(([pair, stats]) => ({ pair, ...stats }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 10);
  }, [completedTrades]);

  const generateAIInsights = async () => {
    setLoadingInsights(true);
    try {
      const activeTradesData = activeTrades.map(t => ({
        pair: t.pair,
        type: t.type,
        entry_price: t.entry_price,
        take_profit: t.take_profit,
        stop_loss: t.stop_loss,
        current_price: t.current_price,
        leverage: t.leverage
      }));

      const historicalData = completedTrades.slice(-50).map(t => ({
        pair: t.pair,
        type: t.type,
        profit_loss_percentage: t.profit_loss_percentage,
        profit_loss_usd: t.profit_loss_usd,
        status: t.status
      }));

      const prompt = `Você é um analista profissional de trading. Analise os seguintes dados e forneça insights:

TRADES ATIVOS (${activeTrades.length}):
${JSON.stringify(activeTradesData, null, 2)}

HISTÓRICO RECENTE (últimos 50):
${JSON.stringify(historicalData, null, 2)}

Forneça uma análise estruturada em JSON com:
1. probabilidades: Para cada trade ativo, estime a probabilidade (0-100%) de atingir TP vs SL baseado em padrões históricos
2. recomendacoes: Sugestões específicas para os trades ativos
3. padroes_identificados: Padrões de sucesso/fracasso identificados
4. alerta_risco: Trades com maior risco de SL`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            probabilidades: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  pair: { type: "string" },
                  prob_tp: { type: "number" },
                  prob_sl: { type: "number" },
                  confianca: { type: "string" }
                }
              }
            },
            recomendacoes: {
              type: "array",
              items: { type: "string" }
            },
            padroes_identificados: {
              type: "array",
              items: { type: "string" }
            },
            alerta_risco: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setAiInsights(response);
    } catch (error) {
      console.error("Erro ao gerar insights:", error);
      setAiInsights({ error: "Não foi possível gerar insights no momento" });
    } finally {
      setLoadingInsights(false);
    }
  };

  const exportToCSV = () => {
    const csvData = completedTrades.map(t => ({
      Par: t.pair,
      Tipo: t.type,
      "Preço Entrada": t.entry_price,
      "Preço Saída": t.current_price,
      "Take Profit": t.take_profit,
      "Stop Loss": t.stop_loss,
      Margem: t.entry_amount,
      Alavancagem: t.leverage,
      "P/L %": (t.profit_loss_percentage || 0).toFixed(2),
      "P/L USD": (t.profit_loss_usd || 0).toFixed(2),
      Status: t.status,
      "Data Criação": format(new Date(t.created_date), "dd/MM/yyyy HH:mm"),
      "Origem": t.from_ai_trader ? "IA Trader" : "Manual"
    }));

    const headers = Object.keys(csvData[0] || {}).join(",");
    const rows = csvData.map(row => Object.values(row).join(","));
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `trades_export_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* P/L ao Longo do Tempo */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">P/L Acumulado ao Longo do Tempo</h3>
                <p className="text-slate-400 text-xs">Evolução do saldo com todos os trades</p>
              </div>
            </div>
            <Button
              onClick={exportToCSV}
              disabled={completedTrades.length === 0}
              className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
          
          {plOverTime.length === 0 ? (
            <p className="text-slate-400 text-center py-12">Nenhum trade finalizado para análise</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={plOverTime}>
                <defs>
                  <linearGradient id="plGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => [`$ ${value.toFixed(2)}`, 'P/L Acumulado']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.fullDate;
                    }
                    return label;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="pl" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fill="url(#plGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      </motion.div>

      {/* Distribuição de Lucros */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Distribuição de Lucros por Trade</h3>
              <p className="text-slate-400 text-xs">Análise individual de cada operação</p>
            </div>
          </div>

          {profitDistribution.length === 0 ? (
            <p className="text-slate-400 text-center py-12">Nenhum trade finalizado</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={profitDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="index" stroke="#94a3b8" style={{ fontSize: '10px' }} label={{ value: 'Trade #', position: 'insideBottom', offset: -5, style: { fill: '#94a3b8', fontSize: '11px' } }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '10px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value, name, props) => [
                    `$ ${value.toFixed(2)}`,
                    `${props.payload.pair} (${props.payload.type})`
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="pl" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </motion.div>

      {/* Correlação entre Pares */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Análise de Desempenho por Par</h3>
              <p className="text-slate-400 text-xs">Taxa de acerto e lucro médio</p>
            </div>
          </div>

          {pairCorrelation.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Nenhum dado disponível</p>
          ) : (
            <div className="space-y-2">
              {pairCorrelation.map((item, index) => (
                <div key={item.pair} className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-8 h-8 rounded-lg ${
                        index === 0 ? "bg-yellow-500" :
                        index === 1 ? "bg-slate-400" :
                        index === 2 ? "bg-orange-600" : "bg-slate-600"
                      } flex items-center justify-center font-bold text-white text-sm`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <span className="text-white font-bold">{item.pair}</span>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className={`${
                            item.winRate >= 60 ? "bg-emerald-500/20 text-emerald-400" :
                            item.winRate >= 40 ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-red-500/20 text-red-400"
                          } border-0 text-xs`}>
                            {item.winRate.toFixed(0)}% WR
                          </Badge>
                          <span className="text-slate-400 text-xs">{item.count} trades</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-black text-sm ${item.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.totalPL >= 0 ? '+' : ''}${item.totalPL.toFixed(2)}
                      </div>
                      <div className="text-slate-400 text-xs">
                        Média: ${item.avgPL.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* IA Insights - Análise Preditiva */}
      {activeTrades.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/30 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">IA - Análise Preditiva</h3>
                  <p className="text-slate-400 text-xs">Insights baseados em padrões históricos</p>
                </div>
              </div>
              <Button
                onClick={generateAIInsights}
                disabled={loadingInsights}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                {loadingInsights ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analisando...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Gerar Insights
                  </>
                )}
              </Button>
            </div>

            {aiInsights && !aiInsights.error && (
              <div className="space-y-4">
                {/* Probabilidades */}
                {aiInsights.probabilidades && aiInsights.probabilidades.length > 0 && (
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-400" />
                      Probabilidades TP vs SL
                    </h4>
                    <div className="space-y-2">
                      {aiInsights.probabilidades.map((prob, idx) => (
                        <div key={idx} className="bg-slate-800/30 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-bold">{prob.pair}</span>
                            <Badge className={`${
                              prob.confianca === 'alta' ? 'bg-emerald-500/20 text-emerald-400' :
                              prob.confianca === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {prob.confianca}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-emerald-400">
                              TP: {prob.prob_tp}%
                            </div>
                            <div className="text-red-400">
                              SL: {prob.prob_sl}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recomendações */}
                {aiInsights.recomendacoes && aiInsights.recomendacoes.length > 0 && (
                  <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                    <h4 className="text-blue-400 font-semibold mb-2">📋 Recomendações</h4>
                    <ul className="space-y-1 text-slate-300 text-sm">
                      {aiInsights.recomendacoes.map((rec, idx) => (
                        <li key={idx}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Alertas de Risco */}
                {aiInsights.alerta_risco && aiInsights.alerta_risco.length > 0 && (
                  <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                    <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Alertas de Risco
                    </h4>
                    <ul className="space-y-1 text-slate-300 text-sm">
                      {aiInsights.alerta_risco.map((alert, idx) => (
                        <li key={idx}>⚠️ {alert}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {aiInsights?.error && (
              <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30 text-center">
                <p className="text-red-400">{aiInsights.error}</p>
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
}