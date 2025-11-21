import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Activity, Target, Trophy, Award, Calendar as CalendarIcon, Sparkles, ArrowLeft, BarChart3, Percent, DollarSign, TrendingUpDown, Calculator, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  subDays,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  parseISO,
  addHours,
  subHours
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SignupDialog from "../components/SignupDialog";
import DailyTracker from "../components/pl/DailyTracker";
import CompoundCalculator from "../components/pl/CompoundCalculator";
import TradeInsightsPanel from "../components/analytics/TradeInsightsPanel";
import PerformanceDashboard from "../components/analytics/PerformanceDashboard";

export default function AnalisePL() {
  const [dateFilter, setDateFilter] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAiAnalysis, setLoadingAiAnalysis] = useState(false);
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [showDailyTracker, setShowDailyTracker] = useState(false);
  const [showCompoundCalc, setShowCompoundCalc] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");

  const navigate = useNavigate();

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.TradeSignal.list("-created_date"),
    initialData: [],
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        return null;
      }
    },
  });

  const isGuest = !user;

  const getFilteredTrades = () => {
    const now = new Date();
    let startDate, endDate;

    switch (dateFilter) {
      case "today":
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case "week":
        startDate = startOfDay(subDays(now, 56));
        endDate = endOfDay(now);
        break;
      case "month":
        startDate = startOfMonth(subMonths(now, 11));
        endDate = endOfMonth(now);
        break;
      case "year":
        startDate = startOfYear(subYears(now, 4));
        endDate = endOfYear(now);
        break;
      case "custom":
        if (!customStartDate || !customEndDate) return trades;
        startDate = startOfDay(parseISO(customStartDate));
        endDate = endOfDay(parseISO(customEndDate));
        break;
      default:
        return trades;
    }

    return trades.filter(trade => {
      let dateToCheck;
      if (trade.status === "CLOSED") {
        dateToCheck = trade.updated_date ? subHours(new Date(trade.updated_date), 3) : null;
      } else if (trade.status === "TAKE_PROFIT_HIT" || trade.status === "STOP_LOSS_HIT") {
        dateToCheck = trade.created_date ? subHours(new Date(trade.created_date), 3) : null;
      } else {
        return false;
      }
      
      if (!dateToCheck || isNaN(dateToCheck.getTime())) return false;
      
      return dateToCheck >= startDate && dateToCheck <= endDate;
    });
  };

  const filteredTrades = getFilteredTrades();
  
  const completedTrades = filteredTrades.filter(t => 
    t.status === "TAKE_PROFIT_HIT" || t.status === "STOP_LOSS_HIT" || t.status === "CLOSED"
  );
  const wonTrades = filteredTrades.filter(t => 
    t.status === "TAKE_PROFIT_HIT" || (t.status === "CLOSED" && (t.profit_loss_usd || 0) > 0)
  );
  const lostTrades = filteredTrades.filter(t => 
    t.status === "STOP_LOSS_HIT" || (t.status === "CLOSED" && (t.profit_loss_usd || 0) < 0)
  );

  const HISTORY_PER_PAGE = 10;
  const totalHistoryPages = Math.ceil(completedTrades.length / HISTORY_PER_PAGE);
  const startHistoryIndex = (historyPage - 1) * HISTORY_PER_PAGE;
  const endHistoryIndex = startHistoryIndex + HISTORY_PER_PAGE;
  const paginatedHistoryTrades = completedTrades.slice(startHistoryIndex, endHistoryIndex);

  const totalProfitUSD = filteredTrades.reduce((sum, trade) => {
    const profitLoss = trade.profit_loss_usd || 0;
    return profitLoss > 0 ? sum + profitLoss : sum;
  }, 0);

  const totalLossUSD = Math.abs(filteredTrades.reduce((sum, trade) => {
    const profitLoss = trade.profit_loss_usd || 0;
    return profitLoss < 0 ? sum + profitLoss : sum;
  }, 0));

  const netProfitUSD = totalProfitUSD - totalLossUSD;
  const initialBalance = user?.initial_balance || 0;
  const roi = initialBalance > 0 ? (netProfitUSD / initialBalance) * 100 : 0;
  const winRate = completedTrades.length > 0 ? (wonTrades.length / completedTrades.length) * 100 : 0;
  const rentabilidade = initialBalance > 0 ? (netProfitUSD / initialBalance) * 100 : 0;

  const pairStats = {};
  completedTrades.forEach(trade => {
    if (!pairStats[trade.pair]) {
      pairStats[trade.pair] = { wins: 0, losses: 0, total: 0, profitUSD: 0 };
    }
    pairStats[trade.pair].total++;
    if ((trade.profit_loss_usd || 0) > 0) {
      pairStats[trade.pair].wins++;
      pairStats[trade.pair].profitUSD += trade.profit_loss_usd || 0;
    } else {
      pairStats[trade.pair].losses++;
      pairStats[trade.pair].profitUSD += trade.profit_loss_usd || 0;
    }
  });

  const topPairs = Object.entries(pairStats)
    .map(([pair, stats]) => ({
      pair,
      ...stats,
      winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0
    }))
    .sort((a, b) => b.profitUSD - a.profitUSD)
    .slice(0, 5);

  const typeStats = {
    BUY: { wins: 0, losses: 0, total: 0, profitUSD: 0 },
    SELL: { wins: 0, losses: 0, total: 0, profitUSD: 0 }
  };

  completedTrades.forEach(trade => {
    if (typeStats[trade.type]) {
      typeStats[trade.type].total++;
      if ((trade.profit_loss_usd || 0) > 0) {
        typeStats[trade.type].wins++;
        typeStats[trade.type].profitUSD += trade.profit_loss_usd || 0;
      } else {
        typeStats[trade.type].losses++;
        typeStats[trade.type].profitUSD += trade.profit_loss_usd || 0;
      }
    }
  });

  const operationTypes = Object.entries(typeStats).map(([type, stats]) => ({
    type,
    ...stats,
    winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0
  }));

  const getBalanceHistory = () => {
    const allCompletedTrades = trades.filter(t => 
      t.status === "TAKE_PROFIT_HIT" || t.status === "STOP_LOSS_HIT" || t.status === "CLOSED"
    );

    const sortedTrades = [...allCompletedTrades].sort((a, b) => {
      const dateA = a.status === "CLOSED" ? new Date(a.updated_date) : new Date(a.created_date);
      const dateB = b.status === "CLOSED" ? new Date(b.updated_date) : new Date(b.created_date);
      return dateA - dateB;
    });

    let runningBalance = initialBalance;
    const balanceData = [
      { label: "Início", balance: initialBalance, trades: 0 }
    ];

    sortedTrades.forEach((trade, index) => {
      runningBalance += (trade.profit_loss_usd || 0);
      const tradeDate = trade.status === "CLOSED" 
        ? new Date(trade.updated_date)
        : new Date(trade.created_date);
      
      balanceData.push({
        label: format(tradeDate, "dd/MM"),
        balance: runningBalance,
        trades: index + 1,
        profitLoss: trade.profit_loss_usd || 0
      });
    });

    return balanceData.slice(-20);
  };

  const balanceHistory = getBalanceHistory();

  const generateAiAnalysis = async (trade) => {
    setLoadingAiAnalysis(true);
    try {
      const isBuy = trade.type === "BUY";
      const profitLoss = trade.profit_loss_percentage || 0;
      const profitLossUSD = trade.profit_loss_usd || 0;
      const leverage = trade.leverage || 1;
      const isFromAI = trade.from_ai_trader === true;
      
      const prompt = `Você é um analista de trading expert. Analise este trade finalizado:

Par: ${trade.pair}
Tipo: ${isBuy ? "COMPRA" : "VENDA"}
Alavancagem: ${leverage}x
Entrada: $ ${trade.entry_price?.toFixed(2)}
Saída: $ ${trade.current_price?.toFixed(2)}
Take Profit: $ ${trade.take_profit?.toFixed(2)}
Stop Loss: $ ${trade.stop_loss?.toFixed(2)}
Resultado: ${profitLoss >= 0 ? "+" : ""}${profitLoss.toFixed(2)}% (${profitLossUSD >= 0 ? "+" : ""}$ ${profitLossUSD.toFixed(2)})
Status: ${trade.status === "TAKE_PROFIT_HIT" ? "TP Atingido" : trade.status === "STOP_LOSS_HIT" ? "SL Atingido" : "Fechado Manualmente"}
Criado pela iA Trader: ${isFromAI ? "SIM" : "NÃO"}

Faça uma análise em 3 parágrafos curtos:

1. **Análise do Resultado**: Explique brevemente o que aconteceu neste trade e por que deu esse resultado.

2. **Pontos de Melhoria**: ${isFromAI ? "Mesmo com a iA Trader, sempre há aprendizados. " : ""}Sugira melhorias para trades futuros.

3. **Recomendação Final**: ${isFromAI ? "Destaque a eficácia da iA Trader Scale neste trade e incentive o uso contínuo." : "Recomende fortemente o uso da iA Trader Scale para melhorar análises e resultados, explicando como ela poderia ter ajudado neste trade específico."}

Seja direto, profissional e sempre termine incentivando o uso da iA Trader Scale como ferramenta essencial.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false,
      });

      setAiAnalysis(response);
    } catch (error) {
      console.error("Erro ao gerar análise:", error);
      setAiAnalysis("Não foi possível gerar a análise no momento. Tente novamente.");
    } finally {
      setLoadingAiAnalysis(false);
    }
  };

  const handleTradeClick = async (trade) => {
    if (isGuest) {
      setShowSignupDialog(true);
      return;
    }

    setSelectedTrade(trade);
    setAiAnalysis(null);
    await generateAiAnalysis(trade);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const getPeriodLabel = () => {
    switch (dateFilter) {
      case "today": return "Hoje";
      case "week": return "Últimas 8 Semanas";
      case "month": return "Últimos 12 Meses";
      case "year": return "Últimos 5 Anos";
      case "custom":
        if (!customStartDate || !customEndDate) return "Personalizado";
        return `${format(parseISO(customStartDate), "dd/MM", { locale: ptBR })} - ${format(parseISO(customEndDate), "dd/MM", { locale: ptBR })}`;
      default: return "Período";
    }
  };

  // Calcular retorno médio mensal
  const allCompleted = trades.filter(t => 
    t.status === "TAKE_PROFIT_HIT" || t.status === "STOP_LOSS_HIT" || t.status === "CLOSED"
  );
  const totalProfit = allCompleted.reduce((sum, t) => sum + (t.profit_loss_usd || 0), 0);
  const averageMonthlyReturn = initialBalance > 0 ? ((totalProfit / initialBalance) / 12) * 100 : 10;

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-4xl font-black text-white bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Análise de P/L
            </h1>
            <p className="text-slate-400 text-sm mt-1">Dashboard completo de performance</p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowDailyTracker(!showDailyTracker)}
              variant={showDailyTracker ? "default" : "outline"}
              size="sm"
              className={showDailyTracker 
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0"
                : "bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700"
              }
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Rastreador
            </Button>
            <Button
              onClick={() => setShowCompoundCalc(!showCompoundCalc)}
              variant={showCompoundCalc ? "default" : "outline"}
              size="sm"
              className={showCompoundCalc
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                : "bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700"
              }
            >
              <Calculator className="w-4 h-4 mr-2" />
              Projeções
            </Button>
          </div>
        </div>

        {/* Ferramentas Expandidas */}
        {showDailyTracker && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <DailyTracker trades={trades} initialBalance={initialBalance} />
          </motion.div>
        )}

        {showCompoundCalc && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <CompoundCalculator initialBalance={initialBalance} averageMonthlyReturn={averageMonthlyReturn} />
          </motion.div>
        )}

        {/* Tabs Principais */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-800/50 border border-slate-700/50 w-full grid grid-cols-3 h-auto">
                <TabsTrigger value="summary" className="text-xs md:text-sm">Resumo P/L</TabsTrigger>
                <TabsTrigger value="performance" className="text-xs md:text-sm">Performance</TabsTrigger>
                <TabsTrigger value="insights" className="text-xs md:text-sm">Análises</TabsTrigger>
              </TabsList>
            </Tabs>
          </Card>
        </motion.div>

        {activeTab === "summary" && (
          <>
            {/* Filtro de Período */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-4 md:p-6">
                <Tabs value={dateFilter} onValueChange={(value) => { setDateFilter(value); setHistoryPage(1); }}>
                  <TabsList className="bg-slate-800/50 border border-slate-700/50 w-full grid grid-cols-5 h-auto">
                    <TabsTrigger value="today" className="text-xs">Hoje</TabsTrigger>
                    <TabsTrigger value="week" className="text-xs">8 Sem</TabsTrigger>
                    <TabsTrigger value="month" className="text-xs">12 Mês</TabsTrigger>
                    <TabsTrigger value="year" className="text-xs">5 Anos</TabsTrigger>
                    <TabsTrigger value="custom" className="text-xs">Custom</TabsTrigger>
                  </TabsList>
                </Tabs>

            {dateFilter === "custom" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div>
                  <Label className="text-slate-300 text-xs">Data Início</Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => {setCustomStartDate(e.target.value); setHistoryPage(1);}}
                    className="bg-slate-800/50 border-slate-700 text-white h-9"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">Data Fim</Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => {setCustomEndDate(e.target.value); setHistoryPage(1);}}
                    className="bg-slate-800/50 border-slate-700 text-white h-9"
                  />
                </div>
              </div>
            )}
              </Card>
            </motion.div>

            {/* Cards Principais - Grid 2 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* CARD 1: Ganhos e Perdas */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-4 md:p-6 h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Ganhos e Perdas</h3>
                  <p className="text-slate-400 text-xs">Performance da conta</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* ROI */}
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 text-xs font-semibold">ROI</span>
                  </div>
                  <div className={`text-2xl font-black ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                  </div>
                  <p className="text-slate-400 text-[10px] mt-1">Retorno sobre Investimento</p>
                </div>

                {/* WND (Win Rate) */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 text-xs font-semibold">WND</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {winRate.toFixed(1)}%
                  </div>
                  <p className="text-slate-400 text-[10px] mt-1">
                    {wonTrades.length}V / {lostTrades.length}D
                  </p>
                </div>
              </div>

              {/* Gráfico de Barras */}
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[
                  { name: "Lucros", value: totalProfitUSD, color: "#10b981" },
                  { name: "Perdas", value: totalLossUSD, color: "#ef4444" }
                ]}>
                  <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(value) => `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {[
                      { name: "Lucros", value: totalProfitUSD, color: "#10b981" },
                      { name: "Perdas", value: totalLossUSD, color: "#ef4444" }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* CARD 2: Rentabilidade */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-4 md:p-6 h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center">
                  <TrendingUpDown className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Rentabilidade</h3>
                  <p className="text-slate-400 text-xs">Evolução patrimonial</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-800/30 rounded-xl p-3">
                  <div className="text-slate-400 text-xs mb-1">Saldo Inicial</div>
                  <div className="text-white text-lg font-bold">
                    {initialBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-3">
                  <div className="text-slate-400 text-xs mb-1">Saldo Atual</div>
                  <div className="text-white text-lg font-bold">
                    {(initialBalance + netProfitUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Rentabilidade Destaque */}
              <div className={`${
                rentabilidade >= 0 
                  ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-emerald-500/50' 
                  : 'bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/50'
              } border-2 rounded-xl p-4 mb-4 text-center`}>
                <div className="text-slate-300 text-xs mb-2">Rentabilidade Total</div>
                <div className={`text-4xl font-black flex items-center justify-center gap-2 ${
                  rentabilidade >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {rentabilidade >= 0 ? (
                    <TrendingUp className="w-8 h-8" />
                  ) : (
                    <TrendingDown className="w-8 h-8" />
                  )}
                  {rentabilidade >= 0 ? '+' : ''}{rentabilidade.toFixed(2)}%
                </div>
                <div className={`text-base font-semibold mt-1 ${
                  netProfitUSD >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {netProfitUSD >= 0 ? '+' : ''}{netProfitUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Mini Gráfico de Linha */}
              {balanceHistory.length > 1 && (
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={balanceHistory}>
                    <defs>
                      <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={netProfitUSD >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={netProfitUSD >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '10px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '11px'
                      }}
                      formatter={(value) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="balance" 
                      stroke={netProfitUSD >= 0 ? "#10b981" : "#ef4444"} 
                      strokeWidth={2}
                      fill="url(#balanceGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Grid: Top Pares e Por Tipo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white">Top 5 Pares</h3>
                  <p className="text-slate-400 text-xs">Melhores performances</p>
                </div>
              </div>
              <div className="space-y-2">
                {topPairs.length === 0 ? (
                  <p className="text-slate-400 text-center py-8 text-sm">Nenhum trade finalizado</p>
                ) : (
                  topPairs.map((pair, index) => (
                    <div key={pair.pair} className="bg-slate-800/30 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg ${
                            index === 0 ? "bg-yellow-500" :
                            index === 1 ? "bg-slate-400" :
                            index === 2 ? "bg-orange-600" : "bg-slate-600"
                          } flex items-center justify-center font-bold text-white text-xs`}>
                            {index + 1}
                          </div>
                          <span className="text-white font-semibold text-sm">{pair.pair}</span>
                        </div>
                        <div className="text-emerald-400 font-semibold text-sm">{pair.winRate.toFixed(0)}%</div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-slate-400">{pair.wins}V / {pair.losses}D</div>
                        <div className={`font-semibold ${pair.profitUSD >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {pair.profitUSD >= 0 ? "+" : ""}{pair.profitUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6 text-purple-400" />
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white">Por Tipo</h3>
                  <p className="text-slate-400 text-xs">Compra vs Venda</p>
                </div>
              </div>
              <div className="space-y-3">
                {operationTypes.map((op) => (
                  <div key={op.type} className="bg-slate-800/30 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {op.type === "BUY" ? (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-white font-semibold text-sm">{op.type === "BUY" ? "COMPRA" : "VENDA"}</span>
                      </div>
                      <div className="text-emerald-400 font-semibold text-sm">{op.winRate.toFixed(0)}%</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-slate-400 mb-1">Vitórias</div>
                        <div className="text-white font-semibold">{op.wins}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 mb-1">Derrotas</div>
                        <div className="text-white font-semibold">{op.losses}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 mb-1">P/L</div>
                        <div className={`font-semibold ${op.profitUSD >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {op.profitUSD >= 0 ? "+" : ""}{op.profitUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Histórico de Trades */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white">Histórico - {getPeriodLabel()}</h3>
                  <p className="text-slate-400 text-xs">{completedTrades.length} trades finalizados</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {paginatedHistoryTrades.length === 0 ? (
                <p className="text-slate-400 text-center py-8 text-sm">Nenhum trade finalizado neste período</p>
              ) : (
                paginatedHistoryTrades.map((trade) => {
                  const tradeDate = trade.status === "CLOSED" 
                    ? addHours(new Date(trade.updated_date), -3)
                    : addHours(new Date(trade.created_date), -3);
                  
                  return (
                    <div
                      key={trade.id}
                      onClick={() => handleTradeClick(trade)}
                      className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          trade.status === "TAKE_PROFIT_HIT" ? "bg-emerald-400" : 
                          trade.status === "CLOSED" && (trade.profit_loss_usd || 0) > 0 ? "bg-emerald-400" :
                          "bg-red-400"
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-semibold text-sm">{trade.pair}</span>
                            <Badge className={`${
                              trade.type === "BUY" 
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                                : "bg-red-500/20 text-red-400 border-red-500/30"
                            } border text-[10px] px-1.5 py-0`}>
                              {trade.type === "BUY" ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                              {trade.type}
                            </Badge>
                            {trade.from_ai_trader && (
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 border text-[10px] px-1.5 py-0">
                                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                                iA
                              </Badge>
                            )}
                          </div>
                          <div className="text-slate-400 text-xs mt-0.5">
                            {format(tradeDate, "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <div className={`text-base md:text-lg font-bold ${
                          (trade.profit_loss_usd || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}>
                          {(trade.profit_loss_usd || 0) >= 0 ? "+" : ""}{Math.abs(trade.profit_loss_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-slate-400 text-xs">
                          {(trade.profit_loss_percentage || 0) >= 0 ? "+" : ""}{(trade.profit_loss_percentage || 0).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {totalHistoryPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  disabled={historyPage === 1}
                  className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white disabled:opacity-30 text-xs"
                >
                  Voltar
                </Button>
                <span className="text-slate-400 text-sm px-2">
                  {historyPage} / {totalHistoryPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                  disabled={historyPage === totalHistoryPages}
                  className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white disabled:opacity-30 text-xs"
                >
                  Próxima
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
          </>
        )}

        {activeTab === "performance" && (
          <PerformanceDashboard trades={trades} user={user} />
        )}

        {activeTab === "insights" && (
          <TradeInsightsPanel trades={trades} />
        )}
      </div>

      <Dialog open={!!selectedTrade} onOpenChange={() => setSelectedTrade(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          {selectedTrade && (
            <>
              <DialogHeader className="mb-3">
                <DialogTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Detalhes - {selectedTrade.pair}
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
                      iA Scale
                    </Badge>
                  )}
                </div>

                <div className={`${
                  (selectedTrade.profit_loss_usd || 0) >= 0 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                } border rounded-xl p-3 text-center`}>
                  <div className={`text-3xl font-black mb-1 ${
                    (selectedTrade.profit_loss_usd || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {(selectedTrade.profit_loss_usd || 0) >= 0 ? "+" : ""}{(selectedTrade.profit_loss_usd || 0).toFixed(2)}
                  </div>
                  <div className={`text-lg font-semibold ${
                    (selectedTrade.profit_loss_percentage || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {(selectedTrade.profit_loss_percentage || 0) >= 0 ? "+" : ""}{(selectedTrade.profit_loss_percentage || 0).toFixed(2)}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800/20 rounded-lg p-2">
                    <div className="text-slate-400 mb-1">Entrada</div>
                    <div className="text-white font-semibold">{(selectedTrade.entry_price || 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-800/20 rounded-lg p-2">
                    <div className="text-slate-400 mb-1">Saída</div>
                    <div className="text-white font-semibold">{(selectedTrade.current_price || 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/30">
                    <div className="text-emerald-400 mb-1">TP</div>
                    <div className="text-emerald-400 font-semibold">{(selectedTrade.take_profit || 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-2 border border-red-500/30">
                    <div className="text-red-400 mb-1">SL</div>
                    <div className="text-red-400 font-semibold">{(selectedTrade.stop_loss || 0).toFixed(2)}</div>
                  </div>
                </div>

                <div className="bg-slate-800/20 rounded-lg p-2 text-xs">
                  <div className="text-slate-400 mb-1">Data de Finalização</div>
                  <div className="text-white">
                    {format(
                      selectedTrade.status === "CLOSED" 
                        ? addHours(new Date(selectedTrade.updated_date), -3)
                        : addHours(new Date(selectedTrade.created_date), -3), 
                      "dd/MM/yyyy 'às' HH:mm", 
                      { locale: ptBR }
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-3 border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h4 className="text-white font-semibold text-sm">Análise da iA Trader Scale</h4>
                  </div>
                  
                  {loadingAiAnalysis ? (
                    <div className="flex items-center gap-2 py-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                      <span className="text-slate-300 text-xs">Gerando análise detalhada...</span>
                    </div>
                  ) : (
                    <div className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                      {aiAnalysis || "Carregando..."}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTrade(null)}
                  className="w-full bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white text-sm"
                >
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      <SignupDialog open={showSignupDialog} onOpenChange={setShowSignupDialog} />
    </div>
  );
}