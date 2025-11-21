import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, DollarSign, Percent, Activity, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { format, startOfDay, endOfDay, subDays, addDays, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, subHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export default function DailyTracker({ trades, initialBalance }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const completedTrades = trades.filter(t =>
    t.status === "TAKE_PROFIT_HIT" || t.status === "STOP_LOSS_HIT" || t.status === "CLOSED"
  );

  const getDayTrades = (date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    return completedTrades.filter(trade => {
      let dateToCheck;
      if (trade.status === "CLOSED") {
        dateToCheck = trade.updated_date ? subHours(new Date(trade.updated_date), 3) : null;
      } else {
        dateToCheck = trade.created_date ? subHours(new Date(trade.created_date), 3) : null;
      }

      if (!dateToCheck || isNaN(dateToCheck.getTime())) return false;
      return dateToCheck >= dayStart && dateToCheck <= dayEnd;
    });
  };

  const calculateDayStats = (date) => {
    const dayTrades = getDayTrades(date);
    
    // Saldo antes deste dia (acumulado até o dia anterior)
    const dayStart = startOfDay(date);
    const tradesBeforeDay = completedTrades.filter(trade => {
      let dateToCheck;
      if (trade.status === "CLOSED") {
        dateToCheck = trade.updated_date ? subHours(new Date(trade.updated_date), 3) : null;
      } else {
        dateToCheck = trade.created_date ? subHours(new Date(trade.created_date), 3) : null;
      }
      if (!dateToCheck || isNaN(dateToCheck.getTime())) return false;
      return dateToCheck < dayStart;
    });

    const balanceStartOfDay = initialBalance + tradesBeforeDay.reduce((sum, t) => sum + (t.profit_loss_usd || 0), 0);
    
    const dayProfitUSD = dayTrades.reduce((sum, t) => sum + (t.profit_loss_usd || 0), 0);
    const balanceEndOfDay = balanceStartOfDay + dayProfitUSD;
    
    const dayProfitPercentage = balanceStartOfDay > 0 ? (dayProfitUSD / balanceStartOfDay) * 100 : 0;
    const wins = dayTrades.filter(t => (t.profit_loss_usd || 0) > 0).length;
    const losses = dayTrades.length - wins;

    return {
      trades: dayTrades,
      profitUSD: dayProfitUSD,
      profitPercentage: dayProfitPercentage,
      balanceStart: balanceStartOfDay,
      balanceEnd: balanceEndOfDay,
      wins,
      losses,
      total: dayTrades.length
    };
  };

  const getMonthStats = (date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    const monthTrades = completedTrades.filter(trade => {
      let dateToCheck;
      if (trade.status === "CLOSED") {
        dateToCheck = trade.updated_date ? subHours(new Date(trade.updated_date), 3) : null;
      } else {
        dateToCheck = trade.created_date ? subHours(new Date(trade.created_date), 3) : null;
      }
      if (!dateToCheck || isNaN(dateToCheck.getTime())) return false;
      return dateToCheck >= monthStart && dateToCheck <= monthEnd;
    });

    const monthProfitUSD = monthTrades.reduce((sum, t) => sum + (t.profit_loss_usd || 0), 0);
    return { profitUSD: monthProfitUSD, percentage: initialBalance > 0 ? (monthProfitUSD / initialBalance) * 100 : 0 };
  };

  const getYearStats = (date) => {
    const yearStart = startOfYear(date);
    const yearEnd = endOfYear(date);

    const yearTrades = completedTrades.filter(trade => {
      let dateToCheck;
      if (trade.status === "CLOSED") {
        dateToCheck = trade.updated_date ? subHours(new Date(trade.updated_date), 3) : null;
      } else {
        dateToCheck = trade.created_date ? subHours(new Date(trade.created_date), 3) : null;
      }
      if (!dateToCheck || isNaN(dateToCheck.getTime())) return false;
      return dateToCheck >= yearStart && dateToCheck <= yearEnd;
    });

    const yearProfitUSD = yearTrades.reduce((sum, t) => sum + (t.profit_loss_usd || 0), 0);
    return { profitUSD: yearProfitUSD, percentage: initialBalance > 0 ? (yearProfitUSD / initialBalance) * 100 : 0 };
  };

  const dayStats = calculateDayStats(selectedDate);
  const monthStats = getMonthStats(selectedDate);
  const yearStats = getYearStats(selectedDate);

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/70 backdrop-blur-xl border-slate-800/50 overflow-hidden">
      <div className="p-6">
        {/* Header com Navegação de Data */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Rastreador Diário</h2>
              <p className="text-slate-400 text-sm">Performance detalhada por dia</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDate(d => subDays(d, 1))}
              className="bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-white h-9 w-9"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setSelectedDate(new Date())}
              variant="outline"
              size="sm"
              className="bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-white text-xs px-3"
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDate(d => addDays(d, 1))}
              disabled={format(selectedDate, "yyyy-MM-dd") >= format(new Date(), "yyyy-MM-dd")}
              className="bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-white h-9 w-9"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Data Selecionada */}
        <div className="text-center mb-6">
          <div className="text-3xl font-black text-white mb-1">
            {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>
          <div className="text-slate-400 text-sm">
            {format(selectedDate, "EEEE", { locale: ptBR })}
          </div>
        </div>

        {/* Resultado do Dia - Grande Destaque */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDate.toISOString()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`${
              dayStats.profitUSD >= 0
                ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/50"
                : "bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/50"
            } border-2 rounded-2xl p-6 mb-6 text-center shadow-2xl`}
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              {dayStats.profitUSD >= 0 ? (
                <TrendingUp className="w-10 h-10 text-emerald-400" />
              ) : (
                <TrendingDown className="w-10 h-10 text-red-400" />
              )}
              <div className="text-slate-300 text-lg font-semibold">Resultado do Dia</div>
            </div>

            <div className={`text-5xl md:text-6xl font-black mb-2 ${
              dayStats.profitUSD >= 0 ? "text-emerald-400" : "text-red-400"
            }`}>
              {dayStats.profitUSD >= 0 ? "+" : ""}{Math.abs(dayStats.profitUSD).toFixed(2)}
            </div>

            <div className={`text-2xl font-bold mb-4 ${
              dayStats.profitPercentage >= 0 ? "text-emerald-300" : "text-red-300"
            }`}>
              {dayStats.profitPercentage >= 0 ? "+" : ""}{dayStats.profitPercentage.toFixed(2)}%
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-slate-400 text-xs mb-1">Vitórias</div>
                <div className="text-emerald-400 text-xl font-bold">{dayStats.wins}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs mb-1">Derrotas</div>
                <div className="text-red-400 text-xl font-bold">{dayStats.losses}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs mb-1">Total</div>
                <div className="text-white text-xl font-bold">{dayStats.total}</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Saldos do Dia */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400 text-sm">Saldo Inicial</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {dayStats.balanceStart.toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400 text-sm">Saldo Final</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {dayStats.balanceEnd.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Acumulados Mês e Ano */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-semibold">Acumulado Mês</span>
            </div>
            <div className={`text-3xl font-black ${
              monthStats.profitUSD >= 0 ? "text-emerald-400" : "text-red-400"
            }`}>
              {monthStats.profitUSD >= 0 ? "+" : ""}{Math.abs(monthStats.profitUSD).toFixed(2)}
            </div>
            <div className={`text-sm font-semibold mt-1 ${
              monthStats.percentage >= 0 ? "text-emerald-300" : "text-red-300"
            }`}>
              {monthStats.percentage >= 0 ? "+" : ""}{monthStats.percentage.toFixed(2)}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-300 text-sm font-semibold">Acumulado Ano</span>
            </div>
            <div className={`text-3xl font-black ${
              yearStats.profitUSD >= 0 ? "text-emerald-400" : "text-red-400"
            }`}>
              {yearStats.profitUSD >= 0 ? "+" : ""}{Math.abs(yearStats.profitUSD).toFixed(2)}
            </div>
            <div className={`text-sm font-semibold mt-1 ${
              yearStats.percentage >= 0 ? "text-emerald-300" : "text-red-300"
            }`}>
              {yearStats.percentage >= 0 ? "+" : ""}{yearStats.percentage.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Lista de Trades do Dia */}
        {dayStats.trades.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-white font-semibold">Operações do Dia ({dayStats.trades.length})</span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {dayStats.trades.map((trade) => (
                <div key={trade.id} className="bg-slate-800/30 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        (trade.profit_loss_usd || 0) >= 0 ? "bg-emerald-400" : "bg-red-400"
                      }`}></div>
                      <span className="text-white font-semibold">{trade.pair}</span>
                      <span className={`text-xs ${
                        trade.type === "BUY" ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {trade.type}
                      </span>
                    </div>
                    <div className={`font-bold ${
                      (trade.profit_loss_usd || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {(trade.profit_loss_usd || 0) >= 0 ? "+" : ""}{(trade.profit_loss_usd || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}