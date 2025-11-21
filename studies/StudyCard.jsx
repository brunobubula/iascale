import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Lock, 
  Eye, 
  Sparkles, 
  Clock,
  CheckCircle2,
  XCircle,
  Target
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

export default function StudyCard({ study, hasAccess, onUnlock, isUnlimited, index = 0 }) {
  const isBuy = study.type === "BUY";
  const isActive = study.status === "ACTIVE";
  const isClosed = study.status === "CLOSED" || study.status === "TP_HIT" || study.status === "SL_HIT";
  const profitLoss = study.profit_loss_usd || 0;
  const isProfit = profitLoss >= 0;

  const statusConfig = {
    ACTIVE: { icon: Clock, label: "Ativo", color: "text-blue-400", bg: "bg-blue-500/20" },
    CLOSED: { icon: Eye, label: "Fechado", color: "text-slate-400", bg: "bg-slate-500/20" },
    TP_HIT: { icon: CheckCircle2, label: "TP Atingido", color: "text-emerald-400", bg: "bg-emerald-500/20" },
    SL_HIT: { icon: XCircle, label: "SL Atingido", color: "text-red-400", bg: "bg-red-500/20" }
  };

  const currentStatus = statusConfig[study.status] || statusConfig.ACTIVE;
  const StatusIcon = currentStatus.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`${
        hasAccess 
          ? "bg-slate-900/50 border-slate-700/50" 
          : "bg-slate-900/30 border-slate-800/50"
      } backdrop-blur-xl hover:border-emerald-500/30 transition-all cursor-pointer overflow-hidden`}>
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className={`font-bold text-base ${hasAccess ? 'text-white' : 'text-slate-400'}`}>
                  {study.title}
                </h3>
              </div>
              
              <div className="flex flex-wrap gap-1.5 mb-2">
                <Badge className={`${
                  isBuy 
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                } border text-xs`}>
                  {isBuy ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {study.type}
                </Badge>
                
                {study.leverage > 1 && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 border text-xs">
                    {study.leverage}x
                  </Badge>
                )}

                <Badge className={`${currentStatus.bg} ${currentStatus.color} border-current border text-xs`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {currentStatus.label}
                </Badge>
              </div>
            </div>

            {!hasAccess && (
              <Lock className="w-5 h-5 text-slate-500 flex-shrink-0" />
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Par:</span>
              <span className="text-white font-semibold">{study.pair}</span>
            </div>

            {hasAccess ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Entrada:</span>
                  <span className="text-white font-semibold">${study.entry_price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-emerald-400">Take Profit:</span>
                  <span className="text-emerald-400 font-semibold">${study.take_profit?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-red-400">Stop Loss:</span>
                  <span className="text-red-400 font-semibold">${study.stop_loss?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {isClosed && (
                  <div className={`mt-3 p-2 rounded-lg ${
                    isProfit ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`${isProfit ? 'text-emerald-400' : 'text-red-400'} font-semibold`}>Resultado:</span>
                      <span className={`${isProfit ? 'text-emerald-400' : 'text-red-400'} font-black text-base`}>
                        {isProfit ? '+' : ''}${Math.abs(profitLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700/50">
                <Lock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400 text-xs mb-2">Estudo Bloqueado</p>
                {isUnlimited ? (
                  <p className="text-emerald-400 text-xs font-semibold">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Acesso Ilimitado Ativo
                  </p>
                ) : (
                  <p className="text-orange-400 text-xs font-semibold">
                    C${study.cost_credits} para desbloquear
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-700/30 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {format(new Date(study.published_date || study.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
            
            <div className="flex items-center gap-1 text-slate-500">
              <Eye className="w-3 h-3" />
              <span>{study.views_count || 0}</span>
            </div>
          </div>

          {!hasAccess && (
            <Button
              onClick={onUnlock}
              className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm h-9"
            >
              {isUnlimited ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Desbloquear Estudo
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Desbloquear por C${study.cost_credits}
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}