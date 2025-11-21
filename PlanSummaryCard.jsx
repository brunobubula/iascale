import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, TrendingUp, AlertCircle, Sparkles, Infinity as InfinityIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export default function PlanSummaryCard({ trades }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  if (!user) return null;

  const isAdmin = user.role === "admin";
  if (isAdmin) return null; // Admin não precisa ver isso

  const isPro = user.is_pro || false;
  const planType = user.pro_plan_type || 'free';
  const proExpiration = user.pro_expiration_date ? new Date(user.pro_expiration_date) : null;
  const isProActive = isPro && (!proExpiration || proExpiration > new Date());

  const currentPlan = isProActive ? planType : 'free';

  // Limites por plano
  const planLimits = {
    free: { 
      name: "FREE",
      totalTrades: 10,
      activeTrades: 3,
      aiUses: 5,
      icon: AlertCircle,
      color: "slate",
      upgradeUrl: user.pro_payment_url_monthly || "#"
    },
    pro: { 
      name: "PRO",
      totalTrades: 100,
      activeTrades: 20,
      aiUses: 30,
      icon: Crown,
      color: "blue",
      upgradeUrl: user.pro_plus_payment_url_monthly || "#"
    },
    pro_plus: { 
      name: "PRO+",
      totalTrades: 300,
      activeTrades: 50,
      aiUses: 100,
      icon: Sparkles,
      color: "purple",
      upgradeUrl: user.infinity_payment_url_monthly || "#"
    },
    infinity_pro: { 
      name: "INFINITY PRO",
      totalTrades: -1,
      activeTrades: -1,
      aiUses: -1,
      icon: InfinityIcon,
      color: "emerald",
      upgradeUrl: null
    }
  };

  const plan = planLimits[currentPlan];
  const Icon = plan.icon;

  // Calcula uso atual
  const totalTrades = trades.length;
  const activeTrades = trades.filter(t => t.status === "ACTIVE").length;
  const aiUses = user.ai_trader_uses_count || 0;

  // Calcula percentuais
  const totalTradesPercent = plan.totalTrades === -1 ? 0 : (totalTrades / plan.totalTrades) * 100;
  const activeTradesPercent = plan.activeTrades === -1 ? 0 : (activeTrades / plan.activeTrades) * 100;
  const aiUsesPercent = plan.aiUses === -1 ? 0 : (aiUses / plan.aiUses) * 100;

  const isNearLimit = totalTradesPercent >= 80 || activeTradesPercent >= 80 || aiUsesPercent >= 80;
  const isAtLimit = totalTradesPercent >= 100 || activeTradesPercent >= 100 || aiUsesPercent >= 100;

  const colorClasses = {
    slate: { bg: "from-slate-700/20 to-slate-800/20", border: "border-slate-700/50", text: "text-slate-400", button: "from-slate-600 to-slate-700" },
    blue: { bg: "from-blue-500/20 to-blue-600/20", border: "border-blue-500/50", text: "text-blue-400", button: "from-blue-500 to-blue-600" },
    purple: { bg: "from-purple-500/20 to-pink-500/20", border: "border-purple-500/50", text: "text-purple-400", button: "from-purple-500 to-pink-500" },
    emerald: { bg: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/50", text: "text-emerald-400", button: "from-emerald-500 to-teal-500" }
  };

  const colors = colorClasses[plan.color];

  // Se for INFINITY, mostra um card especial comemorativo
  if (currentPlan === 'infinity_pro') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 sm:mb-6"
      >
        <Card className={`bg-gradient-to-br ${colors.bg} backdrop-blur-xl border-2 ${colors.border} overflow-hidden shadow-xl`}>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.button} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className={`text-lg sm:text-xl font-bold ${colors.text}`}>{plan.name}</h3>
                  <p className="text-slate-400 text-xs sm:text-sm">Acesso ilimitado a todos os recursos</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl sm:text-3xl font-black ${colors.text}`}>∞</div>
                <p className="text-slate-400 text-xs">Ilimitado</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 sm:mb-6"
    >
      <Card className={`bg-gradient-to-br ${colors.bg} backdrop-blur-xl border ${colors.border} overflow-hidden shadow-xl ${isAtLimit ? 'animate-pulse' : ''}`}>
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${colors.button} flex items-center justify-center shadow-lg flex-shrink-0`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white truncate">Plano {plan.name}</h3>
                <p className="text-slate-400 text-xs sm:text-sm truncate">
                  {isAtLimit ? "Limite atingido!" : isNearLimit ? "Próximo do limite" : "Uso dentro do limite"}
                </p>
              </div>
            </div>

            {plan.upgradeUrl && (
              <a href={plan.upgradeUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                <Button 
                  size="sm"
                  className={`bg-gradient-to-r ${colors.button} hover:opacity-90 text-white text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4`}
                >
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">Upgrade</span>
                  <span className="sm:hidden">Up</span>
                </Button>
              </a>
            )}
          </div>

          {/* Métricas */}
          <div className="space-y-3 sm:space-y-4">
            {/* Total de Trades */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-slate-300 text-xs sm:text-sm">Trades Criados</span>
                <span className={`font-bold text-xs sm:text-sm ${totalTradesPercent >= 100 ? 'text-red-400' : totalTradesPercent >= 80 ? 'text-yellow-400' : 'text-slate-400'}`}>
                  {totalTrades} / {plan.totalTrades}
                </span>
              </div>
              <Progress value={totalTradesPercent} className="h-1.5 sm:h-2" />
            </div>

            {/* Trades Ativos */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-slate-300 text-xs sm:text-sm">Trades Ativos</span>
                <span className={`font-bold text-xs sm:text-sm ${activeTradesPercent >= 100 ? 'text-red-400' : activeTradesPercent >= 80 ? 'text-yellow-400' : 'text-slate-400'}`}>
                  {activeTrades} / {plan.activeTrades}
                </span>
              </div>
              <Progress value={activeTradesPercent} className="h-1.5 sm:h-2" />
            </div>

            {/* Uso da iA Trader */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-slate-300 text-xs sm:text-sm">iA Trader (mês)</span>
                <span className={`font-bold text-xs sm:text-sm ${aiUsesPercent >= 100 ? 'text-red-400' : aiUsesPercent >= 80 ? 'text-yellow-400' : 'text-slate-400'}`}>
                  {aiUses} / {plan.aiUses}
                </span>
              </div>
              <Progress value={aiUsesPercent} className="h-1.5 sm:h-2" />
            </div>
          </div>

          {/* Alerta quando perto do limite */}
          {isAtLimit && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-xs sm:text-sm font-semibold">
                ⚠️ Você atingiu o limite do seu plano. Faça upgrade para continuar!
              </p>
            </div>
          )}

          {isNearLimit && !isAtLimit && (
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-yellow-400 text-xs sm:text-sm font-semibold">
                ⚡ Você está próximo do limite. Considere fazer upgrade!
              </p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}