import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { motion } from "framer-motion";
import PerformanceMetrics from "../components/portfolio/PerformanceMetrics";
import DailyProfitChart from "../components/portfolio/DailyProfitChart";
import PeriodSummary from "../components/portfolio/PeriodSummary";
import BestDaysAnalysis from "../components/portfolio/BestDaysAnalysis";
import GoalsManager from "../components/portfolio/GoalsManager";
import SignupDialog from "../components/SignupDialog";

export default function Portfolio() {
  const navigate = useNavigate();
  const [showSignupDialog, setShowSignupDialog] = useState(false);

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

  // Calcular lucro atual
  const currentProfit = trades
    .filter(t => t.status === "TAKE_PROFIT_HIT" || t.status === "STOP_LOSS_HIT" || t.status === "CLOSED")
    .reduce((sum, t) => sum + (t.profit_loss_usd || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-1">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Portfólio & Análise
              </span>
            </h1>
            <p className="text-slate-400">Dashboard completo de performance de trading</p>
          </div>
        </motion.div>

        {/* Métricas de Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <PerformanceMetrics trades={trades} user={user} />
        </motion.div>

        {/* Resumo por Período */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <PeriodSummary trades={trades} />
        </motion.div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <DailyProfitChart trades={trades} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <BestDaysAnalysis trades={trades} />
          </motion.div>
        </div>

        {/* Gerenciador de Metas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GoalsManager currentProfit={currentProfit} />
        </motion.div>
      </div>

      <SignupDialog open={showSignupDialog} onOpenChange={setShowSignupDialog} />
    </div>
  );
}