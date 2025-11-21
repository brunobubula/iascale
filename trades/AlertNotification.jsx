import React from "react";
import { motion } from "framer-motion";
import { X, Bell, TrendingUp, TrendingDown, BarChart3, CheckCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AlertNotification({ alert, trade, onDismiss, onNavigate, onHoverChange }) {
  const profitLoss = trade?.profit_loss_usd || 0;
  const isProfit = profitLoss >= 0;
  const isTPSL = alert?.isTPSL || false;
  const isTradeCreated = alert?.isTradeCreated || false;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      className="fixed top-20 right-4 z-[99999] w-[90vw] max-w-md pointer-events-auto"
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <div className={`${
        isTradeCreated
          ? "bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-400"
          : isTPSL 
            ? (alert.name.includes("Take Profit")
                ? "bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-400"
                : "bg-gradient-to-br from-red-600 to-red-700 border-red-400")
            : "bg-gradient-to-br from-yellow-600 to-orange-600 border-yellow-400"
      } border-2 rounded-xl shadow-2xl backdrop-blur-xl p-4`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            {isTradeCreated ? (
              <CheckCircle className="w-5 h-5 text-white" />
            ) : isTPSL ? (
              alert.name.includes("Take Profit") ? (
                <TrendingUp className="w-5 h-5 text-white" />
              ) : (
                <TrendingDown className="w-5 h-5 text-white" />
              )
            ) : (
              <Bell className="w-5 h-5 text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-white font-bold text-base mb-1">
              {alert?.name || "Alerta"}
            </h4>
            <p className="text-white/90 text-sm mb-2">
              {trade?.pair} - {trade?.type || ""}
            </p>

            {isTradeCreated && (
              <Button
                onClick={onNavigate}
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 h-8 text-xs font-semibold"
              >
                <Eye className="w-3.5 h-3.5 mr-2" />
                Ver Trade no Dashboard
              </Button>
            )}

            {isTPSL && (
              <Button
                onClick={onNavigate}
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 h-8 text-xs font-semibold"
              >
                <BarChart3 className="w-3.5 h-3.5 mr-2" />
                Ver Análise P/L
              </Button>
            )}
          </div>

          <button
            onClick={onDismiss}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}