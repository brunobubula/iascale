import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Shield, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CreditAuditAlert() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pendingAudits = [] } = useQuery({
    queryKey: ['pendingAudits'],
    queryFn: async () => {
      const audits = await base44.entities.CreditAuditLog.filter({ 
        status: 'pending_review' 
      }, '-created_date', 20);
      return audits;
    },
    enabled: user?.role === "admin",
    refetchInterval: 15000, // Verifica a cada 15 segundos
  });

  // Categorizar alertas por severidade
  const criticalAlerts = pendingAudits.filter(a => 
    a.action_taken === 'phantom_credits_detected' || 
    (a.asaas_payments_found === 0 && a.current_credits > 0)
  );
  
  const highAlerts = pendingAudits.filter(a => 
    (a.action_taken === 'excess_credits_detected' || a.action_taken === 'missing_credits_detected') &&
    Math.abs(a.credits_difference) > 10
  );

  const totalCritical = criticalAlerts.length;
  const totalHigh = highAlerts.length;

  useEffect(() => {
    if (pendingAudits.length > 0) {
      setDismissed(false);
    }
  }, [pendingAudits.length]);

  if (!user || user.role !== "admin" || pendingAudits.length === 0 || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        className="fixed top-20 right-4 z-[60] max-w-md"
      >
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl border-2 border-red-400 shadow-2xl overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <motion.div 
                  className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      "0 0 0 0 rgba(255, 255, 255, 0.4)",
                      "0 0 0 8px rgba(255, 255, 255, 0)",
                      "0 0 0 0 rgba(255, 255, 255, 0)"
                    ]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <AlertTriangle className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    Sistema de Auditoria
                    <motion.div
                      className="w-2 h-2 rounded-full bg-yellow-300"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </h3>
                  <p className="text-red-100 text-xs">Monitoramento ativo</p>
                </div>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mb-3">
              {totalCritical > 0 && (
                <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-300 animate-pulse" />
                    <span className="text-white font-bold text-sm">Alertas Críticos</span>
                    <span className="ml-auto text-red-100 font-black text-lg">{totalCritical}</span>
                  </div>
                  <p className="text-white/90 text-xs">Créditos fantasma detectados</p>
                  <div className="mt-2 space-y-1">
                    {criticalAlerts.slice(0, 2).map((audit) => (
                      <div key={audit.id} className="flex items-center justify-between text-xs">
                        <span className="text-white/80 truncate flex-1">{audit.user_email}</span>
                        <span className="text-yellow-300 font-bold ml-2">C${audit.current_credits.toFixed(2)}</span>
                      </div>
                    ))}
                    {totalCritical > 2 && (
                      <p className="text-white/70 text-xs">+{totalCritical - 2} outros</p>
                    )}
                  </div>
                </div>
              )}

              {totalHigh > 0 && (
                <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-orange-300" />
                    <span className="text-white font-bold text-sm">Alta Prioridade</span>
                    <span className="ml-auto text-red-100 font-black text-lg">{totalHigh}</span>
                  </div>
                  <p className="text-white/90 text-xs">Inconsistências encontradas</p>
                  <div className="mt-2 space-y-1">
                    {highAlerts.slice(0, 2).map((audit) => (
                      <div key={audit.id} className="flex items-center justify-between text-xs">
                        <span className="text-white/80 truncate flex-1">{audit.user_email}</span>
                        <span className="text-orange-300 font-bold ml-2">
                          {audit.credits_difference > 0 ? '+' : ''}C${audit.credits_difference.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <div className="text-white/70 text-[10px] mb-1">Total</div>
                <div className="text-white font-black text-lg">{pendingAudits.length}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <div className="text-white/70 text-[10px] mb-1">Último Check</div>
                <div className="text-white font-bold text-xs">Agora</div>
              </div>
            </div>

            <button
              onClick={() => navigate(createPageUrl("RecuperarPagamentos"))}
              className="w-full bg-white hover:bg-gray-100 text-red-600 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Revisar Agora
            </button>
          </div>

          <motion.div 
            className="h-1 bg-white/20"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 15, ease: "linear" }}
            key={pendingAudits.length}
          >
            <motion.div
              className="h-full bg-white"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 15, ease: "linear" }}
            />
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}