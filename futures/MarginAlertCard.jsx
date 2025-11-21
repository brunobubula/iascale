import React from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MarginAlertCard({ alerts, onDismiss }) {
  return (
    <AnimatePresence>
      {alerts.map((alert) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-4 top-24 z-50 w-80"
          style={{ top: `${100 + alerts.indexOf(alert) * 120}px` }}
        >
          <Card className={`border-2 ${
            alert.level === 100 ? 'bg-red-900/90 border-red-500' :
            alert.level === 90 ? 'bg-orange-900/90 border-orange-500' :
            alert.level === 80 ? 'bg-yellow-900/90 border-yellow-500' :
            'bg-blue-900/90 border-blue-500'
          } backdrop-blur-xl`}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-5 h-5 ${
                    alert.level >= 90 ? 'text-red-400' : 
                    alert.level >= 80 ? 'text-yellow-400' : 
                    'text-blue-400'
                  }`} />
                  <h4 className="text-white font-bold">Alerta de Margem</h4>
                </div>
                <button
                  onClick={() => onDismiss(alert.id)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-white text-sm mb-1">
                <span className="font-bold">{alert.symbol}</span> - {alert.side}
              </div>
              <div className="text-white/90 text-sm">
                Margem utilizada: <span className="font-bold">{alert.level}%</span>
              </div>
              <div className="text-white/70 text-xs mt-2">
                {alert.level === 100 ? 'Risco crítico de liquidação!' :
                 alert.level >= 90 ? 'Muito próximo da liquidação' :
                 alert.level >= 80 ? 'Atenção: Alta utilização de margem' :
                 'Margem atingindo níveis elevados'}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}