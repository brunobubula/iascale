import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus, Sparkles, TrendingUp, Target, Shield, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

export default function SignupDialog({ open, onOpenChange }) {
  const handleSignup = () => {
    base44.auth.redirectToLogin();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-purple-500/50 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-2xl md:text-3xl font-black mb-2">
            <Sparkles className="w-7 h-7 text-purple-400 animate-pulse" />
            Cadastre-se Grátis
            <Sparkles className="w-7 h-7 text-purple-400 animate-pulse" />
          </DialogTitle>
          <DialogDescription className="text-center text-slate-300 text-base mt-2">
            Desbloqueie acesso completo ao TradeMonitor Scale Cripto
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-start gap-3 p-4 bg-emerald-500/10 rounded-lg border-2 border-emerald-500/30"
          >
            <Zap className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-emerald-400 font-bold mb-1">🎯 Gerenciamento Completo de Trades</h4>
              <p className="text-slate-300 text-sm">Monitore seus trades em tempo real com preços atualizados via WebSocket</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-start gap-3 p-4 bg-purple-500/10 rounded-lg border-2 border-purple-500/30"
          >
            <Sparkles className="w-6 h-6 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-purple-400 font-bold mb-1">🤖 iA Trader Scale - Sinais Inteligentes</h4>
              <p className="text-slate-300 text-sm">Receba sinais gerados por IA com análise multi-timeframe profissional</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg border-2 border-blue-500/30"
          >
            <Target className="w-6 h-6 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-blue-400 font-bold mb-1">📊 Análise Completa de P/L</h4>
              <p className="text-slate-300 text-sm">Dashboards avançados, gráficos e estatísticas detalhadas</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-lg border-2 border-yellow-500/30"
          >
            <Shield className="w-6 h-6 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-yellow-400 font-bold mb-1">🔔 Alertas Inteligentes</h4>
              <p className="text-slate-300 text-sm">Notificações automáticas quando TP ou SL são atingidos</p>
            </div>
          </motion.div>

          <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border-2 border-emerald-500/50 rounded-xl p-4 mt-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <UserPlus className="w-6 h-6 text-emerald-400" />
              <h3 className="text-xl md:text-2xl font-black text-emerald-400">100% Gratuito para Começar!</h3>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                <span className="text-slate-300">Sem Cartão de Crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                <span className="text-slate-300">Acesso Imediato</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                <span className="text-slate-300">Cancele Quando Quiser</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-4">
          <Button
            onClick={handleSignup}
            className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white font-black text-lg py-6 shadow-lg shadow-purple-500/50"
          >
            <UserPlus className="w-6 h-6 mr-2" />
            Cadastrar Grátis Agora
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
          >
            Continuar Navegando
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}