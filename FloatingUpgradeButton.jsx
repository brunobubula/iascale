import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TRADE_CREATION_LIMITS = {
  free: { total: 10, active: 3 },
  pro: { total: 100, active: 20 },
  pro_plus: { total: 300, active: 50 },
  infinity_pro: { total: -1, active: -1 }
};

const AI_LIMITS = {
  free: 5,
  pro: 30,
  pro_plus: 100,
  infinity_pro: -1
};

export default function FloatingUpgradeButton() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.TradeSignal.list(),
    initialData: [],
    enabled: !!user,
  });

  if (!user) return null;

  const isAdmin = user.role === "admin";
  
  // Admin nunca vê o botão
  if (isAdmin) return null;

  const isPro = user.is_pro || false;
  const planType = user.pro_plan_type || 'free';
  const proExpiration = user.pro_expiration_date ? new Date(user.pro_expiration_date) : null;
  const isProActive = isPro && (!proExpiration || proExpiration > new Date());

  // Verifica se o plano está vencido
  const isPlanExpired = isPro && proExpiration && proExpiration < new Date();

  // Verifica limites
  const currentPlan = isProActive ? planType : 'free';
  const tradeLimits = TRADE_CREATION_LIMITS[currentPlan];
  const aiLimit = AI_LIMITS[currentPlan];
  const aiUsed = user.ai_trader_uses_count || 0;
  
  const totalTrades = trades.length;
  const activeTrades = trades.filter(t => t.status === "ACTIVE").length;
  
  const hasReachedTradeLimit = tradeLimits.total !== -1 && totalTrades >= tradeLimits.total;
  const hasReachedActiveLimit = tradeLimits.active !== -1 && activeTrades >= tradeLimits.active;
  const hasReachedAILimit = aiLimit !== -1 && aiUsed >= aiLimit;
  
  const hasReachedAnyLimit = hasReachedTradeLimit || hasReachedActiveLimit || hasReachedAILimit;

  // Mostra o botão para:
  // 1. Usuários FREE
  // 2. Planos vencidos
  // 3. Usuários que atingiram algum limite
  const shouldShow = !isProActive || isPlanExpired || hasReachedAnyLimit;
  
  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 100 }}
        animate={{ x: 0 }}
        exit={{ x: 100 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50"
        style={{ 
          transform: "translateY(-50%)",
          right: "-32px" // Mais para fora da tela
        }}
      >
        <Link 
          to={createPageUrl("SejaPRO")}
          className="block"
        >
          <motion.div
            whileHover={{ x: -32 }} // Menos deslizamento
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white px-2.5 py-2 rounded-l-lg shadow-xl cursor-pointer flex items-center gap-1.5 min-w-[90px] border border-white/20 relative overflow-hidden"
          >
            {/* Efeito de brilho animado */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '200%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />

            <ChevronLeft className="w-3.5 h-3.5 animate-pulse relative z-10" />
            
            <div className="flex flex-col relative z-10">
              {/* Texto "PRO" menor e mais discreto */}
              <span className="font-black text-sm whitespace-nowrap bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                PRO
              </span>
              <span className="text-[8px] opacity-80 font-semibold leading-tight">Upgrade</span>
            </div>
            
            <Crown className="w-3.5 h-3.5 animate-bounce text-yellow-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] relative z-10" />
          </motion.div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}