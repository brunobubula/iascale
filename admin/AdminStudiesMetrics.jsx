import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { 
  GraduationCap, 
  Eye, 
  DollarSign, 
  TrendingUp, 
  Target,
  Percent,
  Crown
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function AdminStudiesMetrics() {
  const navigate = useNavigate();
  
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['adminPerformance', 'all'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getAdminStudiesPerformance', { period: 'all' });
      return response.data;
    },
  });

  const summary = performanceData?.summary || {};

  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Métricas dos Estudos de Performance</h3>
            <p className="text-slate-400 text-xs">Performance geral dos estudos publicados</p>
          </div>
        </div>
        <Button
          onClick={() => navigate(createPageUrl("AdminPerformance"))}
          className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30"
          size="sm"
        >
          Ver Detalhes
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-500/30 border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-semibold">P/L Total</span>
            </div>
            <div className={`text-xl font-black ${
              (summary.total_pl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {(summary.total_pl || 0) >= 0 ? '+' : ''}${Math.abs(summary.total_pl || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-slate-400 text-xs mt-1">{summary.closed_studies || 0} estudos</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30 border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-xs font-semibold">Win Rate</span>
            </div>
            <div className="text-xl font-black text-white">
              {(summary.win_rate || 0).toFixed(1)}%
            </div>
            <p className="text-slate-400 text-xs mt-1">
              {summary.wins || 0} vitórias / {summary.losses || 0} derrotas
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30 border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 text-xs font-semibold">Visualizações</span>
            </div>
            <div className="text-xl font-black text-white">
              {summary.total_views || 0}
            </div>
            <p className="text-slate-400 text-xs mt-1">{summary.total_purchases || 0} compras</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="bg-gradient-to-br from-orange-900/30 to-yellow-900/30 border-orange-500/30 border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 text-xs font-semibold">Créditos Gerados</span>
            </div>
            <div className="text-xl font-black text-white">
              C$ {(summary.total_credits_generated || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-slate-400 text-xs mt-1">Receita estimada</p>
          </div>
        </motion.div>
      </div>

      {summary.total_studies === 0 && (
        <div className="mt-4 text-center py-4">
          <p className="text-slate-400 text-sm">Nenhum estudo publicado ainda.</p>
        </div>
      )}
    </Card>
  );
}